import defaultNextConfig from '@dozer/nextjs-config'

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...defaultNextConfig,
  basePath: '/earn',
  transpilePackages: ['@dozer/higmi', '@dozer/ui', '@dozer/math', '@dozer/database'],
  experimental: {
    swcPlugins: [['next-superjson-plugin', {}]],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/earn',
        permanent: true,
        basePath: false,
      },
    ]
  },
}

export default nextConfig
