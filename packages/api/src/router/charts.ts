import { z } from 'zod'
import { createTRPCRouter, procedure } from '../trpc'
import { priceServiceClient, PriceServiceError, type OHLCDataPoint } from '../clients/priceService'

// Validation schemas
const IntervalSchema = z.enum(['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'])
const CurrencySchema = z.enum(['USD', 'HTR'])
const ChartPeriodSchema = z.enum(['1h', '4h', '1d', '1w', '1m', '3m', '6m', '1y'])

// Helper function to convert chart period to appropriate interval and limit
function getIntervalAndLimit(period: string): { interval: string; limit: number } {
  switch (period) {
    case '1h':
      return { interval: '5m', limit: 60 }    // Request more points to ensure we get 1 hour of data
    case '4h':
      return { interval: '15m', limit: 48 }   // Request more points for better coverage
    case '1d':
      return { interval: '1h', limit: 48 }    // Request 48 hours worth to ensure 24 hours
    case '1w':
      return { interval: '4h', limit: 84 }    // 2 weeks worth to ensure 1 week coverage
    case '1m':
      return { interval: '1d', limit: 60 }    // 2 months worth to ensure 1 month coverage
    case '3m':
      return { interval: '1d', limit: 120 }   // 4 months worth to ensure 3 months coverage
    case '6m':
      return { interval: '1d', limit: 240 }   // 8 months worth to ensure 6 months coverage
    case '1y':
      return { interval: '1w', limit: 104 }   // 2 years worth to ensure 1 year coverage
    default:
      return { interval: '1h', limit: 48 }
  }
}

// Note: getTimeRange removed - using "latest N candles" approach instead
// This provides better caching and always includes the current/live candle

// Helper function to convert price service OHLC to TradingView format
function formatOHLCForTradingView(data: OHLCDataPoint[]): Array<{
  time: number
  open: number
  high: number
  low: number
  close: number
  value?: number
}> {
  // Sort data by timestamp to ensure ascending order
  const sortedData = [...data].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  return sortedData.map((point) => ({
    time: Math.floor(new Date(point.timestamp).getTime() / 1000), // Convert ISO string to Unix timestamp
    open: point.open,
    high: point.high,
    low: point.low,
    close: point.close,
    value: point.close, // For line charts
  }))
}

