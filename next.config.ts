import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // Enable router cache for faster client-side navigation
    staleTimes: {
      dynamic: 30, // Cache dynamic routes for 30 seconds
      static: 180, // Cache static routes for 3 minutes
    },
  },
};

export default nextConfig;
