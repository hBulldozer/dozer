import '@dozer/ui/index.css'

import { App, LoadingOverlay, ThemeProvider } from '@dozer/ui'
// import { client } from '@dozer/wagmi'
import { Analytics } from '@vercel/analytics/react'
import { Header } from '../components'
// import { SUPPORTED_CHAIN_IDS } from '../config'
// import { Updaters as TokenListsUpdaters } from '../lib/state/TokenListsUpdaters'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { FC, useEffect, useState } from 'react'
// import { store } from '../store'
// import { WagmiConfig } from 'wagmi'
// import SEO from '../next-seo.config.mjs'

// import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Head from 'next/head'
import { api } from '../utils/api'

// const queryClient = new QueryClient()

const MyApp: FC<AppProps> = ({ Component, pageProps }) => {
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
    router.events.on('routeChangeStart', () => {
      setIsLoading(true)
    })

    router.events.on('routeChangeComplete', () => {
      setIsLoading(false)
    })

    router.events.on('routeChangeError', () => {
      setIsLoading(false)
    })
  }, [isLoading, router])
  return (
    <>
      {/* <LoadingOverlay show={isLoading} /> */}
      <Head>
        <title>Dozer - The future of finance - Coming soon</title>
        <link rel="apple-touch-icon" sizes="180x180" href="/images/apple-touch-icon.png?v=1" />
        <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png?v=1" />
        <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon-16x16.png?v=1" />
        <link rel="manifest" href="/images/site.webmanifest?v=1" />
        <link rel="mask-icon" href="/images/safari-pinned-tab.svg?v=1" color="#fa52a0" />
        <link rel="shortcut icon" href="/images/favicon.ico?v=1" />
      </Head>
      <ThemeProvider>
        <App.Shell>
          {/* <DefaultSeo {...SEO} /> */}
          <Header />
          {/* <TokenListsUpdaters chainIds={SUPPORTED_CHAIN_IDS} /> */}
          <Component {...pageProps} />
          <App.Footer />
          {/* <ToastContainer className="mt-[50px]" /> */}
        </App.Shell>
      </ThemeProvider>
      <Analytics />
    </>
  )
}

export default api.withTRPC(MyApp)
