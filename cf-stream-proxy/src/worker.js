/**
 * ParcFermé HLS Stream Proxy — Cloudflare Worker
 *
 * Offloads all video proxying from Vercel serverless functions to
 * Cloudflare's edge (free unlimited bandwidth). Mirrors the logic
 * that was previously in /api/stream/route.ts.
 */

// Max response size: 15 MB
const MAX_RESPONSE_BYTES = 15 * 1024 * 1024;

// CDN domains discovered during manifest rewriting are trusted for segment requests
const trustedCdnDomains = new Set();

function isBlockedUrl(url) {
    try {
        const parsed = new URL(url);
        const h = parsed.hostname.toLowerCase();
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return true;
        if (h === "localhost" || h === "127.0.0.1" || h === "0.0.0.0" || h === "::1") return true;
        if (h.endsWith(".local") || h.endsWith(".internal") || h.endsWith(".localhost")) return true;
        if (h.startsWith("10.")) return true;
        if (h.startsWith("192.168.")) return true;
        if (h.startsWith("172.")) {
            const second = parseInt(h.split(".")[1], 10);
            if (second >= 16 && second <= 31) return true;
        }
        if (h.startsWith("fe80:") || h.startsWith("fd") || h === "[::1]") return true;
        if (h === "169.254.169.254" || h === "metadata.google.internal") return true;
        return false;
    } catch {
        return true;
    }
}

function isDomainAllowed(url, allowedDomains) {
    if (allowedDomains.size === 0) return true;
    try {
        const hostname = new URL(url).hostname.toLowerCase();
        const inAllowlist = Array.from(allowedDomains).some(
            (d) => hostname === d || hostname.endsWith(`.${d}`)
        );
        if (inAllowlist) return true;
        if (trustedCdnDomains.has(hostname)) return true;
        return false;
    } catch {
        return false;
    }
}

function corsHeaders(origin, allowedOrigins) {
    // If no allowed origins configured, allow all
    const allowed = !allowedOrigins || allowedOrigins === "*"
        ? "*"
        : allowedOrigins.split(",").map((o) => o.trim()).includes(origin)
            ? origin
            : "";

    return {
        "Access-Control-Allow-Origin": allowed || "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const origin = request.headers.get("Origin") || "";
        const cors = corsHeaders(origin, env.ALLOWED_ORIGINS);

        // Handle CORS preflight
        if (request.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: cors });
        }

        if (request.method !== "GET") {
            return Response.json({ error: "Method not allowed" }, { status: 405, headers: cors });
        }

        try {
            let targetUrl = url.searchParams.get("url") || "";

            if (!targetUrl) {
                return Response.json({ error: "Missing url parameter" }, { status: 400, headers: cors });
            }

            // Sanitize trailing fragment hack
            if (targetUrl.endsWith("#.m3u8")) targetUrl = targetUrl.replace("#.m3u8", "");

            if (isBlockedUrl(targetUrl)) {
                return Response.json({ error: "Forbidden" }, { status: 403, headers: cors });
            }

            // Build allowed domains set from env
            const allowedDomains = new Set(
                (env.ALLOWED_DOMAINS || "westreamf1.com").split(",").map((d) => d.trim().toLowerCase())
            );

            if (!isDomainAllowed(targetUrl, allowedDomains)) {
                return Response.json({ error: "Domain not allowed" }, { status: 403, headers: cors });
            }

            const targetOrigin = new URL(targetUrl).origin;

            const res = await fetch(targetUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36",
                    "Accept": "*/*",
                    "Referer": `${targetOrigin}/`,
                    "Origin": targetOrigin,
                },
                cf: { cacheTtl: 0 },
                redirect: "follow",
            });

            if (!res.ok) {
                return Response.json(
                    { error: `Upstream returned ${res.status}` },
                    { status: res.status >= 400 && res.status < 600 ? res.status : 502, headers: cors }
                );
            }

            const finalUrl = res.url || targetUrl;
            if (isBlockedUrl(finalUrl)) {
                return Response.json({ error: "Forbidden" }, { status: 403, headers: cors });
            }

            const contentType = res.headers.get("content-type") || "";

            // Binary passthrough — video chunks (.ts segments), audio
            const binaryTypes = ["video/", "application/octet-stream", "audio/"];
            if (binaryTypes.some((t) => contentType.includes(t))) {
                return new Response(res.body, {
                    headers: {
                        "Content-Type": contentType,
                        ...cors,
                        "Cache-Control": "no-cache",
                    },
                });
            }

            // Sniff for MPEG-TS when content-type lies
            const reader = res.body?.getReader();
            if (!reader) {
                return Response.json({ error: "No response body" }, { status: 502, headers: cors });
            }
            const { value: firstChunk, done: firstDone } = await reader.read();

            if (firstChunk && firstChunk.length > 188 && firstChunk[0] === 0x47) {
                const tsStream = new ReadableStream({
                    async start(controller) {
                        controller.enqueue(firstChunk);
                        if (firstDone) { controller.close(); return; }
                        let totalBytes = firstChunk.length;
                        while (true) {
                            const { value, done } = await reader.read();
                            if (done) break;
                            totalBytes += value.length;
                            if (totalBytes > MAX_RESPONSE_BYTES) break;
                            controller.enqueue(value);
                        }
                        controller.close();
                    },
                });
                return new Response(tsStream, {
                    headers: { "Content-Type": "video/mp2t", ...cors, "Cache-Control": "no-cache" },
                });
            }

            // Not binary — reconstruct text (capped)
            const textParts = [];
            let totalTextBytes = 0;
            if (firstChunk) {
                textParts.push(new TextDecoder().decode(firstChunk));
                totalTextBytes += firstChunk.length;
            }
            if (!firstDone) {
                while (totalTextBytes < MAX_RESPONSE_BYTES) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    totalTextBytes += value.length;
                    textParts.push(new TextDecoder().decode(value));
                }
            }
            const content = textParts.join("");

            // HLS manifest — rewrite relative URLs to proxy through this worker
            if (content.includes("#EXTM3U")) {
                const baseUrl = new URL(finalUrl);
                const basePath = baseUrl.origin + baseUrl.pathname.substring(0, baseUrl.pathname.lastIndexOf("/"));

                // Trust this CDN domain for future segment/sub-manifest requests
                trustedCdnDomains.add(baseUrl.hostname.toLowerCase());

                // Use this worker's own URL as the proxy base
                const workerBase = `${url.origin}/?url=`;

                const rewritten = content
                    .split("\n")
                    .map((line) => {
                        const trimmed = line.trim();
                        if (trimmed.length === 0 || trimmed.startsWith("#")) return line;

                        let absoluteUrl = trimmed;
                        if (!trimmed.startsWith("http")) {
                            absoluteUrl = trimmed.startsWith("/")
                                ? baseUrl.origin + trimmed
                                : `${basePath}/${trimmed}`;
                        }
                        return `${workerBase}${encodeURIComponent(absoluteUrl)}`;
                    })
                    .join("\n");

                return new Response(rewritten, {
                    headers: {
                        "Content-Type": "application/vnd.apple.mpegurl",
                        ...cors,
                        "Cache-Control": "no-cache",
                    },
                });
            }

            // Fallback — pass through with CORS
            return new Response(content, {
                headers: {
                    "Content-Type": contentType || "application/octet-stream",
                    ...cors,
                    "Cache-Control": "no-cache",
                },
            });
        } catch (err) {
            return Response.json({ error: "Proxy error" }, { status: 502, headers: cors });
        }
    },
};
