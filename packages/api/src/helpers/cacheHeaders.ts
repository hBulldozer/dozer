/**
 * Cache header utilities for optimal performance with multi-layer caching strategy.
 *
 * Implements a 3-layer caching approach:
 * 1. Vercel ISR (Static Generation) - for historical data
 * 2. Vercel Edge Cache - for recent data
 * 3. Web Server Cache (Nginx/Cloudflare) - for node responses
 */

import type { Response } from 'express'

/**
 * Cache duration constants in seconds
 */
export const CACHE_DURATIONS = {
  /** Immutable historical data (> 1 hour old) - cache forever */
  HISTORICAL: 31536000, // 1 year
  /** Recent data (5-60 min old) - moderate caching */
  RECENT: 300, // 5 minutes
  /** Current/live data - short cache for real-time feel */
  CURRENT: 30, // 30 seconds
  /** Computed aggregates (24h metrics) - balance between freshness and performance */
  COMPUTED: 300, // 5 minutes
  /** Stale-while-revalidate buffer for edge cache */
  SWR_BUFFER: 60, // 1 minute
} as const

/**
 * Hathor network average block time in seconds.
 * Used for cache normalization to align with blockchain state updates.
 */
export const HATHOR_BLOCK_TIME = 30 // seconds

/**
 * Normalize a timestamp to align with Hathor block times for better caching.
 * Rounds down to the nearest 30-second interval (average block time).
 *
 * This ensures that queries made within the same block period use the same
 * timestamp, dramatically improving cache hit rates.
 *
 * @param timestamp - Unix timestamp in seconds
 * @returns Normalized timestamp aligned to block intervals
 *
 * @example
 * ```ts
 * normalizeTimestamp(1699999999) // Returns 1699999980 (rounded to last 30s block)
 * normalizeTimestamp(1700000010) // Returns 1700000010 (already aligned)
 * ```
 */
export function normalizeTimestamp(timestamp: number): number {
  return Math.floor(timestamp / HATHOR_BLOCK_TIME) * HATHOR_BLOCK_TIME
}

/**
 * Set cache headers for immutable historical data.
 * Used for data points that are > 1 hour old and will never change.
 *
 * @param res - Express response object
 * @example
 * ```ts
 * setHistoricalCacheHeaders(ctx.res)
 * ```
 */
export function setHistoricalCacheHeaders(res: Response | undefined): void {
  if (!res) return

  // Cache forever since historical data is immutable
  res.setHeader('Cache-Control', `public, max-age=${CACHE_DURATIONS.HISTORICAL}, immutable`)
}

/**
 * Set cache headers for recent data (last hour).
 * Uses stale-while-revalidate for better UX during revalidation.
 *
 * @param res - Express response object
 * @example
 * ```ts
 * setRecentCacheHeaders(ctx.res)
 * ```
 */
export function setRecentCacheHeaders(res: Response | undefined): void {
  if (!res) return

  res.setHeader(
    'Cache-Control',
    `public, max-age=${CACHE_DURATIONS.RECENT}, s-maxage=${CACHE_DURATIONS.RECENT}, stale-while-revalidate=${CACHE_DURATIONS.SWR_BUFFER}`
  )
}

/**
 * Set cache headers for current/live data.
 * Short cache duration for near-real-time updates.
 *
 * @param res - Express response object
 * @example
 * ```ts
 * setCurrentCacheHeaders(ctx.res)
 * ```
 */
export function setCurrentCacheHeaders(res: Response | undefined): void {
  if (!res) return

  res.setHeader(
    'Cache-Control',
    `public, max-age=${CACHE_DURATIONS.CURRENT}, s-maxage=${CACHE_DURATIONS.CURRENT}, stale-while-revalidate=10`
  )
}

/**
 * Set cache headers for computed data (24h metrics, aggregates).
 * Balances freshness with computational cost.
 *
 * @param res - Express response object
 * @example
 * ```ts
 * setComputedCacheHeaders(ctx.res)
 * ```
 */
export function setComputedCacheHeaders(res: Response | undefined): void {
  if (!res) return

  res.setHeader(
    'Cache-Control',
    `public, max-age=${CACHE_DURATIONS.COMPUTED}, s-maxage=${CACHE_DURATIONS.COMPUTED}, stale-while-revalidate=${CACHE_DURATIONS.SWR_BUFFER}`
  )
}

/**
 * Determine appropriate cache headers based on data timestamp.
 * Automatically selects between historical and recent cache strategies.
 *
 * @param res - Express response object
 * @param dataTimestamp - Timestamp of the data in seconds (Unix epoch)
 * @returns The cache strategy used ('historical' | 'recent')
 *
 * @example
 * ```ts
 * const strategy = setAdaptiveCacheHeaders(ctx.res, dataPoint.timestamp)
 * console.log(`Using ${strategy} cache strategy`)
 * ```
 */
