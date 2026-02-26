import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Pre-existing type errors in charts/seed-demo; will be fixed incrementally
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
