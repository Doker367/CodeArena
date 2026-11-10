import type { NextConfig } from "next";

const API_INTERNAL_URL = (process.env.API_INTERNAL_URL || "http://127.0.0.1:4000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_INTERNAL_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