export function setAdaptiveCacheHeaders(
  res: Response | undefined,
  dataTimestamp: number
): 'historical' | 'recent' {
  if (!res) return 'recent'

  const now = Math.floor(Date.now() / 1000)
  const ageInSeconds = now - dataTimestamp
  const ONE_HOUR = 3600

  // If data is older than 1 hour, it's immutable
  if (ageInSeconds > ONE_HOUR) {
    setHistoricalCacheHeaders(res)
    return 'historical'
  }

  // Otherwise, use recent cache strategy
  setRecentCacheHeaders(res)
  return 'recent'
}

/**
 * Get the appropriate cache duration for a given time range.
 * Used for ISR revalidation configuration.
 *
 * @param startTimestamp - Start of time range in seconds
 * @param endTimestamp - End of time range in seconds
 * @returns Revalidation time in seconds, or false for no revalidation
 *
 * @example
 * ```ts
 * export const getStaticProps = async () => {
 *   const revalidate = getRevalidationTime(startTime, endTime)
 *   return { props: { data }, revalidate }
 * }
 * ```
 */
export function getRevalidationTime(
  startTimestamp: number,
  endTimestamp: number
): number | false {
  const now = Math.floor(Date.now() / 1000)
  const ageInSeconds = now - endTimestamp
  const ONE_HOUR = 3600

  // If entire range is older than 1 hour, never revalidate
  if (ageInSeconds > ONE_HOUR) {
    return false
  }

  // If range includes recent data, revalidate every 5 minutes
  return CACHE_DURATIONS.RECENT
}

/**
 * Resolution to seconds mapping for time-series queries
 */
export const RESOLUTION_SECONDS = {
  '5m': 300,
  '15m': 900,
  '1h': 3600,
  '1d': 86400,
} as const

export type Resolution = keyof typeof RESOLUTION_SECONDS

/**
 * Get the appropriate resolution based on time range.
 * Implements adaptive resolution strategy for optimal data point count.
 *
 * Target: 200-500 data points for smooth charts without overwhelming data
 *
 * @param startTimestamp - Start of time range in seconds
 * @param endTimestamp - End of time range in seconds
 * @returns The recommended resolution
 *
 * @example
 * ```ts
 * const resolution = getOptimalResolution(dayAgo, now)
 * // Returns '5m' for 1-day range
 * ```
 */
export function getOptimalResolution(
  startTimestamp: number,
  endTimestamp: number
): Resolution {
  const rangeInSeconds = endTimestamp - startTimestamp

  // 1 day or less: 5-minute intervals (~288 points)
  if (rangeInSeconds <= 86400) {
    return '5m'
  }

  // 1 week or less: 15-minute intervals (~672 points)
  if (rangeInSeconds <= 604800) {
    return '15m'
  }

  // 1 month or less: 1-hour intervals (~720 points)
  if (rangeInSeconds <= 2629746) {
    return '1h'
  }

  // More than 1 month: 1-day intervals
  return '1d'
}

/**
 * Calculate time range timestamps for common periods
 *
 * @param period - Time period ('1D' | '1W' | '1M' | '1Y' | 'ALL')
 * @param contractDeployTimestamp - Optional earliest timestamp (for 'ALL' period)
 * @returns Object with start_timestamp, end_timestamp, and resolution
 *
 * @example
 * ```ts
 * const { start_timestamp, end_timestamp, resolution } = getTimeRange('1W')
 * ```
 */
export function getTimeRange(
  period: '1D' | '1W' | '1M' | '1Y' | 'ALL',
  contractDeployTimestamp?: number
): {
  start_timestamp: number
  end_timestamp: number
  resolution: Resolution
} {
  // Normalize to block time for better caching - all requests within same ~30s block
  // will use the same timestamp, dramatically improving cache hit rates
  const now = normalizeTimestamp(Math.floor(Date.now() / 1000))
  let start_timestamp: number

  switch (period) {
    case '1D':
      start_timestamp = normalizeTimestamp(now - 86400)
      break
    case '1W':
      start_timestamp = normalizeTimestamp(now - 604800)
      break
    case '1M':
      start_timestamp = normalizeTimestamp(now - 2629746)
      break
    case '1Y':
      start_timestamp = normalizeTimestamp(now - 31556952)
      break
    case 'ALL':
      start_timestamp = normalizeTimestamp(contractDeployTimestamp || now - 31556952)
      break
  }

  const resolution = getOptimalResolution(start_timestamp, now)

  return {
    start_timestamp,
    end_timestamp: now,
    resolution,
  }
}
