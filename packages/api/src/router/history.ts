/**
 * Historical data router for time-series chart visualization.
 *
 * Provides optimized endpoints for fetching pool and token historical data
 * with appropriate caching strategies.
 */

import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createTRPCRouter, procedure } from '../trpc'
import { fetchHistoricalData } from '../helpers/fetchFunction'
import {
  getTimeRange,
  getOptimalResolution,
  setAdaptiveCacheHeaders,
  setCurrentCacheHeaders,
  setComputedCacheHeaders,
  normalizeTimestamp,
  type Resolution,
} from '../helpers/cacheHeaders'
import { parsePoolApiInfo } from '../utils/namedTupleParsers'

const poolManagerId = process.env.NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID

if (!poolManagerId) {
  throw new Error('NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID environment variable is not set')
}

/**
 * Input schema for time period selection
 */
const timePeriodSchema = z.enum(['1D', '1W', '1M', '1Y', 'ALL'])

/**
 * Input schema for custom time range
 */
const customTimeRangeSchema = z.object({
  startTimestamp: z.number().int().positive(),
  endTimestamp: z.number().int().positive(),
  resolution: z.enum(['5m', '15m', '1h', '1d']).optional(),
})

/**
 * Common pool identifier schema
 */
const poolIdSchema = z.object({
  poolId: z.string().describe('Pool ID in format: token0/token1/fee'),
})

/**
 * Common token identifier schema
 */
const tokenIdSchema = z.object({
  tokenId: z.string().describe('Token UID in hex format'),
})

