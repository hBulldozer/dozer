import '@dozer/ui/index.css'
import 'styles/index.css'

import { useIsSmScreen } from '@dozer/hooks'
import { App, ThemeProvider, ToastContainer } from '@dozer/ui'
import { Analytics } from '@vercel/analytics/react'
import { MotionConfig } from 'framer-motion'
import type { AppContext, AppProps } from 'next/app'
// import { default as NextApp } from 'next/app'
import { useRouter } from 'next/router'
// import { DefaultSeo } from 'next-seo'
import React, { FC, useEffect } from 'react'

import type { AppType } from 'next/app'
import { api } from 'utils/api'
import { Header } from '../components'
import Head from 'next/head'

import { init } from '@socialgouv/matomo-next'

const MATOMO_URL = process.env.NEXT_PUBLIC_MATOMO_URL || 'https://matomo.self2.dozer.finance/'
const MATOMO_SITE_ID = process.env.NEXT_PUBLIC_MATOMO_SITE_ID || '1'

declare global {
  interface Window {
    dataLayer: Record<string, any>[]
  }
}

// const queryClient = new QueryClient()

const MyApp: FC<AppProps> = ({ Component, pageProps }) => {
  const isSmallScreen = useIsSmScreen()
  const router = useRouter()

  useEffect(() => {
    const handler = (page: any) => {
      window.dataLayer.push({
        event: 'pageview',
        page,
      })
    }
    router.events.on('routeChangeComplete', handler)
    router.events.on('hashChangeComplete', handler)
    return () => {
      router.events.off('routeChangeComplete', handler)
      router.events.off('hashChangeComplete', handler)
    }
  }, [router.events])

  useEffect(() => {
    init({ url: MATOMO_URL, siteId: MATOMO_SITE_ID, disableCookies: true })
  }, [])
  return (
    <>
      <Head>
        <title>Dozer - The future of finance - Coming soon</title>
        <link rel="apple-touch-icon" sizes="180x180" href="/images/apple-touch-icon.png?v=1" />
        <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png?v=1" />
        <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon-16x16.png?v=1" />
        <link rel="manifest" href="/images/site.webmanifest?v=1" />
        <link rel="mask-icon" href="/images/safari-pinned-tab.svg?v=1" color="#fa52a0" />
        <link rel="shortcut icon" href="/images/favicon.ico?v=1" />
        <meta property="og:title" content="Dozer Finance - The future of finance" />
        <meta property="og:type" content="website" />
        <meta
          property="og:description"
          content="Trade on Dozer. Seamless, fast and secure. No KYC, no registration needed and you won't spend gas."
        />
        <meta
          property="og:image"
          content="https://supabase.dozer.finance/storage/v1/object/public/uploads/dozer_background.jpeg"
        />
      </Head>
      <ThemeProvider>
        <App.Shell>
          <Header />
          <MotionConfig reducedMotion={isSmallScreen ? 'always' : 'user'}>
            <Component {...pageProps} />
          </MotionConfig>
          <App.Footer />
          <ToastContainer className="mt-[50px]" />
        </App.Shell>
      </ThemeProvider>
      <Analytics />
    </>
  )
}

// getInitialProps disables automatic static optimization for pages that don't
// have getStaticProps. So article, category and home pages still get SSG.
// Hopefully we can replace this with getStaticProps once this issue is fixed:
// https://github.com/vercel/next.js/discussions/10949
// MyApp.getInitialProps = async (ctx: AppContext) => {
//   // Calls page's `getInitialProps` and fills `appProps.pageProps`
//   const appProps = await NextApp.getInitialProps(ctx)

//   // Pass the data to our page via props
//   return { ...appProps }
// }

export default api.withTRPC(MyApp)
