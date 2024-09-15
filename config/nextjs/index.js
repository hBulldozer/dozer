/** @type {import('next').NextConfig} */
const defaultNextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  swcMinify: false,
  poweredByHeader: false,
  staticPageGenerationTimeout: 180,
  experimental: {
    esmExternals: 'loose',
    bundlePagesExternals: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

module.exports = defaultNextConfig