export const historyRouter = createTRPCRouter({
  /**
   * Get pool historical data for a predefined time period.
   * Returns reserves, volume, liquidity, and fees over time.
   */
  getPoolHistory: procedure
    .input(
      z.object({
        poolId: z.string(),
        period: timePeriodSchema,
      })
    )
    .query(async ({ input, ctx }) => {
      const { poolId, period } = input

      // Get time range and resolution
      const { start_timestamp, end_timestamp, resolution } = getTimeRange(period)

      // Construct the pool info call (pool_key must be a quoted string)
      const poolInfoCall = `front_end_api_pool("${poolId}")`

      try {
        // Fetch historical data
        const response = await fetchHistoricalData(
          poolManagerId,
          start_timestamp,
          end_timestamp,
          resolution,
          {
            calls: [poolInfoCall],
          }
        )

        // Set appropriate cache headers
        if (response.data_points.length > 0) {
          const latestTimestamp = response.data_points[response.data_points.length - 1]?.timestamp
          if (latestTimestamp) {
            setAdaptiveCacheHeaders(ctx.res, latestTimestamp)
          }
        }

        // Parse and format the data
        const chartData = response.data_points.map((point) => {
          const poolData = point.values[poolInfoCall]
          const parsedPool = poolData ? parsePoolApiInfo(poolData) : null

          return {
            timestamp: point.timestamp,
            blockHeight: point.block_height,
            reserve0: parsedPool?.reserve0 || '0',
            reserve1: parsedPool?.reserve1 || '0',
            volumeUSD: parsedPool?.volume || 0,
            liquidityUSD: ((parsedPool?.reserve0 || 0) + (parsedPool?.reserve1 || 0)),
            feeUSD: ((parsedPool?.fee0 || 0) + (parsedPool?.fee1 || 0)),
            transactionCount: parsedPool?.transactions || 0,
          }
        })

        return {
          success: true,
          poolId,
          period,
          resolution: response.resolution,
          data: chartData,
          totalPoints: response.total_points,
        }
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch pool history: ${error.message}`,
        })
      }
    }),

  /**
   * Get pool historical data for a custom time range.
   */
  getPoolHistoryCustom: procedure
    .input(
      z.object({
        poolId: z.string(),
        ...customTimeRangeSchema.shape,
      })
    )
    .query(async ({ input, ctx }) => {
      const { poolId, startTimestamp, endTimestamp, resolution: inputResolution } = input

      // Determine optimal resolution if not provided
      const resolution = inputResolution || getOptimalResolution(startTimestamp, endTimestamp)

      const poolInfoCall = `front_end_api_pool("${poolId}")`

      try {
        const response = await fetchHistoricalData(
          poolManagerId,
          startTimestamp,
          endTimestamp,
          resolution,
          {
            calls: [poolInfoCall],
          }
        )

        if (response.data_points.length > 0) {
          const latestTimestamp = response.data_points[response.data_points.length - 1]?.timestamp
          if (latestTimestamp) {
            setAdaptiveCacheHeaders(ctx.res, latestTimestamp)
          }
        }

        const chartData = response.data_points.map((point) => {
          const poolData = point.values[poolInfoCall]
          const parsedPool = poolData ? parsePoolApiInfo(poolData) : null

          return {
            timestamp: point.timestamp,
            blockHeight: point.block_height,
            reserve0: parsedPool?.reserve0 || '0',
            reserve1: parsedPool?.reserve1 || '0',
            volumeUSD: parsedPool?.volume || 0,
            liquidityUSD: ((parsedPool?.reserve0 || 0) + (parsedPool?.reserve1 || 0)),
            feeUSD: ((parsedPool?.fee0 || 0) + (parsedPool?.fee1 || 0)),
            transactionCount: parsedPool?.transactions || 0,
          }
        })

        return {
          success: true,
          poolId,
          resolution: response.resolution,
          data: chartData,
          totalPoints: response.total_points,
        }
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch pool history: ${error.message}`,
        })
      }
    }),

  /**
   * Get token price history for a predefined time period.
   * Returns price in HTR and USD over time.
   */
  getTokenHistory: procedure
    .input(
      z.object({
        tokenId: z.string(),
        poolId: z.string(),
        period: timePeriodSchema,
      })
    )
    .query(async ({ input, ctx }) => {
      const { tokenId, poolId, period } = input

      const { start_timestamp, end_timestamp, resolution } = getTimeRange(period)

      const poolInfoCall = `front_end_api_pool("${poolId}")`

      try {
        const response = await fetchHistoricalData(
          poolManagerId,
          start_timestamp,
          end_timestamp,
          resolution,
          {
            calls: [poolInfoCall],
          }
        )

        if (response.data_points.length > 0) {
          const latestTimestamp = response.data_points[response.data_points.length - 1]?.timestamp
          if (latestTimestamp) {
            setAdaptiveCacheHeaders(ctx.res, latestTimestamp)
          }
        }

        const chartData = response.data_points.map((point) => {
          const poolData = point.values[poolInfoCall]
          const parsedPool = poolData ? parsePoolApiInfo(poolData) : null

          // Calculate price based on pool reserves
          const reserve0 = Number(parsedPool?.reserve0 || 0)
          const reserve1 = Number(parsedPool?.reserve1 || 0)

          // Determine if token is token0 or token1 in the pair
          const isToken0 = poolId.startsWith(tokenId) || poolId.startsWith('00')
          const priceInHTR = isToken0 && reserve1 > 0 ? reserve0 / reserve1 : reserve0 > 0 ? reserve1 / reserve0 : 0

          // Calculate liquidity in USD (reserves + reserves for simplification)
          const liquidityUSD = (reserve0 + reserve1)
          const priceInUSD = liquidityUSD && (reserve0 + reserve1) > 0
            ? liquidityUSD / (reserve0 + reserve1)
            : 0

          return {
            timestamp: point.timestamp,
            blockHeight: point.block_height,
            priceHTR: priceInHTR,
            priceUSD: priceInUSD,
            volumeUSD: parsedPool?.volume || 0,
            liquidityUSD,
          }
        })

        return {
          success: true,
          tokenId,
          poolId,
          period,
          resolution: response.resolution,
          data: chartData,
          totalPoints: response.total_points,
        }
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch token history: ${error.message}`,
        })
      }
    }),

  /**
   * Get token price history for a custom time range.
   */
  getTokenHistoryCustom: procedure
    .input(
      z.object({
        tokenId: z.string(),
        poolId: z.string(),
        ...customTimeRangeSchema.shape,
      })
    )
    .query(async ({ input, ctx }) => {
      const { tokenId, poolId, startTimestamp, endTimestamp, resolution: inputResolution } = input

      const resolution = inputResolution || getOptimalResolution(startTimestamp, endTimestamp)

      const poolInfoCall = `front_end_api_pool("${poolId}")`

      try {
        const response = await fetchHistoricalData(
          poolManagerId,
          startTimestamp,
          endTimestamp,
          resolution,
          {
            calls: [poolInfoCall],
          }
        )

        if (response.data_points.length > 0) {
          const latestTimestamp = response.data_points[response.data_points.length - 1]?.timestamp
          if (latestTimestamp) {
            setAdaptiveCacheHeaders(ctx.res, latestTimestamp)
          }
        }

        const chartData = response.data_points.map((point) => {
          const poolData = point.values[poolInfoCall]
          const parsedPool = poolData ? parsePoolApiInfo(poolData) : null

          const reserve0 = Number(parsedPool?.reserve0 || 0)
          const reserve1 = Number(parsedPool?.reserve1 || 0)

          const isToken0 = poolId.startsWith(tokenId) || poolId.startsWith('00')
          const priceInHTR = isToken0 && reserve1 > 0 ? reserve0 / reserve1 : reserve0 > 0 ? reserve1 / reserve0 : 0

          const liquidityUSD = (reserve0 + reserve1)
          const priceInUSD = liquidityUSD && (reserve0 + reserve1) > 0
            ? liquidityUSD / (reserve0 + reserve1)
            : 0

          return {
            timestamp: point.timestamp,
            blockHeight: point.block_height,
            priceHTR: priceInHTR,
            priceUSD: priceInUSD,
            volumeUSD: parsedPool?.volume || 0,
            liquidityUSD,
          }
        })

        return {
          success: true,
          tokenId,
          poolId,
          resolution: response.resolution,
          data: chartData,
          totalPoints: response.total_points,
        }
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch token history: ${error.message}`,
        })
      }
    }),

  /**
   * Get current snapshot for real-time data.
   * Provides latest pool state with short cache duration.
   */
  getCurrentPoolSnapshot: procedure.input(poolIdSchema).query(async ({ input, ctx }) => {
    const { poolId } = input

    // Get data from the last 5 minutes for current state
    const now = Math.floor(Date.now() / 1000)
    const fiveMinutesAgo = now - 300

    const poolInfoCall = `front_end_api_pool("${poolId}")`

    try {
      const response = await fetchHistoricalData(poolManagerId, fiveMinutesAgo, now, '5m', {
        calls: [poolInfoCall],
      })

      // Set short cache for current data
      setCurrentCacheHeaders(ctx.res)

      if (response.data_points.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No current data available for this pool',
        })
      }

      // Get the latest data point
      const latestPoint = response.data_points[response.data_points.length - 1]
      if (!latestPoint) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No data points returned',
        })
      }

      const poolData = latestPoint.values[poolInfoCall]
      const parsedPool = poolData ? parsePoolApiInfo(poolData) : null

      return {
        success: true,
        poolId,
        timestamp: latestPoint.timestamp,
        blockHeight: latestPoint.block_height,
        data: {
          reserve0: parsedPool?.reserve0 || '0',
          reserve1: parsedPool?.reserve1 || '0',
          volumeUSD: parsedPool?.volume || 0,
          liquidityUSD: ((parsedPool?.reserve0 || 0) + (parsedPool?.reserve1 || 0)),
          feeUSD: ((parsedPool?.fee0 || 0) + (parsedPool?.fee1 || 0)),
          transactionCount: parsedPool?.transactions || 0,
        },
      }
    } catch (error: any) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch current pool snapshot: ${error.message}`,
      })
    }
  }),

  /**
   * Get 24h metrics (volume change, price change, min/max, etc.)
   * Uses computed cache headers since this is expensive to calculate.
   */
  get24hMetrics: procedure
    .input(
      z.object({
        poolId: z.string(),
        tokenId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { poolId, tokenId } = input

    // Normalize timestamps to 30-second block intervals for better caching
    const now = normalizeTimestamp(Math.floor(Date.now() / 1000))
    const oneDayAgo = normalizeTimestamp(now - 86400)

    const poolInfoCall = `front_end_api_pool("${poolId}")`

    try {
      // Fetch data with 1h resolution for last 24 hours
      const response = await fetchHistoricalData(poolManagerId, oneDayAgo, now, '1h', {
        calls: [poolInfoCall],
      })

      // Set computed cache headers
      setComputedCacheHeaders(ctx.res)

      if (response.data_points.length < 2) {
        return {
          success: false,
          poolId,
          message: 'Insufficient data for 24h metrics',
        }
      }

      const firstPoint = response.data_points[0]
      const lastPoint = response.data_points[response.data_points.length - 1]

      if (!firstPoint || !lastPoint) {
        return {
          success: false,
          poolId,
          message: 'Missing data points',
        }
      }

      const firstPool = firstPoint.values[poolInfoCall]
        ? parsePoolApiInfo(firstPoint.values[poolInfoCall])
        : null
      const lastPool = lastPoint.values[poolInfoCall] ? parsePoolApiInfo(lastPoint.values[poolInfoCall]) : null

      if (!firstPool || !lastPool) {
        return {
          success: false,
          poolId,
          message: 'Failed to parse pool data',
        }
      }

      // Calculate 24h changes
      const volume24h = lastPool.volume - firstPool.volume
      const fees24h = (lastPool.fee0 + lastPool.fee1) - (firstPool.fee0 + firstPool.fee1)
      const transactions24h = lastPool.transactions - firstPool.transactions

      // Calculate price change
      const firstReserve0 = Number(firstPool.reserve0)
      const firstReserve1 = Number(firstPool.reserve1)
      const lastReserve0 = Number(lastPool.reserve0)
      const lastReserve1 = Number(lastPool.reserve1)

      const firstPrice = firstReserve1 > 0 ? firstReserve0 / firstReserve1 : 0
      const lastPrice = lastReserve1 > 0 ? lastReserve0 / lastReserve1 : 0
      const priceChange24h = firstPrice > 0 ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0

      // Calculate min/max prices from all data points
      const isToken0 = poolId.startsWith(tokenId) || poolId.startsWith('00')
      let minPrice = Infinity
      let maxPrice = -Infinity

      response.data_points.forEach((point) => {
        const poolData = point.values[poolInfoCall]
        if (!poolData) return

        const parsedPool = parsePoolApiInfo(poolData)
        const reserve0 = Number(parsedPool.reserve0)
        const reserve1 = Number(parsedPool.reserve1)

        const price = isToken0 && reserve1 > 0 ? reserve0 / reserve1 : reserve0 > 0 ? reserve1 / reserve0 : 0

        if (price > 0) {
          minPrice = Math.min(minPrice, price)
          maxPrice = Math.max(maxPrice, price)
        }
      })

      // If no valid prices found, set to 0
      if (minPrice === Infinity) minPrice = 0
      if (maxPrice === -Infinity) maxPrice = 0

      return {
        success: true,
        poolId,
        minPrice,
        maxPrice,
        volume24h,
        fees24h,
        transactions24h,
        priceChange24h,
        currentLiquidityUSD: (lastPool.reserve0 + lastPool.reserve1),
        timestamp: lastPoint.timestamp,
      }
    } catch (error: any) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch 24h metrics: ${error.message}`,
      })
    }
  }),
})

export type HistoryRouter = typeof historyRouter
