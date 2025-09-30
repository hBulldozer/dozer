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
      return { interval: '5m', limit: 12 }    // 12 x 5min = 1 hour
    case '4h':
      return { interval: '15m', limit: 16 }   // 16 x 15min = 4 hours
    case '1d':
      return { interval: '1h', limit: 24 }    // 24 x 1hour = 1 day
    case '1w':
      return { interval: '4h', limit: 42 }    // 42 x 4hour = 1 week
    case '1m':
      return { interval: '1d', limit: 30 }    // 30 x 1day = 1 month
    case '3m':
      return { interval: '1d', limit: 90 }    // 90 x 1day = 3 months
    case '6m':
      return { interval: '1d', limit: 180 }   // 180 x 1day = 6 months
    case '1y':
      return { interval: '1w', limit: 52 }    // 52 x 1week = 1 year
    default:
      return { interval: '1h', limit: 24 }
  }
}

// Helper function to calculate time range
function getTimeRange(period: string): { from_time: string; to_time: string } {
  const now = new Date()
  const to_time = now.toISOString()
  let from_time: Date

  switch (period) {
    case '1h':
      from_time = new Date(now.getTime() - 1 * 60 * 60 * 1000)
      break
    case '4h':
      from_time = new Date(now.getTime() - 4 * 60 * 60 * 1000)
      break
    case '1d':
      from_time = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      break
    case '1w':
      from_time = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '1m':
      from_time = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '3m':
      from_time = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    case '6m':
      from_time = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
      break
    case '1y':
      from_time = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      break
    default:
      from_time = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  }

  return {
    from_time: from_time.toISOString(),
    to_time,
  }
}

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

        // Get time range for the period
        const { from_time, to_time } = getTimeRange(input.period)

        // Fetch OHLC data from price service
        const priceHistoryData = await priceServiceClient.getTokenPriceHistory(input.tokenUid, {
          interval: interval as any,
          from_time,
          to_time,
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
          from_time,
          to_time,
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
          from_time: new Date().toISOString(),
          to_time: new Date().toISOString(),
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
            interval: changeInterval as any,
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
        // For now, fallback to existing database queries since pool history
        // might not be available in price service yet
        // TODO: Implement proper pool volume history from price service

        const { interval, limit } =
          input.interval && input.limit
            ? { interval: input.interval, limit: input.limit }
            : getIntervalAndLimit(input.period)

        const { from_time, to_time } = getTimeRange(input.period)

        try {
          const volumeHistory = await priceServiceClient.getPoolVolumeHistory(input.poolKey, {
            interval: interval as any,
            from_time,
            to_time,
            limit,
          })

          return {
            poolKey: input.poolKey,
            period: input.period,
            interval: volumeHistory.interval,
            data: volumeHistory.data.map((point) => ({
              time: point.timestamp,
              value: point.volume_usd,
              volume_token_a: point.volume_token_a,
              volume_token_b: point.volume_token_b,
              transactions: point.transactions,
            })),
            dataPoints: volumeHistory.data.length,
            from_time,
            to_time,
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
            from_time,
            to_time,
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
          from_time: new Date().toISOString(),
          to_time: new Date().toISOString(),
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
        const { interval } = input.interval ? { interval: input.interval } : getIntervalAndLimit(input.period)

        const { from_time, to_time } = getTimeRange(input.period)

        // TVL history is not available in the current price service
        // Return empty data structure to indicate this feature is not available
        console.warn(`Pool TVL history is not available in the current price service version`)

        return {
          poolKey: input.poolKey,
          period: input.period,
          interval,
          data: [],
          dataPoints: 0,
          from_time,
          to_time,
          fallback: true,
        }
      } catch (error) {
        console.error(`Error fetching pool TVL history for ${input.poolKey}:`, error)

        return {
          poolKey: input.poolKey,
          period: input.period,
          interval: '1h',
          data: [],
          dataPoints: 0,
          from_time: new Date().toISOString(),
          to_time: new Date().toISOString(),
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
