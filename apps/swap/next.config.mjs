import defaultNextConfig from '@dozer/nextjs-config'

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...defaultNextConfig,
  basePath: '/swap',
  transpilePackages: ['@dozer/higmi', '@dozer/ui', '@dozer/math', '@dozer/database', '@dozer/currency'],
  experimental: {
    swcPlugins: [['next-superjson-plugin', {}]],
  },
  images: {
    remotePatterns: [
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
        destination: '/swap',
        permanent: true,
        basePath: false,
      },
    ]
  },
}

export default nextConfig
