import defaultNextConfig from '@dozer/nextjs-config'

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...defaultNextConfig,
  basePath: '/swap',
  transpilePackages: ['@dozer/higmi', '@dozer/ui', '@dozer/math', '@dozer/database', '@dozer/currency'],
  experimental: {
    swcPlugins: [['next-superjson-plugin', {}]],
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
