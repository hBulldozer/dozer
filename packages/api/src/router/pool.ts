import { z } from 'zod'

import { fetchNodeData } from '../helpers/fetchFunction'
import { createTRPCRouter, procedure } from '../trpc'

// Get the Pool Manager Contract ID from environment
const POOL_MANAGER_CONTRACT_ID = process.env.POOL_MANAGER_CONTRACT_ID

if (!POOL_MANAGER_CONTRACT_ID) {
  console.warn('POOL_MANAGER_CONTRACT_ID environment variable not set')
}

// Cache for token information to avoid repeated API calls
const tokenInfoCache = new Map<string, { symbol: string; name: string }>()

// Helper function to fetch data from the pool manager contract
async function fetchFromPoolManager(calls: string[], timestamp?: number): Promise<any> {
  if (!POOL_MANAGER_CONTRACT_ID) {
    throw new Error('POOL_MANAGER_CONTRACT_ID environment variable not set')
  }

  const endpoint = 'nano_contract/state'
  const queryParams = [`id=${POOL_MANAGER_CONTRACT_ID}`, ...calls.map((call) => `calls[]=${call}`)]

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

// Helper function to extract tokens from pool keys
function extractTokensFromPools(poolKeys: string[]): string[] {
  const tokens = new Set<string>()

  for (const poolKey of poolKeys) {
    const [tokenA, tokenB] = poolKey.split('/')
    if (tokenA) tokens.add(tokenA)
    if (tokenB) tokens.add(tokenB)
  }

  return Array.from(tokens)
}

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

export type TransactionHistory = {
  hash: string
  timestamp: number
  method: string
  context: {
    actions: {
      type: string
      token_uid: string
      amount: number
    }[]
    address: string
    timestamp: number
  }
}

export const poolRouter = createTRPCRouter({
  // Test endpoint to verify contract connection
  test: procedure.query(async ({ ctx }) => {
    try {
      console.log('Testing contract connection...')
      console.log('POOL_MANAGER_CONTRACT_ID:', POOL_MANAGER_CONTRACT_ID)

      if (!POOL_MANAGER_CONTRACT_ID) {
        return { error: 'POOL_MANAGER_CONTRACT_ID not set' }
      }

      // Try a simple contract call
      const response = await fetchFromPoolManager(['get_signed_pools()'])
      console.log('Test response:', JSON.stringify(response, null, 2))

      // Also try get_all_pools to see if there are any pools at all
      const allPoolsResponse = await fetchFromPoolManager(['get_all_pools()'])
      console.log('All pools response:', JSON.stringify(allPoolsResponse, null, 2))

      return {
        contractId: POOL_MANAGER_CONTRACT_ID,
        response: response,
        success: true,
      }
    } catch (error) {
      console.error('Test error:', error)
      return {
        contractId: POOL_MANAGER_CONTRACT_ID,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      }
    }
  }),

  // Get all signed pools
  all: procedure.query(async ({ ctx }) => {
    try {
      console.log('Fetching pools from contract ID:', POOL_MANAGER_CONTRACT_ID)
      // Also fetch signed pools
      const response = await fetchFromPoolManager(['get_signed_pools()'])
      const poolKeys: string[] = response.calls['get_signed_pools()'].value || []
      console.log('Pool keys:', poolKeys)

      // Get token prices for USD calculations
      const pricesResponse = await fetchFromPoolManager(['get_all_token_prices_in_usd()'])
      const tokenPrices = pricesResponse.calls['get_all_token_prices_in_usd()'].value || {}

      // Fetch detailed data for each pool
      const poolDataPromises = poolKeys.map(async (poolKey) => {
        try {
          const poolResponse = await fetchFromPoolManager([`front_end_api_pool("${poolKey}")`])
          console.log('Pool response:', poolResponse)
          const poolData = poolResponse.calls[`front_end_api_pool("${poolKey}")`].value
          console.log('Pool data:', poolData)

          if (!poolData) return null

          // Parse pool key to get tokens and fee
          const [tokenA, tokenB, feeStr] = poolKey.split('/')
          const fee = parseInt(feeStr || '0') / 1000 // Convert from basis points to percentage

          // Calculate USD values using reserves and token prices
          const reserve0 = (poolData.reserve0 || 0) / 100
          const reserve1 = (poolData.reserve1 || 0) / 100
          const token0PriceUSD = (tokenA && tokenPrices[tokenA]) || 0
          const token1PriceUSD = (tokenB && tokenPrices[tokenB]) || 0
          const liquidityUSD = reserve0 * token0PriceUSD + reserve1 * token1PriceUSD

          // Calculate volume (use volume from contract, fallback to 0)
          const volume1d = (poolData.volume || 0) / 100

          // Calculate fees (use accumulated fees from contract)
          const fee0 = (poolData.fee0 || 0) / 100
          const fee1 = (poolData.fee1 || 0) / 100
          const fees1d = fee0 * token0PriceUSD + fee1 * token1PriceUSD

          // Calculate APR (simplified - based on fees vs liquidity)
          const apr = liquidityUSD > 0 ? (fees1d * 365) / liquidityUSD : 0

          return {
            id: poolKey,
            name: `${await getTokenSymbol(tokenA || '')}-${await getTokenSymbol(tokenB || '')}`,
            liquidityUSD,
            volume0: reserve0, // Use reserves as volume proxy
            volume1: reserve1,
            volumeUSD: volume1d * token0PriceUSD, // Approximate volume USD
            feeUSD: fees1d,
            swapFee: fee,
            apr,
            token0: {
              uuid: tokenA,
              symbol: await getTokenSymbol(tokenA || ''),
              name: await getTokenName(tokenA || ''),
              decimals: 2,
              chainId: 1,
            },
            token1: {
              uuid: tokenB,
              symbol: await getTokenSymbol(tokenB || ''),
              name: await getTokenName(tokenB || ''),
              decimals: 2,
              chainId: 1,
            },
            reserve0,
            reserve1,
            chainId: 1,
            liquidity: 0, // Pool liquidity tokens (not available in current contract)
            volume1d,
            fee0,
            fee1,
            fees1d,
            txCount: poolData.transactions || 0,
            txCount1d: poolData.transactions || 0,
            daySnapshots: [],
            hourSnapshots: [],
          }
        } catch (error) {
          console.error(`Error fetching data for pool ${poolKey}:`, error)
          return null
        }
      })

      const poolsData = await Promise.all(poolDataPromises)
      return poolsData.filter((pool) => pool !== null)
    } catch (error) {
      console.error('Error fetching pools:', error)
      throw new Error('Failed to fetch pools from contract')
    }
  }),

  // Get pool by ID (pool key)
  byId: procedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    try {
      const response = await fetchFromPoolManager([`pool_info_str("${input.id}")`])
      const poolInfoStr = response.calls[`pool_info_str("${input.id}")`].value

      if (!poolInfoStr) {
        throw new Error('Pool not found')
      }

      // Parse the JSON string response
      const poolInfo = parseJsonResponse(poolInfoStr)

      // Parse pool key
      const [tokenA, tokenB, feeStr] = input.id.split('/')
      const fee = parseInt(feeStr || '0') / 1000

      return {
        id: input.id,
        name: `${await getTokenSymbol(tokenA || '')}-${await getTokenSymbol(tokenB || '')}`,
        token0: {
          uuid: tokenA,
          symbol: await getTokenSymbol(tokenA || ''),
          name: await getTokenName(tokenA || ''),
          decimals: 2,
          chainId: 1,
        },
        token1: {
          uuid: tokenB,
          symbol: await getTokenSymbol(tokenB || ''),
          name: await getTokenName(tokenB || ''),
          decimals: 2,
          chainId: 1,
        },
        reserve0: (poolInfo.reserve_a || 0) / 100,
        reserve1: (poolInfo.reserve_b || 0) / 100,
        fee: fee,
        totalLiquidity: poolInfo.total_liquidity || 0,
        chainId: 1,
      }
    } catch (error) {
      console.error(`Error fetching pool ${input.id}:`, error)
      throw new Error('Failed to fetch pool data')
    }
  }),

  // Get user liquidity positions
  userPositions: procedure.input(z.object({ address: z.string() })).query(async ({ input }) => {
    try {
      const response = await fetchFromPoolManager([`get_user_positions_str("${input.address}")`])
      const positionsStr = response.calls[`get_user_positions_str("${input.address}")`].value

      if (!positionsStr) {
        return []
      }

      // Parse the JSON string response
      const positions = parseJsonResponse(positionsStr)

      const positionPromises = []
      for (const [poolKey, position] of Object.entries(positions)) {
        if (typeof position === 'object' && position !== null) {
          const [tokenA, tokenB, feeStr] = poolKey.split('/')
          positionPromises.push(
            (async () => ({
              poolKey,
              poolName: `${await getTokenSymbol(tokenA || '')}-${await getTokenSymbol(tokenB || '')}`,
              liquidity: (position as any).liquidity || 0,
              token0Amount: ((position as any).token_a_amount || 0) / 100,
              token1Amount: ((position as any).token_b_amount || 0) / 100,
              token0: {
                uuid: tokenA,
                symbol: await getTokenSymbol(tokenA || ''),
                name: await getTokenName(tokenA || ''),
              },
              token1: {
                uuid: tokenB,
                symbol: await getTokenSymbol(tokenB || ''),
                name: await getTokenName(tokenB || ''),
              },
            }))()
          )
        }
      }

      const positionData = await Promise.all(positionPromises)

      return positionData
    } catch (error) {
      console.error(`Error fetching user positions for ${input.address}:`, error)
      throw new Error('Failed to fetch user positions')
    }
  }),

  // Get swap quote
  quote: procedure
    .input(
      z.object({
        amountIn: z.number(),
        tokenIn: z.string(),
        tokenOut: z.string(),
        maxHops: z.number().optional().default(3),
      })
    )
    .query(async ({ input }) => {
      try {
        const amount = Math.round(input.amountIn * 100) // Convert to cents
        const response = await fetchFromPoolManager([
          `find_best_swap_path_str(${amount},"${input.tokenIn}","${input.tokenOut}",${input.maxHops})`,
        ])

        const pathInfoStr =
          response.calls[`find_best_swap_path_str(${amount},"${input.tokenIn}","${input.tokenOut}",${input.maxHops})`]
            .value

        if (!pathInfoStr) {
          throw new Error('No swap path found')
        }

        // Parse the JSON string response
        const pathInfo = parseJsonResponse(pathInfoStr)

        return {
          path: pathInfo.path || [],
          amounts: (pathInfo.amounts || []).map((amt: number) => amt / 100),
          amountOut: (pathInfo.amount_out || 0) / 100,
          priceImpact: pathInfo.price_impact || 0,
          route: pathInfo.path || [],
        }
      } catch (error) {
        console.error('Error getting swap quote:', error)
        throw new Error('Failed to get swap quote')
      }
    }),

  // Get pool history at specific timestamp
  historyAt: procedure
    .input(
      z.object({
        poolKey: z.string(),
        timestamp: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        const response = await fetchFromPoolManager([`pool_info_str("${input.poolKey}")`], input.timestamp)
        const poolInfoStr = response.calls[`pool_info_str("${input.poolKey}")`].value

        if (!poolInfoStr) {
          throw new Error('Pool data not found at timestamp')
        }

        // Parse the JSON string response
        const poolInfo = parseJsonResponse(poolInfoStr)

        return {
          poolKey: input.poolKey,
          timestamp: input.timestamp,
          reserve0: (poolInfo.reserve_a || 0) / 100,
          reserve1: (poolInfo.reserve_b || 0) / 100,
          totalLiquidity: poolInfo.total_liquidity || 0,
          volume24h: poolInfo.volume_24h || 0,
          fees24h: poolInfo.fees_24h || 0,
        }
      } catch (error) {
        console.error(`Error fetching pool history for ${input.poolKey} at ${input.timestamp}:`, error)
        throw new Error('Failed to fetch historical pool data')
      }
    }),

  // Get all pools for a specific token
  forToken: procedure.input(z.object({ tokenUid: z.string() })).query(async ({ input }) => {
    try {
      const response = await fetchFromPoolManager([`get_pools_for_token("${input.tokenUid}")`])
      const poolKeys: string[] = response.calls[`get_pools_for_token("${input.tokenUid}")`].value || []

      const poolPromises = poolKeys.map(async (poolKey) => {
        const [tokenA, tokenB, feeStr] = poolKey.split('/')
        return {
          poolKey,
          tokenA,
          tokenB,
          fee: parseInt(feeStr || '0') / 1000,
          name: `${await getTokenSymbol(tokenA || '')}-${await getTokenSymbol(tokenB || '')}`,
        }
      })

      return await Promise.all(poolPromises)
    } catch (error) {
      console.error(`Error fetching pools for token ${input.tokenUid}:`, error)
      throw new Error('Failed to fetch pools for token')
    }
  }),

  // Get transaction history for a pool
  transactionHistory: procedure.input(z.object({ poolKey: z.string() })).query(async ({ input }) => {
    try {
      // Get transaction history from the nano contract history endpoint
      const endpoint = 'nano_contract/history'
      const queryParams = [`id=${POOL_MANAGER_CONTRACT_ID}`, `count=50`]

      const response = await fetchNodeData(endpoint, queryParams)

      if (!response || !response.success || !response.history) {
        return []
      }

      // Filter transactions related to this specific pool
      const poolTransactions: TransactionHistory[] = response.history
        .filter((tx: any) => {
          // Check if the transaction context mentions this pool key
          return tx.nc_context && JSON.stringify(tx.nc_context).includes(input.poolKey)
        })
        .map((tx: any) => ({
          hash: tx.hash,
          timestamp: tx.timestamp,
          method: tx.nc_method,
          context: tx.nc_context,
        }))

      return poolTransactions
    } catch (error) {
      console.error(`Error fetching transaction history for ${input.poolKey}:`, error)
      return []
    }
  }),

  // Get transaction status
  getTxStatus: procedure
    .input(
      z.object({
        hash: z.string(),
        chainId: z.number(),
      })
    )
    .query(async ({ input }) => {
      if (input.hash === 'Error') {
        return { status: 'failed', message: 'txHash not defined' }
      }

      try {
        const endpoint = 'transaction'
        const response = await fetchNodeData(endpoint, [`id=${input.hash}`])

        const validation = response.success
          ? response.meta.voided_by.length
            ? 'failed'
            : response.meta.first_block
            ? 'success'
            : 'pending'
          : 'failed'

        const message = validation === 'failed' ? 'Transaction failed: Low Slippage.' : ''

        return { status: validation, message: message }
      } catch (error) {
        console.error('Error checking transaction status:', error)
        return { status: 'failed', message: 'Error checking transaction status' }
      }
    }),
})
