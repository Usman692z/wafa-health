import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
    ],
  },
  turbopack: {},
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'chart.js'],
  },
  // Compress output for Vercel
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
