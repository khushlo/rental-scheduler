import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  compress: true,
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  allowedDevOrigins: ['192.168.1.3'],
};

export default nextConfig;
