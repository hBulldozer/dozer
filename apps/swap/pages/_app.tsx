import '@dozer/ui/index.css'

import { App, LoadingOverlay, ThemeProvider, ToastContainer } from '@dozer/ui'
import { Analytics } from '@vercel/analytics/react'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { api } from 'utils/api'
import { Header } from '../components'
import Head from 'next/head'
import { BridgeProvider, ClientContextProvider, JsonRpcContextProvider } from '@dozer/higmi'
// @ts-expect-error - Hathor Snap Utils is not typed
import { MetaMaskProvider } from '@hathor/snap-utils'
import { config } from '@hathor/wallet-lib'

config.setServerUrl(process.env.NEXT_PUBLIC_LOCAL_NODE_URL || '')
config.setNetwork('testnet')

declare global {
  interface Window {
    dataLayer: Record<string, any>[]
  }
}

const MyApp = ({ Component, pageProps }: AppProps) => {
  return (
    <>
      <Head>
        <title>Dozer Finance - Swap 📈</title>
        <link rel="apple-touch-icon" sizes="180x180" href="/images/apple-touch-icon.png?v=1" />
        <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png?v=1" />
        <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon-16x16.png?v=1" />
        <link rel="manifest" href="/images/site.webmanifest?v=1" />
        <link rel="mask-icon" href="/images/safari-pinned-tab.svg?v=1" color="#fa52a0" />
        <link rel="shortcut icon" href="/images/favicon.ico?v=1" />
      </Head>
      <ThemeProvider>
        <App.Shell>
          <ClientContextProvider>
            <MetaMaskProvider>
              <JsonRpcContextProvider>
                <BridgeProvider>
                  <Header />
                  <Component {...pageProps} />
                  <App.Footer />
                  <ToastContainer className="mt-[50px]" />
                </BridgeProvider>
              </JsonRpcContextProvider>
            </MetaMaskProvider>
          </ClientContextProvider>
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
