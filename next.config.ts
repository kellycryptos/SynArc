import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  compiler: {
    // Strip console.* calls in production to reduce bundle size
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ["lucide-react", "framer-motion", "@radix-ui/react-icons"],
  },
};

export default nextConfig;
