import { httpBatchLink, loggerLink } from '@trpc/client'
import { createTRPCNext } from '@trpc/next'
import superjson from 'superjson'

import type { AppRouter } from './root'

const replaceSwapAndEarnWithRoot = (url: string) => {
  const lowercaseUrl = url.toLowerCase()
  if (lowercaseUrl.includes('swap') || lowercaseUrl.includes('earn')) {
    const replacedUrl = url.replace(/swap|earn/gi, 'root')
    return replacedUrl
  }
  return url
}

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return '' // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${replaceSwapAndEarnWithRoot(process.env.VERCEL_URL)}` // SSR should use vercel url

  return `http://localhost:3000` // dev SSR should use localhost
}

export const client = createTRPCNext<AppRouter>({
  config() {
    return {
      transformer: superjson,
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === 'development' || (opts.direction === 'down' && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
    }
  },
})
