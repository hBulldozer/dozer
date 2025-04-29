import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, procedure } from '../trpc'
import { getPriceServiceData } from '../helpers/fetch'

// Types for price service responses

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
  // Get price for a specific token with specified currency
  tokenPrice: procedure
    .input(z.object({ token: z.string(), currency: z.string().optional() }))
    .output(z.number().nullable())
    .query(async ({ input, ctx }) => {
      try {
        const { token, currency = 'USD' } = input;
        
        // Check if token exists in DB to validate it
        const tokenCheck = await ctx.prisma.token.findFirst({
          where: { uuid: token },
          select: { uuid: true }
        });

        if (!tokenCheck && token !== '00') { // Allow HTR token (00) always
          console.warn(`Token ${token} not found in database`);
          return null;
        }

        const data = await getPriceServiceData(`/api/v1/prices/current/${token}`, {
          params: {
            currency: currency
          },
          timeout: 5000
        })

        console.log('Token price response:', data);

        // Return the price in the requested currency
        if (data) {
          if (currency.toUpperCase() === 'USD') {
            return typeof data.priceInUSD === 'number' ? data.priceInUSD : 0;
          } else if (currency.toUpperCase() === 'HTR') {
            return typeof data.priceInHTR === 'number' ? data.priceInHTR : 0;
          } else {
            return 0;
          }
        }

        console.warn('Invalid response format for token price:', data);
        return 0;
      } catch (error) {
        console.error(`Error fetching ${input.token} price from price service:`, error);

        // Return null instead of throwing error
        return null;
      }
    }),
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
        const response = await getPriceServiceData(`/api/v1/info/tokens`, {
          timeout: 5000
        })

        // Combine the data, preferring our database information
        const tokenMap: Record<string, { symbol: string; name?: string }> = {}

        // Add price service tokens first
        if (response && response.tokens) {
          response.tokens.forEach((token: { uuid: string; symbol: string; name?: string }) => {
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
      const response = await getPriceServiceData(`/api/v1/prices/current`, {
        params: {
          tokens: tokenUuids,
          currency: 'USD'
        },
        timeout: 5000
      })

      const prices: Record<string, number> = {}

      // Convert to the format expected by the frontend
      if (response && response.prices) {
        response.prices.forEach((price: TokenPrice) => {
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

            const data = await getPriceServiceData(`/api/v1/prices/historical/${token.uuid}`, {
              params: {
                from: Math.floor(oneDayAgo / 1000),
                to: Math.floor(now / 1000),
                interval: '1h',
                currency: 'USD'
              },
              timeout: 5000
            })

            if (data && data.prices) {
              prices24hUSD[token.uuid] = data.prices.map((point: PricePoint) => point.price)
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

      const data = await getPriceServiceData(`/api/v1/prices/current`, {
        params: {
          tokens: tokenUuids,
          currency: 'USD',
          timestamp: input.timestamp // Use the provided timestamp
        },
        timeout: 5000
      })

      const prices: Record<string, number> = {}

      // Convert to the format expected by the frontend
      if (data && data.prices) {
        data.prices.forEach((price: TokenPrice) => {
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
      const data = await getPriceServiceData(`/api/v1/prices/current/00`, {
        params: {
          currency: 'USD'
        },
        timeout: 5000
      })

      if (data && typeof data.priceInUSD === 'number') {
        return data.priceInUSD
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

        const data = await getPriceServiceData(`/api/v1/prices/historical/00`, {
          params: {
            from: Math.floor(startTime / 1000),
            to: Math.floor(now / 1000),
            interval,
            currency: 'USD'
          },
          timeout: 5000
        })

        if (data && data.prices && Array.isArray(data.prices)) {
          return data.prices.map((point: PricePoint) => ({
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

  // Check if a specific token is available in the price service
  isTokenAvailable: procedure
    .input(z.object({ token: z.string() }))
    .output(z.boolean())
    .query(async ({ input, ctx }) => {
      try {
        // HTR token is always available
        if (input.token === '00') {
          return true;
        }

        // First check if the token exists in our database
        const tokenInDb = await ctx.prisma.token.findFirst({
          where: { uuid: input.token },
          select: { uuid: true }
        });

        if (!tokenInDb) {
          console.warn(`Token ${input.token} not found in database`)
          return false;
        }

        // Then check if it's available in the price service
        try {
          const data = await getPriceServiceData(`/api/v1/prices/current/${input.token}`, {
            timeout: 2000
          });

          return !!data;
        } catch (error) {
          console.warn(`Token ${input.token} not available in price service`);
          return false;
        }
      } catch (error) {
        console.error(`Error checking token availability: ${error}`);
        return false;
      }
    }),

  // Service health check
  isAvailable: procedure.query(async () => {
    try {
      const data = await getPriceServiceData(`/health`, {
        timeout: 2000
      })

      return data?.status === 'ok'
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
    .query(async ({ input, ctx }) => {
      try {
        // Special handling for HTR token
        if (input.token === '00') {
          console.log('Fetching line chart data for HTR token');
        } else {
          // For all other tokens, check if they exist in DB first
          const token = await ctx.prisma.token.findFirst({
            where: { uuid: input.token },
            select: { symbol: true, name: true },
          });

          if (!token) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: `Token ${input.token} not found`,
            });
          }

          console.log(`Fetching line chart data for token ${token.symbol || input.token}`);
        }

        // Log the request for debugging
        console.log('Fetching line chart data from API endpoint:', `/api/v1/chart/line/${input.token}`, {
          from: input.from,
          to: input.to,
          interval: input.interval || '1h',
          currency: input.currency || 'USD',
        });

        const response = await getPriceServiceData(`/api/v1/chart/line/${input.token}`, {
          params: {
            from: input.from,
            to: input.to,
            interval: input.interval || '1h',
            currency: input.currency || 'USD',
          },
          timeout: 10000 // Longer timeout for historical data
        });

        // Check if response is as expected
        if (!response) {
          console.error('Empty response from price service');
          throw new Error('Invalid response format');
        }

        // Validate that data property exists and is an array
        if (!response.data || !Array.isArray(response.data)) {
          console.error('Invalid line chart response format:', response);
          throw new Error('Invalid response format from price service');
        }

        // Ensure each data point has time and value
        const validData = response.data.every((point: any) => 
          typeof point.time === 'number' && typeof point.value === 'number'
        );

        if (!validData) {
          console.error('Data points have incorrect format:', response.data.data);
          throw new Error('Invalid data point format from price service');
        }

        // Return the validated data
        return {
          token: response.token || input.token,
          symbol: response.symbol || input.token,
          name: response.name || `Token ${input.token}`,
          currency: response.currency || input.currency || 'USD',
          interval: response.interval || input.interval || '1h',
          data: response.data
        };
      } catch (error) {
        console.error('Error fetching line chart data:', error);
        
        // Return more specific error if it's a TRPC error
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch line chart data from price service',
        });
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

        console.log('Fetching candlestick data from API endpoint:', `/api/v1/chart/candlestick/${input.token}`, {
          from: input.from,
          to: input.to,
          interval: input.interval || '1h',
          currency: input.currency || 'USD',
        })

        // Get candlestick data directly from the dedicated endpoint
        const response = await getPriceServiceData(`/api/v1/chart/candlestick/${input.token}`, {
          params: {
            from: input.from,
            to: input.to,
            interval: input.interval || '1h',
            currency: input.currency || 'USD',
          },
          timeout: 10000 // Longer timeout for historical data
        })

        if (!response || !response.data || !Array.isArray(response.data)) {
          console.error('Invalid candlestick response format:', response)
          throw new Error('Invalid response format from price service')
        }

        return {
          token: input.token,
          symbol: token.symbol || input.token,
          name: token.name || `Token ${input.token}`,
          currency: input.currency || 'USD',
          interval: input.interval || '1h',
          data: response.data
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
