import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'slelguoygbfzlpylpxfs.supabase.co',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'recharts', 'framer-motion'],
  },

  webpack: (config) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    }
    
    return config
  },

  // SEO Redirects - Handle all TaskLynk variations
  async redirects() {
    return [
      // Brand name variations - redirect to home
      {
        source: '/task-lynk',
        destination: '/',
        permanent: true,
      },
      {
        source: '/task-link',
        destination: '/',
        permanent: true,
      },
      {
        source: '/tasklynk',
        destination: '/',
        permanent: true,
      },
      {
        source: '/tasklink',
        destination: '/',
        permanent: true,
      },
      {
        source: '/task_lynk',
        destination: '/',
        permanent: true,
      },
      {
        source: '/task_link',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // SEO Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
        ],
      },
    ];
  },

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
// Orchids restart: 1763592238746