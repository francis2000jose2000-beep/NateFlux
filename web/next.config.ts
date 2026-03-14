import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  outputFileTracingIncludes: {
    '/*': ['./infra-templates/**/*'],
    '/api/**/*': ['./infra-templates/**/*'],
  },
};

export default nextConfig;
