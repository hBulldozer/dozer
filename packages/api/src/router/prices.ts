import prisma, { PrismaClient } from '@dozer/database'
import { z } from 'zod'

import { fetchNodeData } from '../helpers/fetchFunction'
import { createTRPCRouter, procedure } from '../trpc'

// Legacy helper functions removed - now using DozerPoolManager contract methods
const htrKline = async (input: { period: number; size: number; prisma: PrismaClient }) => {
  // const period = input.period == 0 ? '15min' : input.period == 1 ? '1hour' : '1day'

  // const now = Math.round(Date.now() / 1000)
  // const period = input.period == 0 ? '15min' : input.period == 1 ? '1hour' : '1day'
  // const start = (input.size + 1) * (input.period == 0 ? 15 : input.period == 1 ? 60 : 24 * 60) * 60 // in seconds
  // const resp = await fetch(
  //   `https://api.kucoin.com/api/v1/market/candles?type=${period}&symbol=HTR-hUSDC&startAt=${now - start}&endAt=${now}`
  // )
  // const data = await resp.json()
  // return data.data
  //   .sort((a: number[], b: number[]) => (a[0] && b[0] ? a[0] - b[0] : null))
  //   .map((item: number[]) => {
  //     return { price: Number(item[2]), date: Number(item[0]) }})

  // Filter pools by token symbols
  const pool = await prisma.pool.findFirst({
    where: {
      token0: { symbol: 'HTR' },
      token1: { symbol: 'hUSDC' },
    },
  })
  if (!pool) {
    throw new Error('Pool with HTR-hUSDC pair not found')
  }

  const now = Math.round(Date.now() / 1000)
  const start = (input.size + 1) * (input.period == 0 ? 15 : input.period == 1 ? 60 : 24 * 60) * 60 // in seconds

  const snapshots = await prisma.hourSnapshot.findMany({
    where: {
      poolId: pool.id,
      date: {
        gte: new Date((now - start) * 1000), // convert to milliseconds
        lte: new Date(now * 1000),
      },
    },
    orderBy: { date: 'asc' }, // sort by date ascending
  })
  return snapshots.map((snapshot) => ({
    price: parseFloat((snapshot.reserve1 / snapshot.reserve0).toFixed(6)),
    date: snapshot.date.getTime(),
  }))
}
const getPricesSince = async (tokenUuid: string, prisma: PrismaClient, since: number) => {
  let result
  if (tokenUuid == '00') {
    result = await prisma.hourSnapshot.findMany({
      where: {
        AND: [
          { date: { gte: new Date(since) } },
          {
            pool: {
              token0: {
                uuid: '00',
              },
            },
          },
          {
            pool: {
              token1: {
                symbol: 'hUSDC',
              },
            },
          },
        ],
      },
      select: {
        date: true,
        poolId: true,
        reserve0: true,
        reserve1: true,
        priceHTR: true,
      },
    })
  } else {
    result = await prisma.hourSnapshot.findMany({
      where: {
        AND: [
          { date: { gte: new Date(since) } },
          {
            pool: {
              token0: {
                uuid: '00',
              },
            },
          },
          {
            pool: {
              token1: {
                uuid: tokenUuid,
              },
            },
          },
        ],
      },
      select: {
        date: true,
        poolId: true,
        reserve0: true,
        reserve1: true,
        priceHTR: true,
      },
    })
  }
  return result
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((snap) => {
      return { price: parseFloat((snap.reserve0 / snap.reserve1).toFixed(6)), priceHTR: snap.priceHTR }
    })
}

