import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/personal-path',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
