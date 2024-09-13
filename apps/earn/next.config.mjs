import defaultNextConfig from '@dozer/nextjs-config'

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...defaultNextConfig,
  basePath: '/pool',
  transpilePackages: ['@dozer/higmi', '@dozer/ui', '@dozer/math', '@dozer/database', '@dozer/currency'],
  experimental: {
    swcPlugins: [['next-superjson-plugin', {}]],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'supabase.dozer.finance',
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
