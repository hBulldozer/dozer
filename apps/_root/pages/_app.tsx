import '@dozer/ui/index.css'
import 'styles/index.css'

import { useIsSmScreen } from '@dozer/hooks'
import { App, ThemeProvider, ToastContainer } from '@dozer/ui'
import { MotionConfig } from 'framer-motion'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import React, { FC, useEffect, Component, ErrorInfo, ReactNode } from 'react'

import { api } from 'utils/api'
import { Header } from '../components'
import Head from 'next/head'

declare global {
  interface Window {
    dataLayer: Record<string, any>[]
  }
}

// Error boundary component to prevent app crashes
class ErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }> {
  state = { hasError: false, error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('React ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        this.props.fallback || (
          <div className="p-6 m-4 bg-red-100 border border-red-400 rounded-md text-red-700">
            <h2 className="text-lg font-bold mb-2">Something went wrong</h2>
            <p className="mb-4">Please try refreshing the page or contact support if the issue persists.</p>
            <details className="p-2 bg-white bg-opacity-50 rounded-sm">
              <summary className="cursor-pointer mb-1">Technical Details</summary>
              <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-40 p-2 bg-gray-100 rounded">
                {this.state.error?.toString()}
              </pre>
            </details>
            <button
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        )
      )
    }

    return this.props.children
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

  return (
    <>
      <Head>
        <title>Dozer - Final Presale Phase - DZD Token</title>
        <link rel="apple-touch-icon" sizes="180x180" href="/images/apple-touch-icon.png?v=1" />
        <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png?v=1" />
        <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon-16x16.png?v=1" />
        <link rel="manifest" href="/images/site.webmanifest?v=1" />
        <link rel="mask-icon" href="/images/safari-pinned-tab.svg?v=1" color="#fa52a0" />
        <link rel="shortcut icon" href="/images/favicon.ico?v=1" />
      </Head>
      <ThemeProvider>
        <ErrorBoundary>
          <App.Shell>
            <Header />
            <MotionConfig
              reducedMotion={isSmallScreen ? 'always' : 'user'}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
            >
              <Component {...pageProps} />
            </MotionConfig>
            {router.pathname !== '/' && <App.Footer />}
            <ToastContainer className="mt-[50px]" />
          </App.Shell>
        </ErrorBoundary>
      </ThemeProvider>
    </>
  )
}

export default api.withTRPC(MyApp)
