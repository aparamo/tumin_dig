import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const cspDirectives = [
  "default-src 'self'",
  // Next.js needs unsafe-inline for styles and scripts; unsafe-eval only in dev
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://utfs.io https://lh3.googleusercontent.com",
  "media-src 'self' https://utfs.io",
  "connect-src 'self' https://*.uploadthing.com https://uploadthing.com wss://*.uploadthing.com",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "utfs.io" },
      // Google Drive previews / avatars
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // Prevent MIME-type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Control referrer leakage
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Restrict browser features
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          // Force HTTPS (only effective once served over HTTPS)
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Content Security Policy
          { key: "Content-Security-Policy", value: cspDirectives },
        ],
      },
    ];
  },
};

export default nextConfig;
