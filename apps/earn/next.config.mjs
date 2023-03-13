import defaultNextConfig from '@dozer/nextjs-config'

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...defaultNextConfig,
  basePath: '/earn',
  transpilePackages: ['@dozer/redux-token-lists', '@dozer/redux-localstorage', '@dozer/higmi', '@dozer/ui'],
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