const getPriceHTRAtTimestamp = async (tokenUuid: string, prisma: PrismaClient, since: number) => {
  let result
  try {
    if (tokenUuid == '00') {
      result = await prisma.hourSnapshot.findMany({
        where: {
          AND: [
            { date: { gte: new Date(since) } },
            {
              pool: {
                token0: {
                  uuid: '00',
                },
              },
            },
            {
              pool: {
                token1: {
                  symbol: 'hUSDC',
                },
              },
            },
          ],
        },
        select: {
          date: true,
          poolId: true,
          reserve0: true,
          reserve1: true,
          priceHTR: true,
        },
        take: 1,
      })
    } else {
      result = await prisma.hourSnapshot.findMany({
        where: {
          AND: [
            { date: { gte: new Date(since) } },
            {
              pool: {
                token0: {
                  uuid: '00',
                },
              },
            },
            {
              pool: {
                token1: {
                  uuid: tokenUuid,
                },
              },
            },
          ],
        },
        select: {
          date: true,
          poolId: true,
          reserve0: true,
          reserve1: true,
          priceHTR: true,
        },
        take: 1,
      })
    }

    return result
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((snap) => {
        return { price: parseFloat((snap.reserve0 / snap.reserve1).toFixed(6)), priceHTR: snap.priceHTR }
      })[0]
  } catch (error) {
    return {
      price: 0,
      priceHTR: 0,
    }
  }
}

// Get the Pool Manager Contract ID from environment
const NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID = process.env.NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID

if (!NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID) {
  console.warn('NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID environment variable not set')
}

// Helper function to fetch data from the pool manager contract
async function fetchFromPoolManager(calls: string[], timestamp?: number): Promise<any> {
  if (!NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID) {
    throw new Error('NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID environment variable not set')
  }

  const endpoint = 'nano_contract/state'
  const queryParams = [`id=${NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID}`, ...calls.map((call) => `calls[]=${call}`)]

  if (timestamp) {
    queryParams.push(`timestamp=${timestamp}`)
  }

  return await fetchNodeData(endpoint, queryParams)
}

// Helper function to parse JSON string responses from _str methods
function parseJsonResponse(jsonString: string): any {
  try {
    return JSON.parse(jsonString)
  } catch (error) {
    console.error('Error parsing JSON response:', error)
    throw new Error('Failed to parse contract response')
  }
}

// Cache for token information to avoid repeated API calls
const tokenInfoCache = new Map<string, { symbol: string; name: string }>()

// Helper function to fetch token information from Hathor node
async function fetchTokenInfo(tokenUuid: string): Promise<{ symbol: string; name: string }> {
  if (tokenUuid === '00') {
    return { symbol: 'HTR', name: 'Hathor' }
  }

  // Check cache first
  if (tokenInfoCache.has(tokenUuid)) {
    return tokenInfoCache.get(tokenUuid)!
  }

  try {
    const endpoint = 'thin_wallet/token'
    const queryParams = [`id=${tokenUuid}`]
    const response = await fetchNodeData(endpoint, queryParams)

    const tokenInfo = {
      symbol: response.symbol || tokenUuid.substring(0, 8).toUpperCase(),
      name: response.name || `Token ${tokenUuid.substring(0, 8).toUpperCase()}`,
    }

    // Cache the result
    tokenInfoCache.set(tokenUuid, tokenInfo)
    return tokenInfo
  } catch (error) {
    console.error(`Error fetching token info for ${tokenUuid}:`, error)
    // Fallback to shortened UUID
    const fallback = {
      symbol: tokenUuid.substring(0, 8).toUpperCase(),
      name: `Token ${tokenUuid.substring(0, 8).toUpperCase()}`,
    }
    tokenInfoCache.set(tokenUuid, fallback)
    return fallback
  }
}

// Helper function to get token symbol from UUID (with caching)
async function getTokenSymbol(tokenUuid: string): Promise<string> {
  const tokenInfo = await fetchTokenInfo(tokenUuid)
  return tokenInfo.symbol
}

// Helper function to get token name from UUID (with caching)
async function getTokenName(tokenUuid: string): Promise<string> {
  const tokenInfo = await fetchTokenInfo(tokenUuid)
  return tokenInfo.name
}

