import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, procedure } from '../trpc'
import axios from 'axios'

// Price service configuration
const PRICE_SERVICE_URL = process.env.PRICE_SERVICE_URL || 'http://localhost:3000'
// console.log('Using price service at:', PRICE_SERVICE_URL)

// Define types for the price service responses
interface TokenPrice {
  token: string
  symbol?: string
  priceInHTR: number
  priceInUSD: number
  timestamp: number
}

interface PricePoint {
  timestamp: number
  price: number
  volume?: number
}

interface HistoricalPriceResponse {
  token: string
  prices: PricePoint[]
  interval: string
  currency: string
  from: number
  to: number
}

// TradingView chart data types
interface TVLinePoint {
  time: number
  value: number
}

interface TVCandlestick {
  time: number
  open: number
  high: number
  low: number
  close: number
}

interface TVChartResponse<T> {
  token: string
  symbol: string
  name: string
  currency: string
  interval: string
  data: T[]
}

/**
 * Router to interact with the new price service
 */
export const newPricesRouter = createTRPCRouter({
  // Get token information map (uuid to symbol)
  tokenInfo: procedure.query(async ({ ctx }) => {
    try {
      const tokens = await ctx.prisma.token.findMany({
        select: {
          uuid: true,
          symbol: true,
          name: true,
        },
      })

      if (!tokens) {
        throw new Error('Failed to fetch tokens from database')
      }

      const tokenUuids = tokens.map((token) => token.uuid).join(',')

      // Also fetch token info from the price service to make sure we have data for any
      // tokens that might be in the price service but not in our database
      try {
        const response = await axios.get(`${PRICE_SERVICE_URL}/api/v1/info/tokens`, {
          timeout: 5000,
        })

        // Combine the data, preferring our database information
        const tokenMap: Record<string, { symbol: string; name?: string }> = {}

        // Add price service tokens first
        if (response.data && response.data.tokens) {
          response.data.tokens.forEach((token: { uuid: string; symbol: string; name?: string }) => {
            tokenMap[token.uuid] = {
              symbol: token.symbol,
              name: token.name,
            }
          })
        }

        // Then override with our database tokens
        tokens.forEach((token) => {
          tokenMap[token.uuid] = {
            symbol: token.symbol,
            name: token.name,
          }
        })

        return tokenMap
      } catch (error) {
        // If we can't get token info from the price service, just use our database
        // console.error('Error fetching token info from price service:', error);

        const tokenMap: Record<string, { symbol: string; name?: string }> = {}
        tokens.forEach((token) => {
          tokenMap[token.uuid] = {
            symbol: token.symbol,
            name: token.name,
          }
        })

        return tokenMap
      }
    } catch (error) {
      // console.error('Error fetching token info:', error);

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch token info',
      })
    }
  }),

  // Get current prices for all tokens
  all: procedure.query(async ({ ctx }) => {
    try {
      // First, get all tokens from the database
      const tokens = await ctx.prisma.token.findMany({
        select: {
          uuid: true,
          symbol: true,
          chainId: true,
        },
      })

      if (!tokens) {
        throw new Error('Failed to fetch tokens from database')
      }

      // Extract token UUIDs and create a comma-separated string
      const tokenUuids = tokens.map((token) => token.uuid).join(',')

      // Get prices for all tokens from the price service
      const response = await axios.get(`${PRICE_SERVICE_URL}/api/v1/prices/current`, {
        params: {
          tokens: tokenUuids,
          currency: 'USD',
        },
        timeout: 5000,
      })

      const prices: Record<string, number> = {}

      // Convert to the format expected by the frontend
      if (response.data && response.data.prices) {
        response.data.prices.forEach((price: TokenPrice) => {
          prices[price.token] = price.priceInUSD
        })
      }

      // Ensure all tokens have a price entry, even if zero
      tokens.forEach((token) => {
        if (prices[token.uuid] === undefined) {
          prices[token.uuid] = 0
        }
      })

      return prices
    } catch (error) {
      // console.error('Error fetching prices from price service:', error)

      // Fallback to existing price system
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch prices from new price service',
      })
    }
  }),

  // Get 24h price data for all tokens
  all24h: procedure.query(async ({ ctx }) => {
    try {
      // First, get all tokens from the database
      const tokens = await ctx.prisma.token.findMany({
        select: {
          uuid: true,
          symbol: true,
          chainId: true,
        },
      })

      if (!tokens) {
        throw new Error('Failed to fetch tokens from database')
      }

      const now = Date.now()
      const oneDayAgo = now - 24 * 60 * 60 * 1000
      const prices24hUSD: Record<string, number[]> = {}

      // Fetch historical data for all tokens in parallel
      await Promise.all(
        tokens.map(async (token) => {
          try {
            // Special case for hUSDC which is pegged to USD
            if (token.symbol === 'hUSDC') {
              prices24hUSD[token.uuid] = Array(24).fill(1) // hUSDC is pegged to USD
              return
            }

            const response = await axios.get(`${PRICE_SERVICE_URL}/api/v1/prices/historical/${token.uuid}`, {
              params: {
                from: Math.floor(oneDayAgo / 1000),
                to: Math.floor(now / 1000),
                interval: '1h',
                currency: 'USD',
              },
              timeout: 5000,
            })

            if (response.data && response.data.prices) {
              prices24hUSD[token.uuid] = response.data.prices.map((point: PricePoint) => point.price)
            } else {
              prices24hUSD[token.uuid] = [0]
            }
          } catch (error) {
            // console.error(`Error fetching historical data for token ${token.uuid}:`, error);
            prices24hUSD[token.uuid] = [0]
          }
        })
      )

      return prices24hUSD
    } catch (error) {
      // console.error('Error fetching 24h prices from price service:', error)

      // Fallback to existing price system
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch 24h prices from new price service',
      })
    }
  }),

  // Get price at a specific timestamp
  allAtTimestamp: procedure.input(z.object({ timestamp: z.number() })).query(async ({ input, ctx }) => {
    try {
      // First, get all tokens from the database
      const tokens = await ctx.prisma.token.findMany({
        select: {
          uuid: true,
          symbol: true,
          chainId: true,
        },
      })

      if (!tokens) {
        throw new Error('Failed to fetch tokens from database')
      }

      // Extract token UUIDs and create a comma-separated string
      const tokenUuids = tokens.map((token) => token.uuid).join(',')

      const response = await axios.get(`${PRICE_SERVICE_URL}/api/v1/prices/current`, {
        params: {
          tokens: tokenUuids,
          currency: 'USD',
          timestamp: input.timestamp, // Use the provided timestamp
        },
        timeout: 5000,
      })

      const prices: Record<string, number> = {}

      // Convert to the format expected by the frontend
      if (response.data && response.data.prices) {
        response.data.prices.forEach((price: TokenPrice) => {
          prices[price.token] = price.priceInUSD
        })
      }

      return prices
    } catch (error) {
      // console.error('Error fetching prices at timestamp from price service:', error)

      // Fallback to existing price system
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch prices at timestamp from new price service',
      })
    }
  }),

  // Get historical HTR/USD price
  htr: procedure.output(z.number()).query(async () => {
    try {
      const response = await axios.get(`${PRICE_SERVICE_URL}/api/v1/prices/current/00`, {
        params: {
          currency: 'USD',
        },
        timeout: 5000,
      })

      if (response.data && typeof response.data.priceInUSD === 'number') {
        return response.data.priceInUSD
      }

      throw new Error('Invalid response format')
    } catch (error) {
      // console.error('Error fetching HTR price from price service:', error)

      // Fallback to existing price system
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch HTR price from new price service',
      })
    }
  }),

  // Get historical Kline data for HTR
  htrKline: procedure
    .output(z.array(z.object({ price: z.number(), date: z.number() })))
    .input(z.object({ size: z.number(), period: z.number() }))
    .query(async ({ input }) => {
      try {
        const now = Date.now()
        let startTime: number

        // Convert period to a timestamp range
        if (input.period === 0) {
          // 15 minutes intervals
          startTime = now - input.size * 15 * 60 * 1000
        } else if (input.period === 1) {
          // 1 hour intervals
          startTime = now - input.size * 60 * 60 * 1000
        } else {
          // 1 day intervals
          startTime = now - input.size * 24 * 60 * 60 * 1000
        }

        // Determine interval based on period
        const interval = input.period === 0 ? '15m' : input.period === 1 ? '1h' : '1d'

        const response = await axios.get(`${PRICE_SERVICE_URL}/api/v1/prices/historical/00`, {
          params: {
            from: Math.floor(startTime / 1000),
            to: Math.floor(now / 1000),
            interval,
            currency: 'USD',
          },
          timeout: 5000,
        })

        if (response.data && response.data.prices && Array.isArray(response.data.prices)) {
          return response.data.prices.map((point: PricePoint) => ({
            price: point.price,
            date: point.timestamp,
          }))
        }

        throw new Error('Invalid response format')
      } catch (error) {
        // console.error('Error fetching HTR kline data from price service:', error)

        // Fallback to existing price system
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch HTR kline data from new price service',
        })
      }
    }),

  // Service health check
  isAvailable: procedure.query(async () => {
    try {
      const response = await axios.get(`${PRICE_SERVICE_URL}/health`, {
        timeout: 2000,
      })

      return response.status === 200 && response.data?.status === 'ok'
    } catch (error) {
      return false
    }
  }),

  // Get line chart data for TradingView
  lineChart: procedure
    .input(z.object({
      token: z.string(),
      from: z.number().optional(),
      to: z.number().optional(),
      interval: z.string().optional(),
      currency: z.string().optional(),
    }))
    .output(z.object({
      token: z.string(),
      symbol: z.string(),
      name: z.string(),
      currency: z.string(),
      interval: z.string(),
      data: z.array(z.object({
        time: z.number(),
        value: z.number(),
      })),
    }))
    .query(async ({ input }) => {
      try {
        const response = await axios.get(`${PRICE_SERVICE_URL}/api/v1/chart/line/${input.token}`, {
          params: {
            from: input.from,
            to: input.to,
            interval: input.interval,
            currency: input.currency,
          },
          timeout: 5000,
        })

        if (!response.data) {
          throw new Error('Invalid response format')
        }

        return response.data
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch line chart data from price service',
        })
      }
    }),

  // Get candlestick chart data for TradingView
  candlestickChart: procedure
    .input(z.object({
      token: z.string(),
      from: z.number().optional(),
      to: z.number().optional(),
      interval: z.string().optional(),
      currency: z.string().optional(),
    }))
    .output(z.object({
      token: z.string(),
      symbol: z.string(),
      name: z.string(),
      currency: z.string(),
      interval: z.string(),
      data: z.array(z.object({
        time: z.number(),
        open: z.number(),
        high: z.number(),
        low: z.number(),
        close: z.number(),
      })),
    }))
    .query(async ({ input, ctx }) => {
      try {
        // Get token info for symbol and name
        const token = await ctx.prisma.token.findFirst({
          where: { uuid: input.token },
          select: { symbol: true, name: true },
        })

        if (!token) {
          throw new Error(`Token ${input.token} not found`)
        }

        console.log('Fetching candlestick data from', `${PRICE_SERVICE_URL}/api/v1/chart/candlestick/${input.token}`, {
          from: input.from,
          to: input.to,
          interval: input.interval || '1h',
          currency: input.currency || 'USD',
        })

        // Get candlestick data directly from the dedicated endpoint
        const response = await axios.get(`${PRICE_SERVICE_URL}/api/v1/chart/candlestick/${input.token}`, {
          params: {
            from: input.from,
            to: input.to,
            interval: input.interval || '1h',
            currency: input.currency || 'USD',
          },
          timeout: 10000, // Longer timeout for historical data
        })

        if (!response.data || !response.data.data || !Array.isArray(response.data.data)) {
          console.error('Invalid candlestick response format:', response.data)
          throw new Error('Invalid response format from price service')
        }

        return {
          token: input.token,
          symbol: token.symbol || input.token,
          name: token.name || `Token ${input.token}`,
          currency: input.currency || 'USD',
          interval: input.interval || '1h',
          data: response.data.data
        }
      } catch (error) {
        console.error('Error fetching candlestick data:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch candlestick data from price service',
        })
      }
    }),
})
