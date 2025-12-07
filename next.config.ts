import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  poweredByHeader: false,
  compress: true,
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
};

export default nextConfig;
