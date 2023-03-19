import '@dozer/ui/index.css'

import { App, ThemeProvider } from '@dozer/ui'
import { Analytics } from '@vercel/analytics/react'
import type { AppContext, AppProps } from 'next/app'
import { default as NextApp } from 'next/app'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { DefaultSeo } from 'next-seo'
import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import NoSSR from 'react-no-ssr'

import { Header } from '../components'

declare global {
  interface Window {
    dataLayer: Record<string, any>[]
  }
}

const queryClient = new QueryClient()

const MyApp = ({ Component, pageProps }: AppProps) => {
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
            {/* <NoSSR> */}
            <Header />
            <Component {...pageProps} />
            {/* </NoSSR> */}
            <App.Footer />
          </App.Shell>
          <div className="z-[-1] bg-gradient-radial fixed inset-0 bg-scroll bg-clip-border transform pointer-events-none" />
        </ThemeProvider>
      </QueryClientProvider>
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

export default MyApp
