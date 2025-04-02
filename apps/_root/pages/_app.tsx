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

// Check if we're in production to disable problematic features
const isProduction = process.env.NODE_ENV === 'production'

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

// Simplified wrapper component to prevent recursion
const SafeMotionConfig: FC<{ children: ReactNode }> = ({ children }) => {
  const isSmallScreen = useIsSmScreen()

  // In production, completely disable animations
  if (isProduction) {
    return <>{children}</>
  }

  return (
    <MotionConfig reducedMotion="always" transition={{ duration: 0.3, type: 'tween' }}>
      {children}
    </MotionConfig>
  )
}

const MyApp: FC<AppProps> = ({ Component, pageProps }) => {
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

  // Simplify the app rendering in production to avoid potential recursion
  if (isProduction) {
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
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <Component {...pageProps} />
              </main>
              {router.pathname !== '/' && <App.Footer />}
            </div>
            <ToastContainer className="mt-[50px]" />
          </ErrorBoundary>
        </ThemeProvider>
      </>
    )
  }

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
            <SafeMotionConfig>
              <Component {...pageProps} />
            </SafeMotionConfig>
            {router.pathname !== '/' && <App.Footer />}
            <ToastContainer className="mt-[50px]" />
          </App.Shell>
        </ErrorBoundary>
      </ThemeProvider>
    </>
  )
}

export default api.withTRPC(MyApp)
