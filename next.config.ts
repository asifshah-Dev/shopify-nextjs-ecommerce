/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'tinysoul.pk',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.tinysoul.pk',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;