import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    // Prevent build failures due to ESLint in CI since it's handled in GitHub Actions.
    ignoreDuringBuilds: true,
  },

  images: {
    // Needed if you're using both Cloudinary and Optimizely-hosted media
    domains: ['res.cloudinary.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.optimizely.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
    // Enables Next.js to use your custom image loader
    loader: 'custom',
    loaderFile: './lib/image/next-image-loader.ts',
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' *.optimizely.com",
          },
        ],
      },
    ]
  },
}

export default nextConfig
