import '@dozer/ui/index.css'

import { App, LoadingOverlay, ThemeProvider, ToastContainer } from '@dozer/ui'
import { Analytics } from '@vercel/analytics/react'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { api } from 'utils/api'
import { Header } from '../components'
import Head from 'next/head'

// declare global {
//   interface Window {
//     dataLayer: Record<string, any>[]
//   }
// }

const MyApp = ({ Component, pageProps }: AppProps) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  useEffect(() => {
    const handler = (page: any) => {
      window.dataLayer.push({
        event: 'pageview',
        page,
      })
    }
    return () => {
      router.events.off('routeChangeComplete', handler)
      router.events.off('hashChangeComplete', handler)
    }
  }, [router.events])

  useEffect(() => {
    router.events.on('routeChangeStart', (url) => {
      setIsLoading(true)
    })

    router.events.on('routeChangeComplete', (url) => {
      setIsLoading(false)
    })

    router.events.on('routeChangeError', (url) => {
      setIsLoading(false)
    })
  }, [isLoading, router])
  return (
    <>
      <LoadingOverlay show={isLoading} />
      <Head>
        <link rel="apple-touch-icon" sizes="180x180" href="/earn/apple-touch-icon.png?v=1" />
        <link rel="icon" type="image/png" sizes="32x32" href="/earn/favicon-32x32.png?v=1" />
        <link rel="icon" type="image/png" sizes="16x16" href="/earn/favicon-16x16.png?v=1" />
        <link rel="manifest" href="/earn/site.webmanifest?v=1" />
        <link rel="mask-icon" href="/earn/safari-pinned-tab.svg?v=1" color="#fa52a0" />
        <link rel="shortcut icon" href="/earn/favicon.ico?v=1" />
      </Head>
      <ThemeProvider>
        <App.Shell>
          <Header />
          <Component {...pageProps} />
          <App.Footer />
          <ToastContainer className="mt-[50px]" />
        </App.Shell>
        <div className="z-[-1] bg-gradient-radial fixed inset-0 bg-scroll bg-clip-border transform pointer-events-none" />
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
