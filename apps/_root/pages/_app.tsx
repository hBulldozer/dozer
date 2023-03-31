import '@dozer/ui/index.css'
import 'styles/index.css'

import { useIsSmScreen } from '@dozer/hooks'
import { App, ThemeProvider, ToastContainer } from '@dozer/ui'
import { Analytics } from '@vercel/analytics/react'
import { MotionConfig } from 'framer-motion'
import type { AppContext, AppProps } from 'next/app'
import { default as NextApp } from 'next/app'
import { useRouter } from 'next/router'
// import { DefaultSeo } from 'next-seo'
import React, { FC, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { Header } from '../components'

declare global {
  interface Window {
    dataLayer: Record<string, any>[]
  }
}

const queryClient = new QueryClient()

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
  return (
    <>
      <QueryClientProvider client={queryClient}>
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
      </QueryClientProvider>
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

export default MyApp
