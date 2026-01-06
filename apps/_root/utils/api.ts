import { createTRPCProxyClient, httpBatchLink, loggerLink } from '@trpc/client'
import { createTRPCNext } from '@trpc/next'
import superjson from 'superjson'
import type { AppRouter } from '@dozer/api'

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return '' // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}` // SSR should use vercel url

  return `http://localhost:9000` // dev SSR should use localhost
}

export const api = createTRPCNext<AppRouter>({
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
      queryClientConfig: {
        defaultOptions: {
          queries: {
            // Default settings for all queries
            staleTime: 30 * 1000,
            cacheTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 3,
          },
        },
      },
    }
  },
})

export const client = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      // You can pass any HTTP headers you wish here
    }),
  ],
})

export { type RouterInputs, type RouterOutputs } from '@dozer/api'
