import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output standalone build for Docker deployment
  output: 'standalone',
  
  // Security releases must pass TypeScript checks
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Experimental features
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
