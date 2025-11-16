/** @type {import('next').NextConfig} */
const { i18n } = require('./next-i18next.config');

const nextConfig = {
  reactStrictMode: true,
  i18n,
  output: 'standalone', // Enable standalone output for Docker deployment
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pokemon-champion.com',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
    ],
    minimumCacheTTL: 14400, // 4 hours (new default in v16)
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
};

module.exports = nextConfig;