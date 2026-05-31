import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  compiler: {
    // Strip console.* calls in production to reduce bundle size
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },
  experimental: {
    optimizeCss: true,
  },
  async redirects() {
    return [
      {
        source: '/docs',
        destination: 'https://docs.synarcdao.xyz',
        permanent: true,
      },
      {
        source: '/docs/:path*',
        destination: 'https://docs.synarcdao.xyz/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
