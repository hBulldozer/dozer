/**
 * Query configuration utilities for optimizing React Query behavior
 * in different environments (local development vs production).
 */

const isLocalDevelopment = process.env.NODE_ENV === 'development' &&
  (process.env.NEXT_PUBLIC_LOCAL_NODE_URL?.includes('localhost') ||
   process.env.NEXT_PUBLIC_LOCAL_NODE_URL?.includes('127.0.0.1'))

/**
 * Get optimized query options for history API calls based on environment.
 *
 * Local development uses:
 * - Longer cache times to reduce load on local node
 * - No auto-refetch to prevent hammering the node
 * - Lower retry counts to fail fast
 *
 * Production uses:
 * - Shorter cache for fresher data
 * - Auto-refetch for live updates
 * - More retries for reliability
 */
export function getHistoryQueryConfig(options?: {
  /** Override stale time (ms) */
  staleTime?: number
  /** Override refetch interval (ms or false) */
  refetchInterval?: number | false
  /** Override retry count */
  retry?: number
}) {
  if (isLocalDevelopment) {
    return {
      staleTime: options?.staleTime ?? 600000, // 10 minutes in dev
      refetchInterval: (options?.refetchInterval ?? false) as false, // No auto-refetch in dev
      retry: options?.retry ?? 1, // Retry once in dev
      retryDelay: 2000, // 2 second delay between retries
      refetchOnWindowFocus: false,// Don't refetch when window regains focus
      refetchOnMount: false, // Don't refetch on component mount if cached
    }
  }

  // Production configuration
  return {
    staleTime: options?.staleTime ?? 300000, // 5 minutes in production
    refetchInterval: (options?.refetchInterval ?? false) as false, // No auto-refetch (user can refresh)
    retry: options?.retry ?? 2, // Retry twice in production
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false, // Don't refetch on focus to save bandwidth
    refetchOnMount: 'always' as const, // Always fetch fresh data on mount
  }
}

/**
 * Get optimized query options for 24h metrics (computed data).
 * These are more expensive to compute so cache longer.
 */
export function getMetricsQueryConfig() {
  if (isLocalDevelopment) {
    return {
      staleTime: 1800000, // 30 minutes in dev
      refetchInterval: false as const,
      retry: 1,
      retryDelay: 2000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  }

  return {
    staleTime: 600000, // 10 minutes in production
    refetchInterval: false as const,
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  }
}