export const chartsRouter = createTRPCRouter({
  // Token price chart data (OHLC)
  tokenPriceHistory: procedure
    .input(
      z.object({
        tokenUid: z.string(),
        period: ChartPeriodSchema.default('1d'),
        currency: CurrencySchema.default('USD'),
        interval: IntervalSchema.optional(),
        limit: z.number().min(10).max(1000).optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        // Determine interval and limit based on period if not explicitly provided
        const { interval, limit } =
          input.interval && input.limit
            ? { interval: input.interval, limit: input.limit }
            : getIntervalAndLimit(input.period)

        // Simplified approach: Request latest N candles without time range
        // This provides better caching and always includes the live candle
        // NOTE: interval is now required in the new price service architecture
        const priceHistoryData = await priceServiceClient.getTokenPriceHistory(input.tokenUid, {
          interval: interval as '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w',
          limit,
        })

        // For now, we'll use close price for both USD and HTR
        // TODO: Implement proper HTR conversion when price service supports it
        const formattedData = priceHistoryData ? formatOHLCForTradingView(priceHistoryData) : []

        // Get interval from the first data point or use the requested interval
        const dataInterval = priceHistoryData && priceHistoryData.length > 0 ? priceHistoryData[0]?.interval : interval

        return {
          tokenUid: input.tokenUid,
          period: input.period,
          currency: input.currency,
          interval: dataInterval,
          data: formattedData,
          dataPoints: formattedData.length,
        }
      } catch (error) {
        console.error(`Error fetching token price history for ${input.tokenUid}:`, error)

        // Return fallback data structure
        return {
          tokenUid: input.tokenUid,
          period: input.period,
          currency: input.currency,
          interval: '1h',
          data: [],
          dataPoints: 0,
          error: error instanceof PriceServiceError ? error.message : 'Failed to fetch price data',
        }
      }
    }),

  // Current token price with change
  tokenPriceWithChange: procedure
    .input(
      z.object({
        tokenUid: z.string(),
        currency: CurrencySchema.default('USD'),
        changeTimeframe: z.enum(['5m', '1h', '1d']).default('1d'),
      })
    )
    .query(async ({ input }) => {
      try {
        // Get current price
        const currentPrice = await priceServiceClient.getTokenPrice(input.tokenUid)

        // Get historical price for change calculation
        const changeInterval = input.changeTimeframe === '5m' ? '5m' : input.changeTimeframe === '1h' ? '1h' : '1d'

        const historicalTime = new Date()
        if (input.changeTimeframe === '5m') {
          historicalTime.setMinutes(historicalTime.getMinutes() - 5)
        } else if (input.changeTimeframe === '1h') {
          historicalTime.setHours(historicalTime.getHours() - 1)
        } else {
          historicalTime.setHours(historicalTime.getHours() - 24)
        }

        let historicalPrice = currentPrice.price_usd
        let change = 0

        try {
          const history = await priceServiceClient.getTokenPriceHistory(input.tokenUid, {
            interval: changeInterval as '5m' | '1h' | '1d',
            from_time: historicalTime.toISOString(),
            limit: 1,
          })

          if (history.length > 0) {
            historicalPrice = history[0]?.close || 0
            if (historicalPrice > 0) {
              change = (currentPrice.price_usd - historicalPrice) / historicalPrice
            }
          }
        } catch (historyError) {
          console.warn(`Could not fetch historical data for change calculation:`, historyError)
        }

        const price = input.currency === 'USD' ? currentPrice.price_usd : currentPrice.price_htr

        return {
          tokenUid: input.tokenUid,
          currency: input.currency,
          price,
          previousPrice: input.currency === 'USD' ? historicalPrice : currentPrice.price_htr,
          change,
          changeTimeframe: input.changeTimeframe,
          lastUpdated: currentPrice.last_updated,
        }
      } catch (error) {
        console.error(`Error fetching token price with change for ${input.tokenUid}:`, error)

        return {
          tokenUid: input.tokenUid,
          currency: input.currency,
          price: 0,
          previousPrice: 0,
          change: 0,
          changeTimeframe: input.changeTimeframe,
          lastUpdated: new Date().toISOString(),
          error: error instanceof PriceServiceError ? error.message : 'Failed to fetch price data',
        }
      }
    }),

  // Pool volume history
  poolVolumeHistory: procedure
    .input(
      z.object({
        poolKey: z.string(),
        period: ChartPeriodSchema.default('1w'),
        interval: IntervalSchema.optional(),
        limit: z.number().min(10).max(1000).optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const { interval, limit } =
          input.interval && input.limit
            ? { interval: input.interval, limit: input.limit }
            : getIntervalAndLimit(input.period)

        try {
          // Simplified approach: Request latest N volume records without time range
          // This provides better caching and always includes the current volume data
          // NOTE: interval is now required in the new price service architecture
          const volumeDataPoints = await priceServiceClient.getPoolVolumeHistory(input.poolKey, {
            interval: interval as '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w',
            limit,
          })

          // Transform to chart format - timestamp is ISO string, need to convert to Unix
          // Sort by timestamp ascending (oldest first) for proper chart display
          const sortedData = [...volumeDataPoints].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )

          const chartData = sortedData.map((point) => ({
            time: Math.floor(new Date(point.timestamp).getTime() / 1000), // Convert ISO to Unix seconds
            value: point.volume_usd,
            volume_a: point.volume_a,
            volume_b: point.volume_b,
            transactions: point.transactions,
          }))

          return {
            poolKey: input.poolKey,
            period: input.period,
            interval: volumeDataPoints[0]?.interval || interval,
            data: chartData,
            dataPoints: chartData.length,
          }
        } catch (priceServiceError) {
          // Fallback to returning empty data for now
          console.warn(`Pool volume history not available from price service: ${priceServiceError}`)

          return {
            poolKey: input.poolKey,
            period: input.period,
            interval,
            data: [],
            dataPoints: 0,
            fallback: true,
          }
        }
      } catch (error) {
        console.error(`Error fetching pool volume history for ${input.poolKey}:`, error)

        return {
          poolKey: input.poolKey,
          period: input.period,
          interval: '1h',
          data: [],
          dataPoints: 0,
          error: error instanceof Error ? error.message : 'Failed to fetch pool data',
        }
      }
    }),

  // Pool TVL history
  poolTVLHistory: procedure
    .input(
      z.object({
        poolKey: z.string(),
        period: ChartPeriodSchema.default('1w'),
        interval: IntervalSchema.optional(),
        limit: z.number().min(10).max(1000).optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const { interval, limit } =
          input.interval && input.limit
            ? { interval: input.interval, limit: input.limit }
            : getIntervalAndLimit(input.period)

        try {
          // Fetch TVL data from price service
          // NOTE: interval is now required in the new price service architecture
          const tvlResponse = await priceServiceClient.getPoolTVLHistory(input.poolKey, {
            interval: interval as '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w',
            limit,
          })

          // Transform to chart format - sort by timestamp ascending (oldest first)
          const sortedData = [...tvlResponse.data].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )

          const chartData = sortedData.map((point) => ({
            time: Math.floor(new Date(point.timestamp).getTime() / 1000), // Convert ISO to Unix seconds
            value: point.tvl_usd,
            tvl_usd: point.tvl_usd,
            tvl_htr: point.tvl_htr,
            reserve_a: point.reserve_a,
            reserve_b: point.reserve_b,
            price_a_usd: point.price_a_usd,
            price_b_usd: point.price_b_usd,
          }))

          return {
            poolKey: input.poolKey,
            period: input.period,
            interval: tvlResponse.interval,
            data: chartData,
            dataPoints: chartData.length,
          }
        } catch (priceServiceError) {
          // Fallback to returning empty data
          console.warn(`Pool TVL history not available from price service: ${priceServiceError}`)

          return {
            poolKey: input.poolKey,
            period: input.period,
            interval,
            data: [],
            dataPoints: 0,
            fallback: true,
          }
        }
      } catch (error) {
        console.error(`Error fetching pool TVL history for ${input.poolKey}:`, error)

        return {
          poolKey: input.poolKey,
          period: input.period,
          interval: '1h',
          data: [],
          dataPoints: 0,
          error: error instanceof Error ? error.message : 'Failed to fetch pool data',
        }
      }
    }),

  // Pool APR history
  poolAPRHistory: procedure
    .input(
      z.object({
        poolKey: z.string(),
        period: ChartPeriodSchema.default('1w'),
        interval: z.enum(['1h', '4h', '1d']).optional(),
        limit: z.number().min(10).max(1000).optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const { interval, limit } =
          input.interval && input.limit
            ? { interval: input.interval, limit: input.limit }
            : getIntervalAndLimit(input.period)

        // Ensure interval is valid for APR (only 1h, 4h, 1d supported)
        const aprInterval = interval === '5m' || interval === '15m' || interval === '30m' ? '1h' : interval === '1w' ? '1d' : interval

        // Adjust limit based on period to get the correct time range
        // For APR, we want to show exactly the period requested
        let aprLimit = limit
        if (input.period === '1h') {
          aprLimit = 12 // 12 points at 5m intervals (but APR uses 1h, so ~1 point)
        } else if (input.period === '4h') {
          aprLimit = 4 // 4 points at 1h intervals = 4 hours
        } else if (input.period === '1d') {
          aprLimit = 24 // 24 points at 1h intervals = 24 hours
        } else if (input.period === '1w') {
          aprLimit = 42 // 42 points at 4h intervals = 7 days
        } else if (input.period === '1m') {
          aprLimit = 30 // 30 points at 1d intervals = 30 days
        } else if (input.period === '3m') {
          aprLimit = 90 // 90 points at 1d intervals = 90 days
        } else if (input.period === '6m') {
          aprLimit = 180 // 180 points at 1d intervals = 180 days
        } else if (input.period === '1y') {
          aprLimit = 52 // 52 points at 1w intervals = 52 weeks
        }

        try {
          // Fetch APR data from price service
          // NOTE: interval is now required in the new price service architecture
          const aprResponse = await priceServiceClient.getPoolAPRHistory(input.poolKey, {
            interval: aprInterval as '1h' | '4h' | '1d',
            limit: aprLimit,
          })

          // Transform to chart format - sort by timestamp ascending (oldest first)
          const sortedData = [...aprResponse.data].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )

          const chartData = sortedData.map((point) => ({
            time: Math.floor(new Date(point.timestamp).getTime() / 1000), // Convert ISO to Unix seconds
            value: point.apr,
            apr: point.apr,
            tvl_usd: point.tvl_usd,
            daily_volume_usd: point.daily_volume_usd,
            fee_rate: point.fee_rate,
          }))

          return {
            poolKey: input.poolKey,
            period: input.period,
            interval: aprResponse.interval,
            data: chartData,
            dataPoints: chartData.length,
          }
        } catch (priceServiceError) {
          // Fallback to returning empty data
          console.warn(`Pool APR history not available from price service: ${priceServiceError}`)

          return {
            poolKey: input.poolKey,
            period: input.period,
            interval: aprInterval,
            data: [],
            dataPoints: 0,
            fallback: true,
          }
        }
      } catch (error) {
        console.error(`Error fetching pool APR history for ${input.poolKey}:`, error)

        return {
          poolKey: input.poolKey,
          period: input.period,
          interval: '1d',
          data: [],
          dataPoints: 0,
          error: error instanceof Error ? error.message : 'Failed to fetch pool data',
        }
      }
    }),

  // Price service health check
  priceServiceHealth: procedure.query(async () => {
    try {
      const health = await priceServiceClient.healthCheck()
      return {
        available: true,
        ...health,
      }
    } catch (error) {
      return {
        available: false,
        status: 'unavailable',
        redis: false,
        database: false,
        hathor: false,
        error: error instanceof Error ? error.message : 'Price service unavailable',
      }
    }
  }),

  // Price service statistics
  priceServiceStats: procedure.query(async () => {
    try {
      return await priceServiceClient.getStats()
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to fetch stats',
      }
    }
  }),
})
