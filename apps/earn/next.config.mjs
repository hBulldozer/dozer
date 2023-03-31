import defaultNextConfig from '@dozer/nextjs-config'

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...defaultNextConfig,
  basePath: '/earn',
  transpilePackages: [
    '@dozer/redux-token-lists',
    '@dozer/redux-localstorage',
    '@dozer/higmi',
    '@dozer/ui',
    '@dozer/math',
    '@dozer/api',
    '@dozer/database',
  ],
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
