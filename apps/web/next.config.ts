import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@pwpm/ui",
    "@pwpm/domain",
    "@pwpm/shared",
    "@pwpm/utils",
  ],
};

export default nextConfig;
