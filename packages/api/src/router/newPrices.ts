import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, procedure } from '../trpc'
import axios from 'axios'

// Price service configuration
const PRICE_SERVICE_URL = process.env.PRICE_SERVICE_URL || 'http://localhost:3000'
console.log('Using price service at:', PRICE_SERVICE_URL)

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

/**
 * Router to interact with the new price service
 */
export const newPricesRouter = createTRPCRouter({
  // Get current prices for all tokens
  all: procedure.query(async () => {
    try {
      const response = await axios.get(`${PRICE_SERVICE_URL}/api/v1/prices/current`, {
        params: {
          tokens: '00,01', // Start with HTR and hUSDC, add more tokens as needed
          currency: 'USD'
        },
        timeout: 5000
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
      console.error('Error fetching prices from price service:', error)
      
      // Fallback to existing price system
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch prices from new price service'
      })
    }
  }),
  
  // Get 24h price data for all tokens
  all24h: procedure.query(async () => {
    try {
      const now = Date.now()
      const oneDayAgo = now - 24 * 60 * 60 * 1000
      
      // Get 24h data for HTR and hUSDC
      const [htrResponse, husdcResponse] = await Promise.all([
        axios.get(`${PRICE_SERVICE_URL}/api/v1/prices/historical/00`, {
          params: {
            from: Math.floor(oneDayAgo / 1000),
            to: Math.floor(now / 1000),
            interval: '1h',
            currency: 'USD'
          },
          timeout: 5000
        }),
        axios.get(`${PRICE_SERVICE_URL}/api/v1/prices/historical/01`, {
          params: {
            from: Math.floor(oneDayAgo / 1000),
            to: Math.floor(now / 1000),
            interval: '1h',
            currency: 'USD'
          },
          timeout: 5000
        })
      ])
      
      const prices24hUSD: Record<string, number[]> = {}
      
      // Process HTR data
      if (htrResponse.data && htrResponse.data.prices) {
        prices24hUSD['00'] = htrResponse.data.prices.map((point: PricePoint) => point.price)
      } else {
        prices24hUSD['00'] = [0]
      }
      
      // Process hUSDC data
      if (husdcResponse.data && husdcResponse.data.prices) {
        prices24hUSD['01'] = husdcResponse.data.prices.map((point: PricePoint) => point.price)
      } else {
        prices24hUSD['01'] = [1] // hUSDC is pegged to USD
      }
      
      return prices24hUSD
    } catch (error) {
      console.error('Error fetching 24h prices from price service:', error)
      
      // Fallback to existing price system
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch 24h prices from new price service'
      })
    }
  }),
  
  // Get price at a specific timestamp
  allAtTimestamp: procedure
    .input(z.object({ timestamp: z.number() }))
    .query(async ({ input }) => {
      try {
        const response = await axios.get(`${PRICE_SERVICE_URL}/api/v1/prices/current`, {
          params: {
            tokens: '00,01', // Start with HTR and hUSDC, add more tokens as needed
            currency: 'USD'
          },
          timeout: 5000
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
        console.error('Error fetching prices at timestamp from price service:', error)
        
        // Fallback to existing price system
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch prices at timestamp from new price service'
        })
      }
    }),
  
  // Get historical HTR/USD price
  htr: procedure.output(z.number()).query(async () => {
    try {
      const response = await axios.get(`${PRICE_SERVICE_URL}/api/v1/prices/current/00`, {
        params: {
          currency: 'USD'
        },
        timeout: 5000
      })
      
      if (response.data && typeof response.data.priceInUSD === 'number') {
        return response.data.priceInUSD
      }
      
      throw new Error('Invalid response format')
    } catch (error) {
      console.error('Error fetching HTR price from price service:', error)
      
      // Fallback to existing price system
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch HTR price from new price service'
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
            currency: 'USD'
          },
          timeout: 5000
        })
        
        if (response.data && response.data.prices && Array.isArray(response.data.prices)) {
          return response.data.prices.map((point: PricePoint) => ({
            price: point.price,
            date: point.timestamp
          }))
        }
        
        throw new Error('Invalid response format')
      } catch (error) {
        console.error('Error fetching HTR kline data from price service:', error)
        
        // Fallback to existing price system
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch HTR kline data from new price service'
        })
      }
    }),
  
  // Service health check
  isAvailable: procedure.query(async () => {
    try {
      const response = await axios.get(`${PRICE_SERVICE_URL}/health`, {
        timeout: 2000
      })
      
      return response.status === 200 && response.data?.status === 'ok'
    } catch (error) {
      return false
    }
  })
})