export const pricesRouter = createTRPCRouter({
  firstLoadAll: procedure.query(async ({ ctx }) => {
    const tokens = await ctx.prisma.token.findMany({
      select: {
        uuid: true,
        symbol: true,
        chainId: true,
      },
    })
    if (!tokens) {
      throw new Error(`Failed to fetch tokens, received ${tokens}`)
    }
    const prices: { [key: string]: number } = {}
    tokens.map(async (token) => {
      prices[token.uuid] = 0
    })
    return prices
  }),
  all: procedure.query(async ({ ctx }) => {
    try {
      const response = await fetchFromPoolManager(['get_all_token_prices_in_usd()'])
      const prices = response.calls['get_all_token_prices_in_usd()'].value || {}
      // Format prices: divide by 1_000000
      const formatted = Object.fromEntries(Object.entries(prices).map(([k, v]) => [k, (v as number) / 1_000000]))
      return formatted
    } catch (error) {
      return {}
    }
  }),
  firstLoadAll24h: procedure.query(async ({ ctx }) => {
    const tokens = await ctx.prisma.token.findMany({
      select: {
        uuid: true,
        chainId: true,
      },
    })
    if (!tokens) {
      throw new Error(`Failed to fetch tokens, received ${tokens}`)
    }
    const prices24hUSD: { [key: string]: number[] } = {}
    tokens.map(async (token) => {
      prices24hUSD[token.uuid] = [0, 0]
    })
    return prices24hUSD
  }),
  all24h: procedure.query(async ({ ctx }) => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Combine queries to reduce connection time
    const [htrHusdcPool, tokens] = await Promise.all([
      ctx.prisma.pool.findFirst({
        where: {
          OR: [
            {
              token0: { symbol: 'HTR' },
              token1: { symbol: 'hUSDC' },
            },
            {
              token0: { symbol: 'hUSDC' },
              token1: { symbol: 'HTR' },
            },
          ],
        },
        select: {
          id: true,
          token0: { select: { symbol: true } },
          token1: { select: { symbol: true } },
          hourSnapshots: {
            where: { date: { gte: since } },
            select: {
              date: true,
              reserve0: true,
              reserve1: true,
              priceHTR: true,
            },
            orderBy: { date: 'asc' },
          },
        },
      }),

      // Optimize token query to fetch only necessary data
      ctx.prisma.token.findMany({
        select: {
          uuid: true,
          symbol: true,
          pools0: {
            where: { token1: { symbol: 'HTR' } },
            select: {
              id: true,
              hourSnapshots: {
                where: { date: { gte: since } },
                select: {
                  date: true,
                  reserve0: true,
                  reserve1: true,
                  priceHTR: true,
                },
                orderBy: { date: 'asc' },
              },
            },
            take: 1, // Optimize by taking only the first pool
          },
          pools1: {
            where: { token0: { symbol: 'HTR' } },
            select: {
              id: true,
              hourSnapshots: {
                where: { date: { gte: since } },
                select: {
                  date: true,
                  reserve0: true,
                  reserve1: true,
                  priceHTR: true,
                },
                orderBy: { date: 'asc' },
              },
            },
            take: 1, // Optimize by taking only the first pool
          },
        },
      }),
    ])

    const prices24hUSD: { [key: string]: number[] } = {}

    // Process tokens in parallel using Promise.all
    await Promise.all(
      tokens.map(async (token) => {
        let token_prices24hUSD: number[] = []

        if (token.symbol === 'hUSDC') {
          token_prices24hUSD = Array(24).fill(1)
        } else if (token.uuid === '00' && htrHusdcPool?.hourSnapshots.length) {
          const isHtrToken0 = htrHusdcPool.token0.symbol === 'HTR'
          token_prices24hUSD = htrHusdcPool.hourSnapshots.map((snap) =>
            isHtrToken0 ? snap.reserve1 / snap.reserve0 : snap.reserve0 / snap.reserve1
          )
        } else {
          const pool = token.pools0[0] || token.pools1[0]
          if (pool?.hourSnapshots.length) {
            const isTokenToken0 = token.pools0.length > 0
            token_prices24hUSD = pool.hourSnapshots.map((snap) => {
              const tokenPrice = isTokenToken0 ? snap.reserve1 / snap.reserve0 : snap.reserve0 / snap.reserve1
              return tokenPrice * snap.priceHTR
            })
          }
        }

        prices24hUSD[token.uuid] = token_prices24hUSD.length ? token_prices24hUSD : [0]
      })
    )

    return prices24hUSD
  }),
  allAtTimestamp: procedure.input(z.object({ timestamp: z.number() })).query(async ({ ctx, input }) => {
    const tokens = await ctx.prisma.token.findMany({
      select: {
        uuid: true,
        symbol: true,
        chainId: true,
      },
    })
    if (!tokens) {
      throw new Error(`Failed to fetch tokens, received ${tokens}`)
    }
    const prices: { [key: string]: number } = {}
    await Promise.all(
      tokens.map(async (token) => {
        const price_old = await getPriceHTRAtTimestamp(token.uuid, ctx.prisma, input.timestamp) //from db snaps
        if (!prices[token.uuid])
          prices[token.uuid] =
            price_old && price_old.price && price_old.priceHTR
              ? token.uuid == '00'
                ? price_old.priceHTR
                : token.symbol == 'hUSDC'
                ? 1
                : price_old.price * price_old.priceHTR
              : 0
      })
    )
    return prices
  }),

  htr: procedure.output(z.number()).query(async () => {
    try {
      const response = await fetchFromPoolManager(['get_token_price_in_usd("00")'])
      const htrPrice = response.calls['get_token_price_in_usd("00")'].value || 0
      return htrPrice / 1_000000
    } catch (error) {
      return 0
    }
  }),
  htrKline: procedure
    .output(z.array(z.object({ price: z.number(), date: z.number() })))
    .input(z.object({ size: z.number(), period: z.number() }))
    .query(async ({ ctx, input }) => {
      const result = await htrKline({ ...input, prisma: ctx.prisma })
      return result
    }),

  // Get all token prices in USD
  allUSD: procedure.query(async ({ ctx }) => {
    try {
      const response = await fetchFromPoolManager(['get_all_token_prices_in_usd()'])
      const prices = response.calls['get_all_token_prices_in_usd()'].value || {}
      const formatted = Object.fromEntries(Object.entries(prices).map(([k, v]) => [k, (v as number) / 1_000000]))
      return formatted
    } catch (error) {
      return {}
    }
  }),

  // Get all token prices in HTR
  allHTR: procedure.query(async ({ ctx }) => {
    try {
      const response = await fetchFromPoolManager(['get_all_token_prices_in_htr()'])
      const prices = response.calls['get_all_token_prices_in_htr()'].value || {}
      const formatted = Object.fromEntries(Object.entries(prices).map(([k, v]) => [k, (v as number) / 1_000000]))
      return formatted
    } catch (error) {
      return {}
    }
  }),

  // Get specific token price in USD
  tokenUSD: procedure.input(z.object({ tokenUid: z.string() })).query(async ({ input }) => {
    try {
      const response = await fetchFromPoolManager([`get_token_price_in_usd("${input.tokenUid}")`])
      const price = response.calls[`get_token_price_in_usd("${input.tokenUid}")`].value || 0
      return price / 1_000000
    } catch (error) {
      return 0
    }
  }),

  // Get specific token price in HTR
  tokenHTR: procedure.input(z.object({ tokenUid: z.string() })).query(async ({ input }) => {
    try {
      const response = await fetchFromPoolManager([`get_token_price_in_htr("${input.tokenUid}")`])
      const price = response.calls[`get_token_price_in_htr("${input.tokenUid}")`].value || 0
      return price / 1_000000
    } catch (error) {
      return 0
    }
  }),

  // Get HTR price in USD (from the HTR-USD reference pool)
  htrUSD: procedure.query(async ({ ctx }) => {
    try {
      const response = await fetchFromPoolManager(['get_token_price_in_usd("00")'])
      const htrPrice = response.calls['get_token_price_in_usd("00")'].value || 0
      return htrPrice / 1_000000
    } catch (error) {
      return 0
    }
  }),

  // Get historical prices at a specific timestamp
  historicalUSD: procedure
    .input(
      z.object({
        tokenUid: z.string(),
        timestamp: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        const response = await fetchFromPoolManager([`get_token_price_in_usd("${input.tokenUid}")`], input.timestamp)
        const price = response.calls[`get_token_price_in_usd("${input.tokenUid}")`].value || 0
        return price / 1_000000
      } catch (error) {
        return 0
      }
    }),

  // Get current vs historical prices with automatic change calculation (environment-aware)
  priceChange: procedure
    .input(
      z.object({
        tokenUid: z.string(),
        timeRange: z.enum(['5min', '24h']).optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        // Environment-aware time range selection
        const isDevelopment = process.env.NODE_ENV === 'development'
        const defaultTimeRange = isDevelopment ? '5min' : '24h'
        const timeRange = input.timeRange || defaultTimeRange

        // Calculate timestamps (integers for contract)
        const now = Math.floor(Date.now() / 1000)
        const timeRangeSeconds = timeRange === '5min' ? 5 * 60 : 24 * 60 * 60
        const historicalTimestamp = now - timeRangeSeconds

        // Fetch current price first
        const currentResponse = await fetchFromPoolManager([`get_token_price_in_usd("${input.tokenUid}")`])

        // Then fetch historical price with fallback to current price if historical data unavailable
        const historicalResponse = await fetchFromPoolManager(
          [`get_token_price_in_usd("${input.tokenUid}")`],
          historicalTimestamp
        ).catch(() => {
          // If historical data fails (common in development), use current data as fallback
          console.warn(
            `Historical data unavailable for ${input.tokenUid} at ${historicalTimestamp}, using current price as fallback`
          )
          return currentResponse
        })

        const currentPriceRaw = currentResponse.calls[`get_token_price_in_usd("${input.tokenUid}")`].value || 0
        const historicalPriceRaw = historicalResponse.calls[`get_token_price_in_usd("${input.tokenUid}")`].value || 0

        const currentPrice = currentPriceRaw / 1_000000
        const historicalPrice = historicalPriceRaw / 1_000000

        // Calculate percentage change as decimal (formatPercentChange expects decimal, not percentage)
        let change = 0
        if (historicalPrice > 0 && currentPrice > 0) {
          change = (currentPrice - historicalPrice) / historicalPrice // Decimal format, not * 100

          // Safeguard against extreme values that might indicate data issues
          if (Math.abs(change) > 10) {
            // 10 = 1000% in decimal format
            console.warn(
              `Extreme price change detected for ${input.tokenUid}: ${change * 100}%. This might indicate data issues.`
            )
            change = 0 // Reset to 0 for extreme values
          }
        }

        // Debug logging for troubleshooting
        console.log(`Price change debug for ${input.tokenUid}:`, {
          currentPriceRaw,
          historicalPriceRaw,
          currentPrice,
          historicalPrice,
          change,
          timeRange,
          timestamp: now,
          historicalTimestamp,
        })

        return {
          currentPrice,
          historicalPrice,
          change,
          timeRange,
          timestamp: now,
          historicalTimestamp,
        }
      } catch (error) {
        console.error(`Error fetching price change for ${input.tokenUid}:`, error)
        return {
          currentPrice: 0,
          historicalPrice: 0,
          change: 0,
          timeRange: input.timeRange || '24h',
          timestamp: Math.floor(Date.now() / 1000),
          historicalTimestamp: 0,
        }
      }
    }),

  // Get historical HTR prices at a specific timestamp
  historicalHTR: procedure
    .input(
      z.object({
        tokenUid: z.string(),
        timestamp: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        const response = await fetchFromPoolManager([`get_token_price_in_htr("${input.tokenUid}")`], input.timestamp)
        const price = response.calls[`get_token_price_in_htr("${input.tokenUid}")`].value || 0
        return price / 1_000000
      } catch (error) {
        return 0
      }
    }),

  // Get price chart data for a token over time
  chartData: procedure
    .input(
      z.object({
        tokenUid: z.string(),
        currency: z.enum(['USD', 'HTR']).default('USD'),
        timeframe: z.enum(['5min', '1h', '24h', '7d', '30d']).optional(), // Added 5min option
        points: z.number().min(5).max(20).default(10), // Reduced max for better performance
      })
    )
    .query(async ({ input }) => {
      try {
        const now = Math.floor(Date.now() / 1000) // Integer timestamp for contract

        // Environment-aware timeframe selection
        const isDevelopment = process.env.NODE_ENV === 'development'
        const defaultTimeframe = isDevelopment ? '5min' : '24h'
        const timeframe = input.timeframe || defaultTimeframe

        const intervals = {
          '5min': 5 * 60, // 5 minutes for development
          '1h': 60 * 60, // 1 hour
          '24h': 24 * 60 * 60, // 24 hours
          '7d': 7 * 24 * 60 * 60, // 7 days
          '30d': 30 * 24 * 60 * 60, // 30 days
        }

        const totalTime = intervals[timeframe]
        const interval = totalTime / input.points

        const pricePromises = []

        for (let i = 0; i < input.points; i++) {
          const timestamp = Math.floor(now - (totalTime - i * interval)) // Ensure integer timestamp
          const methodName =
            input.currency === 'USD'
              ? `get_token_price_in_usd("${input.tokenUid}")`
              : `get_token_price_in_htr("${input.tokenUid}")`

          pricePromises.push(
            fetchFromPoolManager([methodName], timestamp)
              .then((response) => ({
                timestamp,
                price: (response.calls[methodName].value || 0) / 1_000000,
              }))
              .catch(() => ({
                timestamp,
                price: 0,
              }))
          )
        }

        const priceData = await Promise.all(pricePromises)

        // Add current price as the last point
        try {
          const currentMethodName =
            input.currency === 'USD'
              ? `get_token_price_in_usd("${input.tokenUid}")`
              : `get_token_price_in_htr("${input.tokenUid}")`
          const currentResponse = await fetchFromPoolManager([currentMethodName])
          const currentPrice = (currentResponse.calls[currentMethodName].value || 0) / 1_000000
          priceData.push({ timestamp: now, price: currentPrice })
        } catch (error) {
          // Use last historical price if current price fails
          priceData.push({ timestamp: now, price: priceData[priceData.length - 1]?.price || 0 })
        }

        // Return with simple integer timestamps (not milliseconds)
        return priceData.map((point) => ({
          timestamp: point.timestamp, // Keep as integer seconds
          price: point.price,
          date: new Date(point.timestamp * 1000).toISOString(),
        }))
      } catch (error) {
        console.error(`Error fetching chart data for ${input.tokenUid}:`, error)
        return []
      }
    }),

  // Get market summary with key price information
  marketSummary: procedure.query(async ({ ctx }) => {
    try {
      // Get all prices in USD
      const usdResponse = await fetchFromPoolManager(['get_all_token_prices_in_usd()'])
      const usdPrices = usdResponse.calls['get_all_token_prices_in_usd()'].value || {}

      // Get all prices in HTR
      const htrResponse = await fetchFromPoolManager(['get_all_token_prices_in_htr()'])
      const htrPrices = htrResponse.calls['get_all_token_prices_in_htr()'].value || {}

      // Calculate some basic market stats
      const tokenCount = Object.keys(usdPrices).length
      const htrPriceUSD = usdPrices['00'] || 0

      return {
        tokenCount,
        htrPriceUSD,
        lastUpdated: new Date().toISOString(),
        prices: {
          usd: usdPrices,
          htr: htrPrices,
        },
      }
    } catch (error) {
      console.error('Error fetching market summary:', error)
      return {
        tokenCount: 0,
        htrPriceUSD: 0,
        lastUpdated: new Date().toISOString(),
        prices: {
          usd: {},
          htr: {},
        },
      }
    }
  }),
})
