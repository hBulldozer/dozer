import '@dozer/ui/index.css'

import { App, LoadingOverlay, ThemeProvider, ToastContainer } from '@dozer/ui'
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

import Head from 'next/head'
import { api } from '../utils/api'
import { ClientContextProvider, JsonRpcContextProvider } from '@dozer/higmi'
import { usePathname } from 'next/navigation'

// const queryClient = new QueryClient()

const MyApp: FC<AppProps> = ({ Component, pageProps }) => {
  const pathname = usePathname()

  return (
    <>
      {/* <LoadingOverlay show={isLoading} /> */}
      <Head>
        <title>
          {pathname.includes('create_token')
            ? 'Dozer - Create Token 🧪'
            : pathname.includes('oasis')
            ? 'Dozer - Oasis 🏝️'
            : 'Dozer Finance - Pools 💦'}
        </title>
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
          <ClientContextProvider>
            <JsonRpcContextProvider>
              <Header />
              {/* <TokenListsUpdaters chainIds={SUPPORTED_CHAIN_IDS} /> */}
              <Component {...pageProps} />
              <App.Footer />
              <ToastContainer className="mt-[50px]" />
            </JsonRpcContextProvider>
          </ClientContextProvider>
        </App.Shell>
      </ThemeProvider>
      <Analytics />
    </>
  )
}

export default api.withTRPC(MyApp)
