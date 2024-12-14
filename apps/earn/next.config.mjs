import defaultNextConfig from '@dozer/nextjs-config'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...defaultNextConfig,
  basePath: '/pool',
  transpilePackages: ['@dozer/higmi', '@dozer/ui', '@dozer/math', '@dozer/database', '@dozer/currency'],
  experimental: {
    swcPlugins: [['next-superjson-plugin', {}]],
    outputFileTracingRoot: path.join(__dirname, '../../'),
    outputFileTracingIncludes: {
      '/node_modules/sharp/**/*': true,
    },
  },
  output: 'standalone',
  images: {
    minimumCacheTTL: 86400, // 24 hours
    deviceSizes: [32, 48, 64, 96, 128, 256], // Adjust based on your needs
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'supabase.dozer.finance',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '207.148.120.225',
        port: '8000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '207.148.120.225',
        port: '8443',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.redd.it',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/pool',
        permanent: true,
        basePath: false,
      },
    ]
  },
}

export default nextConfig
