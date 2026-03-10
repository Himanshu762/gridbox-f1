import type { NextConfig } from "next";

const securityHeaders = [
    { key: "X-DNS-Prefetch-Control", value: "on" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    { key: "X-XSS-Protection", value: "1; mode=block" },
];

const nextConfig: NextConfig = {
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: securityHeaders,
            },
            {
                // Stricter CSP-like headers for API routes
                source: "/api/:path*",
                headers: [
                    { key: "Cache-Control", value: "no-store" },
                ],
            },
        ];
    },
};

export default nextConfig;
