/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    // Ensures proper serverless function behavior
    outputFileTracingRoot: undefined,
  },
  // Ensure environment variables are available
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://exprezzzo-power.vercel.app',
  },
};

module.exports = nextConfig;