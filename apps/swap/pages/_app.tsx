import '@dozer/ui/index.css'

import { App, ThemeProvider } from '@dozer/ui'
import { Analytics } from '@vercel/analytics/react'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { Header } from '../components'
import Head from 'next/head'

// declare global {
//   interface Window {
//     dataLayer: Record<string, any>[]
//   }
// }

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
      <Head>
        <link rel="apple-touch-icon" sizes="180x180" href="/earn/apple-touch-icon.png?v=1" />
        <link rel="icon" type="image/png" sizes="32x32" href="/earn/favicon-32x32.png?v=1" />
        <link rel="icon" type="image/png" sizes="16x16" href="/earn/favicon-16x16.png?v=1" />
        <link rel="manifest" href="/earn/site.webmanifest?v=1" />
        <link rel="mask-icon" href="/earn/safari-pinned-tab.svg?v=1" color="#fa52a0" />
        <link rel="shortcut icon" href="/earn/favicon.ico?v=1" />
      </Head>
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
