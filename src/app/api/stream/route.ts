import { NextRequest, NextResponse } from "next/server";

// Max response size: 15 MB (enough for HLS segments, blocks abuse)
const MAX_RESPONSE_BYTES = 15 * 1024 * 1024;

// Allowed entry-point domains — gates the initial stream URL only
// Segment/sub-manifest URLs from HLS rewriting bypass this (they're proxy-generated)
const ALLOWED_DOMAINS = new Set(
    (process.env.STREAM_ALLOWED_DOMAINS || "a1xs.vip").split(",").map(d => d.trim().toLowerCase())
);

// Track CDN domains seen during manifest rewriting so segments pass through
const trustedCdnDomains = new Set<string>();

// Block SSRF: internal/private/non-HTTP URLs
function isBlockedUrl(url: string): boolean {
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

// Check if target domain is allowed (entry-point allowlist + trusted CDN domains)
function isDomainAllowed(url: string): boolean {
    if (ALLOWED_DOMAINS.size === 0) return true;
    try {
        const hostname = new URL(url).hostname.toLowerCase();
        // Allow if in the configured allowlist (entry-point domains)
        const inAllowlist = Array.from(ALLOWED_DOMAINS).some(
            d => hostname === d || hostname.endsWith(`.${d}`)
        );
        if (inAllowlist) return true;
        // Allow if this CDN domain was seen during a previous manifest rewrite
        if (trustedCdnDomains.has(hostname)) return true;
        return false;
    } catch {
        return false;
    }
}

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
    try {
        const urlParams = request.nextUrl.searchParams;
        let targetUrl = urlParams.get("url") || "";

        if (!targetUrl) {
            return NextResponse.json({ error: "Missing url parameter" }, { status: 400, headers: CORS_HEADERS });
        }

        // Sanitize trailing fragment hack
        if (targetUrl.endsWith("#.m3u8")) targetUrl = targetUrl.replace("#.m3u8", "");

        if (isBlockedUrl(targetUrl)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: CORS_HEADERS });
        }

        // Domain allowlist check (first-hop only — redirects are validated below)
        if (!isDomainAllowed(targetUrl)) {
            return NextResponse.json({ error: "Domain not allowed" }, { status: 403, headers: CORS_HEADERS });
        }

        // Derive referer from the target URL's origin
        const targetOrigin = new URL(targetUrl).origin;

        const res = await fetch(targetUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36",
                "Accept": "*/*",
                "Referer": `${targetOrigin}/`,
                "Origin": targetOrigin,
            },
            cache: "no-store",
            redirect: "follow",
        });

        if (!res.ok) {
            return NextResponse.json(
                { error: `Upstream returned ${res.status}` },
                { status: res.status >= 400 && res.status < 600 ? res.status : 502, headers: CORS_HEADERS }
            );
        }

        // Validate the final URL after redirects (prevent SSRF via open redirects)
        const finalUrl = res.url || targetUrl;
        if (isBlockedUrl(finalUrl)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: CORS_HEADERS });
        }

        const contentType = res.headers.get("content-type") || "";

        // Binary passthrough — video chunks (.ts segments), audio
        const binaryTypes = ["video/", "application/octet-stream", "audio/"];
        if (binaryTypes.some(t => contentType.includes(t))) {
            return new NextResponse(res.body, {
                headers: {
                    "Content-Type": contentType,
                    ...CORS_HEADERS,
                    "Cache-Control": "no-cache",
                },
            });
        }

        // Sniff for MPEG-TS when content-type lies (e.g. text/html for binary TS)
        const reader = res.body?.getReader();
        if (!reader) {
            return NextResponse.json({ error: "No response body" }, { status: 502, headers: CORS_HEADERS });
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
            return new NextResponse(tsStream, {
                headers: { "Content-Type": "video/mp2t", ...CORS_HEADERS, "Cache-Control": "no-cache" },
            });
        }

        // Not binary — reconstruct text (capped at MAX_RESPONSE_BYTES)
        const textParts: string[] = [];
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

        // HLS manifest — rewrite relative URLs to proxy through us
        if (content.includes("#EXTM3U")) {
            const baseUrl = new URL(finalUrl);
            const basePath = baseUrl.origin + baseUrl.pathname.substring(0, baseUrl.pathname.lastIndexOf("/"));

            // Trust this CDN domain for future segment/sub-manifest requests
            trustedCdnDomains.add(baseUrl.hostname.toLowerCase());

            const rewritten = content
                .split("\n")
                .map(line => {
                    const trimmed = line.trim();
                    if (trimmed.length === 0 || trimmed.startsWith("#")) return line;

                    let absoluteUrl = trimmed;
                    if (!trimmed.startsWith("http")) {
                        absoluteUrl = trimmed.startsWith("/")
                            ? baseUrl.origin + trimmed
                            : `${basePath}/${trimmed}`;
                    }
                    return `/api/stream?url=${encodeURIComponent(absoluteUrl)}`;
                })
                .join("\n");

            return new NextResponse(rewritten, {
                headers: {
                    "Content-Type": "application/vnd.apple.mpegurl",
                    ...CORS_HEADERS,
                    "Cache-Control": "no-cache",
                },
            });
        }

        // Fallback — pass through with CORS
        return new NextResponse(content, {
            headers: {
                "Content-Type": contentType || "application/octet-stream",
                ...CORS_HEADERS,
                "Cache-Control": "no-cache",
            },
        });
    } catch {
        return NextResponse.json({ error: "Proxy error" }, { status: 502, headers: CORS_HEADERS });
    }
}
