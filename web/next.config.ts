import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/**/*': ['./infra-templates/**/*'],
  },
};

export default nextConfig;
