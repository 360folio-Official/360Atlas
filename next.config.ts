import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Shared hosting caps how many processes one account can run, so keep
    // the production build to a couple of workers.
    cpus: 2,
  },
};

export default nextConfig;
