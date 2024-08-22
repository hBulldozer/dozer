import defaultNextConfig from '@dozer/nextjs-config'
import { truncate } from 'fs'

const { ROOT_URL, SWAP_URL, EARN_URL } = process.env

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...defaultNextConfig,
  transpilePackages: ['@dozer/higmi', '@dozer/ui', '@dozer/math', '@dozer/database', '@dozer/currency'],
  async redirects() {
    return [
      {
        source: '/discord{/}?',
        permanent: true,
        destination: 'https://discord.gg/',
      },
      {
        source: '/github{/}?',
        permanent: true,
        destination: 'https://github.com/Dozer-Protocol',
      },
      {
        source: '/twitter{/}?',
        permanent: true,
        destination: 'https://twitter.com/DozerProtocol',
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/:path*',
        destination: `/:path*`,
      },
      {
        source: '/swap',
        destination: `${SWAP_URL}/swap`,
      },
      {
        source: '/swap/:path*',
        destination: `${SWAP_URL}/swap/:path*`,
      },
      {
        source: '/pool',
        destination: `${EARN_URL}/pool`,
      },
      {
        source: '/pool/:path*',
        destination: `${EARN_URL}/pool/:path*`,
      },

      {
        source: '/kucoin/:path*',
        destination: `https://api.kucoin.com/api/v1/:path*`,
      },
    ]
  },
}

export default nextConfig
