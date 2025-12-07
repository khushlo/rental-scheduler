import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  compress: true,
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
};

export default nextConfig;
