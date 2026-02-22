import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    // Keep dynamic App Router segments in the client Router Cache
    // so back-and-forth navigation between protected tabs stays instant.
    staleTimes: {
      dynamic: 1800,
    },
  },
}

export default nextConfig
