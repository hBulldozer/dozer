import '@dozer/ui/index.css'

import { App, ThemeProvider } from '@dozer/ui'
// import { client } from '@dozer/wagmi'
import { Analytics } from '@vercel/analytics/react'
import { Header } from '../components'
// import { SUPPORTED_CHAIN_IDS } from '../config'
// import { Updaters as TokenListsUpdaters } from '../lib/state/TokenListsUpdaters'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Script from 'next/script'
import { DefaultSeo } from 'next-seo'
import { FC, useEffect } from 'react'
import { Provider } from 'react-redux'
// import { store } from '../store'
// import { WagmiConfig } from 'wagmi'
import NoSSR from 'react-no-ssr'
import { api } from '../utils/api'
// import SEO from '../next-seo.config.mjs'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

const MyApp: FC<AppProps> = ({ Component, pageProps }) => {
  const router = useRouter()
  useEffect(() => {
    const dataLayer = window.dataLayer || []
    const handler = (page: any) => {
      dataLayer.push({
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
      {/* <Head>
        <link rel="apple-touch-icon" sizes="180x180" href="/earn/apple-touch-icon.png?v=1" />
        <link rel="icon" type="image/png" sizes="32x32" href="/earn/favicon-32x32.png?v=1" />
        <link rel="icon" type="image/png" sizes="16x16" href="/earn/favicon-16x16.png?v=1" />
        <link rel="manifest" href="/earn/manifest.json?v=1" />
        <link rel="mask-icon" href="/earn/safari-pinned-tab.svg?v=1" color="#fa52a0" />
        <link rel="shortcut icon" href="/earn/favicon.ico?v=1" />
      </Head> */}
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <App.Shell>
            {/* <DefaultSeo {...SEO} /> */}
            <NoSSR>
              <Header />
              {/* <TokenListsUpdaters chainIds={SUPPORTED_CHAIN_IDS} /> */}
              <Component {...pageProps} />
            </NoSSR>
            <App.Footer />
            {/* <ToastContainer className="mt-[50px]" /> */}
          </App.Shell>
        </ThemeProvider>
      </QueryClientProvider>
      <Analytics />
    </>
  )
}

export default api.withTRPC(MyApp)
