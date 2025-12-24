import '@dozer/ui/index.css'
import 'styles/index.css'

import { useIsSmScreen } from '@dozer/hooks'
import { ThemeProvider } from '@dozer/ui/theme'
import { ToastContainer } from '@dozer/ui/toast'
import { App } from '@dozer/ui/app'
import { MotionConfig } from 'framer-motion'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import React, { FC, useEffect } from 'react'

import { api } from 'utils/api'
import { Header } from '../components'
import { CustomFooter } from '../components/CustomFooter'
import Head from 'next/head'

declare global {
  interface Window {
    dataLayer: Record<string, any>[]
  }
}

const MyApp: FC<AppProps> = ({ Component, pageProps }) => {
  const isSmallScreen = useIsSmScreen()
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || []

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
    }
  }, [router.events])

  // Only show footer on non-root pages
  const showFooter = router.pathname !== '/'

  return (
    <>
      <Head>
        <title>Dozer - The future of DeFi</title>
        <link rel="apple-touch-icon" sizes="180x180" href="/images/apple-touch-icon.png?v=1" />
        <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png?v=1" />
        <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon-16x16.png?v=1" />
        <link rel="manifest" href="/images/site.webmanifest?v=1" />
        <link rel="mask-icon" href="/images/safari-pinned-tab.svg?v=1" color="#fa52a0" />
        <link rel="shortcut icon" href="/images/favicon.ico?v=1" />
      </Head>
      <ThemeProvider>
        <App.Shell>
          <Header />
          <MotionConfig reducedMotion={isSmallScreen ? 'always' : 'user'}>
            <Component {...pageProps} />
          </MotionConfig>
          {showFooter && <CustomFooter />}
          <ToastContainer className="mt-[50px]" />
        </App.Shell>
      </ThemeProvider>
    </>
  )
}

export default api.withTRPC(MyApp)
