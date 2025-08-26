/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: { 
    domains: ['firebasestorage.googleapis.com'],
    unoptimized: process.env.NODE_ENV === 'development'
  },
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin']
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
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ],
      },
    ]
  }
}

module.exports = nextConfig
