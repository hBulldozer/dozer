import defaultNextConfig from '@dozer/nextjs-config'

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...defaultNextConfig,
  basePath: '/swap',
  transpilePackages: ['@dozer/ui', '@dozer/higmi'],
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
