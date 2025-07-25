/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  images: {
    domains: ['firebasestorage.googleapis.com', 'lh3.googleusercontent.com'],
    formats: ['image/avif', 'image/webp'],
  },

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
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ];
  },

  async redirects() {
    return [
      {
        source: '/app/signup', // Old path from your structure
        destination: '/signup', // Correct path
        permanent: true,
      },
    ];
  },

  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Ensure this matches if you have a `lib/publicRoutes.ts` module with named exports
    // This might be needed if you try to import `publicRoutes` from a server component
    // or a build time process. It is generally safer to list explicit imports.
    // If your use of `publicRoutes` is solely client-side and dynamically loaded,
    // then this might not be strictly necessary.
    // clientRouterFilter: true, // Example
  },
};

module.exports = nextConfig;
