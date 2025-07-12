import { z } from 'zod'

import { createTRPCRouter, procedure } from '../trpc'
import { fetchNodeData } from '../helpers/fetchFunction'
import {
  parsePoolApiInfo,
  parsePoolInfo,
  parseSwapPathInfo,
  parseSwapPathExactOutputInfo,
  parseUserPositions,
  type PoolApiInfo,
  type PoolInfo,
  type SwapPathInfo,
  type SwapPathExactOutputInfo,
} from '../utils/namedTupleParsers'

// Get the Pool Manager Contract ID from environment
const NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID = process.env.NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID

if (!NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID) {
  console.warn('NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID environment variable not set')
}

// Cache for token information to avoid repeated API calls
const tokenInfoCache = new Map<string, { symbol: string; name: string }>()

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

// Helper function to generate symbol-based identifier from pool key
async function generateSymbolId(poolKey: string): Promise<string> {
  const [tokenA, tokenB, feeStr] = poolKey.split('/')
  const feeBasisPoints = parseInt(feeStr || '0')
  const feeForId = feeBasisPoints / 10 // Convert from basis points to identifier format (e.g., 30 -> 3)

  const symbolA = await getTokenSymbol(tokenA || '')
  const symbolB = await getTokenSymbol(tokenB || '')

  return `${symbolA}-${symbolB}-${feeForId}`
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
      console.log('NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID:', NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID)

      if (!NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID) {
        return { error: 'NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID not set' }
      }

      // Try a simple contract call
      const response = await fetchFromPoolManager(['get_signed_pools()'])
      console.log('Test response:', JSON.stringify(response, null, 2))

      // Also try get_all_pools to see if there are any pools at all
      const allPoolsResponse = await fetchFromPoolManager(['get_all_pools()'])
      console.log('All pools response:', JSON.stringify(allPoolsResponse, null, 2))

      return {
        contractId: NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID,
        response: response,
        success: true,
      }
    } catch (error) {
      console.error('Test error:', error)
      return {
        contractId: NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      }
    }
  }),

  // Get all signed pools
  all: procedure.query(async ({ ctx }) => {
    try {
      const batchResponse = await fetchFromPoolManager(['get_signed_pools()', 'get_all_token_prices_in_usd()'])

      const poolKeys: string[] = batchResponse.calls['get_signed_pools()'].value || []
      const rawTokenPrices: Record<string, number> = batchResponse.calls['get_all_token_prices_in_usd()'].value || {}
      // Convert token prices from contract units to USD (divide by 1,000,000)
      const tokenPrices: Record<string, number> = Object.fromEntries(
        Object.entries(rawTokenPrices).map(([k, v]) => [k, (v as number) / 1_000000])
      )

      if (poolKeys.length === 0) {
        console.log('⚠️  [GET_POOLS_ALL] No signed pools found')
        return []
      }

      // Batch fetch all pool data using front_end_api_pool
      const poolDataCalls = poolKeys.map((poolKey) => `front_end_api_pool("${poolKey}")`)
      const poolDataResponse = await fetchFromPoolManager(poolDataCalls)
      // Extract unique tokens from all pool keys for batch symbol fetching
      const uniqueTokens = extractTokensFromPools(poolKeys)

      // Batch fetch token metadata
      const tokenMetadataPromises = uniqueTokens.map(async (token) => {
        try {
          const info = await fetchTokenInfo(token)
          return [token, info]
        } catch (error) {
          console.error(`Error fetching token info for ${token}:`, error)
          return [token, { symbol: token.substring(0, 8), name: `Token ${token.substring(0, 8)}` }]
        }
      })

      const tokenMetadataResults = await Promise.all(tokenMetadataPromises)
      const tokenMetadata = new Map(tokenMetadataResults as [string, { symbol: string; name: string }][])

      // Process each pool
      const poolsData = poolKeys.map((poolKey) => {
        try {
          const poolDataArray = poolDataResponse.calls[`front_end_api_pool("${poolKey}")`]?.value

          if (!poolDataArray) {
            console.warn(`⚠️  [GET_POOLS_ALL] No data found for pool ${poolKey}`)
            return null
          }

          // Parse the NamedTuple array to an object with proper property names
          const poolData = parsePoolApiInfo(poolDataArray)

          // Parse pool key to get tokens and fee
          const [tokenA, tokenB, feeStr] = poolKey.split('/')
          const swapFee = parseInt(feeStr || '0') / 1000 // Convert from basis points to percentage

          // Get token metadata
          const token0Info = tokenMetadata.get(tokenA || '') || { symbol: 'UNK', name: 'Unknown' }
          const token1Info = tokenMetadata.get(tokenB || '') || { symbol: 'UNK', name: 'Unknown' }

          // Calculate reserves (convert from cents to full units)
          const reserve0 = (poolData.reserve0 || 0) / 100
          const reserve1 = (poolData.reserve1 || 0) / 100

          // Get token prices
          const token0PriceUSD = tokenPrices[tokenA || ''] || 0
          const token1PriceUSD = tokenPrices[tokenB || ''] || 0

          // Calculate USD values
          const liquidityUSD = reserve0 * token0PriceUSD + reserve1 * token1PriceUSD

          // Calculate volume and fees
          const volume1d = (poolData.volume || 0) / 100
          const volumeUSD = volume1d * token0PriceUSD // Approximate volume USD

          const fee0 = (poolData.fee0 || 0) / 100
          const fee1 = (poolData.fee1 || 0) / 100
          const feeUSD = fee0 * token0PriceUSD + fee1 * token1PriceUSD

          // Calculate APR (annualized based on daily fees)
          const apr = liquidityUSD > 0 ? ((feeUSD * 365) / liquidityUSD) * 100 : 0

          // Generate symbol-based identifier for URL-friendly access
          const feeBasisPoints = parseInt(feeStr || '0')
          const feeForId = feeBasisPoints / 10 // Convert from basis points to identifier format
          const symbolId = `${token0Info.symbol}-${token1Info.symbol}-${feeForId}`

          return {
            id: poolKey,
            symbolId,
            name: `${token0Info.symbol}-${token1Info.symbol}`,
            liquidityUSD,
            volume0: reserve0,
            volume1: reserve1,
            volumeUSD,
            feeUSD,
            swapFee,
            apr: apr / 100, // Convert back to decimal for consistency
            token0: {
              uuid: tokenA,
              symbol: token0Info.symbol,
              name: token0Info.name,
              decimals: 2,
              chainId: 1,
            },
            token1: {
              uuid: tokenB,
              symbol: token1Info.symbol,
              name: token1Info.name,
              decimals: 2,
              chainId: 1,
            },
            reserve0,
            reserve1,
            chainId: 1,
            liquidity: poolData.transactions || 0, // Use transactions as fallback since total_liquidity doesn't exist on PoolApiInfo
            volume1d,
            fee0,
            fee1,
            fees1d: feeUSD,
            txCount: poolData.transactions || 0,
            txCount1d: poolData.transactions || 0,
            daySnapshots: [],
            hourSnapshots: [],
          }
        } catch (error) {
          console.error(`❌ [GET_POOLS_ALL] Error processing pool ${poolKey}:`, error)
          return null
        }
      })

      const validPools = poolsData.filter((pool) => pool !== null)

      // Sort by liquidity USD (highest first)
      return validPools.sort((a, b) => (b?.liquidityUSD || 0) - (a?.liquidityUSD || 0))
    } catch (error) {
      console.error('❌ [GET_POOLS_ALL] Error fetching pools:', error)
      throw new Error('Failed to fetch pools from contract')
    }
  }),

  // Get pool by ID (pool key)
  byId: procedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    try {
      const response = await fetchFromPoolManager([`pool_info("${input.id}")`])
      const poolInfoArray = response.calls[`pool_info("${input.id}")`].value

      if (!poolInfoArray) {
        throw new Error('Pool not found')
      }

      // Parse the NamedTuple array to an object with proper property names
      const poolInfo = parsePoolInfo(poolInfoArray)

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

  // Get pool by symbol-based identifier (e.g., "HTR-DZR-3" for HTR/DZR pool with 0.03% fee)
  bySymbolId: procedure.input(z.object({ symbolId: z.string() })).query(async ({ input }) => {
    try {
      // Parse symbol-based identifier (e.g., "HTR-DZR-3" -> symbols: ["HTR", "DZR"], fee: 3 -> 0.03%)
      const parts = input.symbolId.split('-')
      if (parts.length !== 3) {
        throw new Error('Invalid symbol ID format. Expected format: SYMBOL1-SYMBOL2-FEE (e.g., HTR-DZR-3)')
      }

      const [symbol0, symbol1, feeString] = parts
      const feeValue = parseFloat(feeString || '0') // Parse as float to handle decimals
      const feePercent = feeValue / 100 // Convert to percentage (e.g., 5 -> 0.05)
      const feeBasisPoints = Math.round(feeValue * 10) // Convert to basis points (e.g., 5 -> 50)

      // Get all signed pools to find the matching one
      const batchResponse = await fetchFromPoolManager(['get_signed_pools()'])
      const poolKeys: string[] = batchResponse.calls['get_signed_pools()'].value || []

      if (poolKeys.length === 0) {
        throw new Error('No signed pools found')
      }

      // Find the pool that matches the symbol and fee criteria
      let matchingPoolKey: string | null = null

      for (const poolKey of poolKeys) {
        const [tokenA, tokenB, feeStr] = poolKey.split('/')
        const poolFeeBasisPoints = parseInt(feeStr || '0')

        // Check if fee matches
        if (poolFeeBasisPoints === feeBasisPoints) {
          // Get token symbols for comparison
          const tokenASymbol = await getTokenSymbol(tokenA || '')
          const tokenBSymbol = await getTokenSymbol(tokenB || '')

          // Check if symbols match (in either order)
          if (
            (tokenASymbol === symbol0 && tokenBSymbol === symbol1) ||
            (tokenASymbol === symbol1 && tokenBSymbol === symbol0)
          ) {
            matchingPoolKey = poolKey
            break
          }
        }
      }

      if (!matchingPoolKey) {
        throw new Error(`No pool found with symbols ${symbol0}-${symbol1} and fee ${feePercent}%`)
      }

      // Get the pool data using the found pool key and also fetch additional data like prices
      const batchResponseData = await fetchFromPoolManager([
        `front_end_api_pool("${matchingPoolKey}")`,
        'get_all_token_prices_in_usd()',
      ])

      const poolDataArray = batchResponseData.calls[`front_end_api_pool("${matchingPoolKey}")`]?.value
      const rawTokenPrices = batchResponseData.calls['get_all_token_prices_in_usd()'].value || {}
      // Convert token prices from contract units to USD (divide by 1,000,000)
      const tokenPrices: Record<string, number> = Object.fromEntries(
        Object.entries(rawTokenPrices).map(([k, v]) => [k, (v as number) / 1_000000])
      )

      if (!poolDataArray) {
        throw new Error('Pool data not found')
      }

      // Parse the NamedTuple array to an object with proper property names
      const poolData = parsePoolApiInfo(poolDataArray)

      // Parse pool key
      const [tokenA, tokenB, feeStrSecond] = matchingPoolKey.split('/')
      const fee = parseInt(feeStrSecond || '0') / 1000
      const swapFee = parseInt(feeStrSecond || '0') / 1000 // Convert from basis points to percentage

      // Get token metadata
      const token0Info = await fetchTokenInfo(tokenA || '')
      const token1Info = await fetchTokenInfo(tokenB || '')

      // Calculate reserves (convert from cents to full units)
      const reserve0 = (poolData.reserve0 || 0) / 100
      const reserve1 = (poolData.reserve1 || 0) / 100

      // Get token prices
      const token0PriceUSD = tokenPrices[tokenA || ''] || 0
      const token1PriceUSD = tokenPrices[tokenB || ''] || 0

      // Calculate USD values
      const liquidityUSD = reserve0 * token0PriceUSD + reserve1 * token1PriceUSD

      // Calculate volume and fees
      const volume1d = (poolData.volume || 0) / 100
      const volumeUSD = volume1d * token0PriceUSD // Approximate volume USD

      const fee0 = (poolData.fee0 || 0) / 100
      const fee1 = (poolData.fee1 || 0) / 100
      const feeUSD = fee0 * token0PriceUSD + fee1 * token1PriceUSD

      // Calculate APR (annualized based on daily fees)
      const apr = liquidityUSD > 0 ? ((feeUSD * 365) / liquidityUSD) * 100 : 0

      return {
        id: matchingPoolKey,
        symbolId: input.symbolId,
        name: `${token0Info.symbol}-${token1Info.symbol}`,
        liquidityUSD,
        volume0: reserve0,
        volume1: reserve1,
        volumeUSD,
        feeUSD,
        swapFee,
        apr: apr / 100, // Convert back to decimal for consistency
        token0: {
          uuid: tokenA,
          symbol: token0Info.symbol,
          name: token0Info.name,
          decimals: 2,
          chainId: 1,
        },
        token1: {
          uuid: tokenB,
          symbol: token1Info.symbol,
          name: token1Info.name,
          decimals: 2,
          chainId: 1,
        },
        reserve0,
        reserve1,
        chainId: 1,
        liquidity: poolData.transactions || 0, // Use transactions as fallback since total_liquidity doesn't exist on PoolApiInfo
        volume1d,
        fee0,
        fee1,
        fees1d: feeUSD,
        txCount: poolData.transactions || 0,
        txCount1d: poolData.transactions || 0,
        daySnapshots: [],
        hourSnapshots: [],
      }
    } catch (error) {
      console.error(`Error fetching pool with symbol ID ${input.symbolId}:`, error)
      throw new Error(`Failed to fetch pool data: ${error}`)
    }
  }),

  // Get user liquidity positions
  userPositions: procedure.input(z.object({ address: z.string() })).query(async ({ input }) => {
    try {
      const response = await fetchFromPoolManager([`get_user_positions("${input.address}")`])
      const positionsArrays = response.calls[`get_user_positions("${input.address}")`].value

      if (!positionsArrays) {
        return []
      }

      // Parse the user positions object (contains NamedTuple arrays for each pool)
      const positions = parseUserPositions(positionsArrays)

      const positionPromises = []
      for (const [poolKey, position] of Object.entries(positions)) {
        if (typeof position === 'object' && position !== null) {
          const [tokenA, tokenB, feeStr] = poolKey.split('/')
          positionPromises.push(
            (async () => ({
              poolKey,
              poolName: `${await getTokenSymbol(tokenA || '')}-${await getTokenSymbol(tokenB || '')}`,
              liquidity: position.liquidity || 0,
              token0Amount: (position.token0Amount || 0) / 100,
              token1Amount: (position.token1Amount || 0) / 100,
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
          `find_best_swap_path(${amount},"${input.tokenIn}","${input.tokenOut}",${input.maxHops})`,
        ])
        const pathInfoArray =
          response.calls[`find_best_swap_path(${amount},"${input.tokenIn}","${input.tokenOut}",${input.maxHops})`].value

        console.log(pathInfoArray)
        if (!pathInfoArray) {
          console.log(`❌ [QUOTE] No swap path found for ${input.tokenIn} → ${input.tokenOut}`)
          throw new Error('No swap path found')
        }

        // Parse the NamedTuple array to an object with proper property names
        const pathInfo = parseSwapPathInfo(pathInfoArray)

        // Extract pool path (comma-separated pool keys) and derive token path
        const poolPath = pathInfo.path || ''
        const poolKeys = poolPath ? poolPath.split(',') : []

        // Extract unique tokens from pool keys to build token path
        const tokenPath = []
        if (poolKeys.length > 0) {
          // Start with input token
          tokenPath.push(input.tokenIn)

          // Follow the path through each pool to build token sequence
          let currentToken = input.tokenIn
          for (const poolKey of poolKeys) {
            const [tokenA, tokenB] = poolKey.split('/')
            if (tokenA === currentToken) {
              currentToken = tokenB || currentToken
            } else if (tokenB === currentToken) {
              currentToken = tokenA || currentToken
            }
            tokenPath.push(currentToken)
          }
        }

        return {
          path: tokenPath,
          amounts: (pathInfo.amounts || []).map((amt: number) => amt / 100),
          amountOut: (pathInfo.amount_out || 0) / 100,
          priceImpact: pathInfo.price_impact || 0,
          route: tokenPath, // Keep for backward compatibility
          poolPath: poolPath, // Add the pool path for contract execution
        }
      } catch (error) {
        console.error('❌ [QUOTE] Error getting swap quote:', error)
        throw new Error('Failed to get swap quote')
      }
    }),

  // Exact output quote endpoint
  quoteExactOutput: procedure
    .input(
      z.object({
        amountOut: z.number(),
        tokenIn: z.string(),
        tokenOut: z.string(),
        maxHops: z.number().optional().default(3),
      })
    )
    .query(async ({ input }) => {
      try {
        const amount = Math.round(input.amountOut * 100) // Convert to cents
        const response = await fetchFromPoolManager([
          `find_best_swap_path_exact_output(${amount},"${input.tokenIn}","${input.tokenOut}",${input.maxHops})`,
        ])

        const pathInfoArray =
          response.calls[
            `find_best_swap_path_exact_output(${amount},"${input.tokenIn}","${input.tokenOut}",${input.maxHops})`
          ].value

        if (!pathInfoArray) {
          console.log(`❌ [QUOTE EXACT OUTPUT] No swap path found for ${input.tokenIn} → ${input.tokenOut}`)
          throw new Error('No swap path found')
        }

        // Parse the NamedTuple array to an object with proper property names
        const pathInfo = parseSwapPathExactOutputInfo(pathInfoArray)

        // Extract pool path (comma-separated pool keys) and derive token path
        const poolPath = pathInfo.path || ''
        const poolKeys = poolPath ? poolPath.split(',') : []

        // Extract unique tokens from pool keys to build token path
        const tokenPath = []
        if (poolKeys.length > 0) {
          // Start with input token
          tokenPath.push(input.tokenIn)

          // Follow the path through each pool to build token sequence
          let currentToken = input.tokenIn
          for (const poolKey of poolKeys) {
            const [tokenA, tokenB] = poolKey.split('/')
            if (tokenA === currentToken) {
              currentToken = tokenB || currentToken
            } else if (tokenB === currentToken) {
              currentToken = tokenA || currentToken
            }
            tokenPath.push(currentToken)
          }
        }

        return {
          path: tokenPath,
          amounts: (pathInfo.amounts || []).map((amt: number) => amt / 100),
          amountIn: (pathInfo.amount_in || 0) / 100,
          priceImpact: pathInfo.price_impact || 0,
          route: tokenPath, // Keep for backward compatibility
          poolPath: poolPath, // Add the pool path for contract execution
        }
      } catch (error) {
        console.error('❌ [QUOTE EXACT OUTPUT] Error getting exact output quote:', error)
        throw new Error('Failed to get exact output quote')
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
        const response = await fetchFromPoolManager([`pool_info("${input.poolKey}")`], input.timestamp)
        const poolInfoArray = response.calls[`pool_info("${input.poolKey}")`].value

        if (!poolInfoArray) {
          throw new Error('Pool data not found at timestamp')
        }

        // Parse the NamedTuple array to an object with proper property names
        const poolInfo = parsePoolInfo(poolInfoArray)

        return {
          poolKey: input.poolKey,
          timestamp: input.timestamp,
          reserve0: (poolInfo.reserve_a || 0) / 100,
          reserve1: (poolInfo.reserve_b || 0) / 100,
          totalLiquidity: poolInfo.total_liquidity || 0,
          volume24h: poolInfo.volume_a || 0,
          fees24h: poolInfo.fee || 0,
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
      const queryParams = [`id=${NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID}`, `count=50`]

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

  // Get detailed route analysis
  analyzeRoute: procedure
    .input(
      z.object({
        tokenIn: z.string(),
        amountIn: z.number(),
        tokenOut: z.string(),
        maxHops: z.number().optional().default(3),
      })
    )
    .query(async ({ input }) => {
      try {
        console.log(`🔬 [ROUTE ANALYSIS] Analyzing route: ${input.amountIn} ${input.tokenIn} → ${input.tokenOut}`)
        console.log(`   🔍 Max hops: ${input.maxHops}`)

        const amountInCents = Math.round(input.amountIn * 100)

        // Get the best route
        const routeResponse = await fetchFromPoolManager([
          `find_best_swap_path(${amountInCents},"${input.tokenIn}","${input.tokenOut}",${input.maxHops})`,
        ])

        const pathInfoArray =
          routeResponse.calls[
            `find_best_swap_path(${amountInCents},"${input.tokenIn}","${input.tokenOut}",${input.maxHops})`
          ].value

        if (!pathInfoArray) {
          console.log(`❌ [ROUTE ANALYSIS] No route found`)
          return {
            success: false,
            message: 'No route found',
            route: null,
          }
        }

        // Parse the NamedTuple array to an object with proper property names
        const pathInfo = parseSwapPathInfo(pathInfoArray)

        console.log(`✅ [ROUTE ANALYSIS] Route found:`)
        console.log(`   📍 Full Path: ${JSON.stringify(pathInfo.path || [])}`)
        console.log(
          `   💰 Amount progression: ${JSON.stringify((pathInfo.amounts || []).map((amt: number) => amt / 100))}`
        )
        console.log(`   📈 Final amount out: ${(pathInfo.amount_out || 0) / 100}`)
        console.log(`   📊 Price impact: ${pathInfo.price_impact || 0}%`)
        console.log(`   🔀 Number of hops: ${(pathInfo.path || []).length - 1}`)

        // Calculate efficiency metrics
        const inputAmount = input.amountIn
        const outputAmount = (pathInfo.amount_out || 0) / 100
        const directRate = outputAmount / inputAmount
        const priceImpact = pathInfo.price_impact || 0

        // Analyze each hop
        const hops = []
        const path = pathInfo.path || []
        const amounts = (pathInfo.amounts || []).map((amt: number) => amt / 100)

        for (let i = 0; i < path.length - 1; i++) {
          const fromToken = path[i]
          const toToken = path[i + 1]
          const amountIn = amounts[i] || 0
          const amountOut = amounts[i + 1] || 0
          const hopRate = amountIn > 0 ? amountOut / amountIn : 0

          hops.push({
            step: i + 1,
            from: fromToken,
            to: toToken,
            amountIn,
            amountOut,
            rate: hopRate,
            pool: `${fromToken}/${toToken}`, // Simplified pool identifier
          })

          console.log(
            `   🔀 Hop ${i + 1}: ${amountIn} ${fromToken} → ${amountOut} ${toToken} (rate: ${hopRate.toFixed(6)})`
          )
        }

        // Get token symbols for better readability
        const tokenSymbols = new Map()
        for (const token of [input.tokenIn, input.tokenOut, ...path]) {
          try {
            const symbol = await getTokenSymbol(token)
            tokenSymbols.set(token, symbol)
          } catch (error) {
            tokenSymbols.set(token, token.substring(0, 8))
          }
        }

        console.log(
          `   📋 Route summary: ${tokenSymbols.get(input.tokenIn)} → ${hops
            .map((h) => tokenSymbols.get(h.to))
            .join(' → ')}`
        )

        return {
          success: true,
          route: {
            path: pathInfo.path,
            amounts: amounts,
            amountOut: outputAmount,
            priceImpact,
            directRate,
            hops: hops.length,
            efficiency: priceImpact < 1 ? 'Excellent' : priceImpact < 3 ? 'Good' : priceImpact < 5 ? 'Fair' : 'Poor',
          },
          analysis: {
            tokenSymbols: Object.fromEntries(tokenSymbols),
            hopDetails: hops,
            summary: `${hops.length}-hop route with ${priceImpact.toFixed(2)}% price impact`,
          },
        }
      } catch (error) {
        console.error('❌ [ROUTE ANALYSIS] Error analyzing route:', error)
        throw new Error(`Failed to analyze route: ${error}`)
      }
    }),

  // Test route logging endpoint
  testRouteLogging: procedure
    .input(
      z.object({
        tokenIn: z.string().optional().default('00'), // HTR
        amountIn: z.number().optional().default(100),
        tokenOut: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        // If no tokenOut provided, try to find a common token from pools
        let tokenOut = input.tokenOut
        if (!tokenOut) {
          const poolsResponse = await fetchFromPoolManager(['get_signed_pools()'])
          const poolKeys: string[] = poolsResponse.calls['get_signed_pools()'].value || []

          // Find a pool with HTR to use as test target
          for (const poolKey of poolKeys) {
            const [tokenA, tokenB] = poolKey.split('/')
            if (tokenA === '00' && tokenB) {
              tokenOut = tokenB
              break
            } else if (tokenB === '00' && tokenA) {
              tokenOut = tokenA
              break
            }
          }

          if (!tokenOut) {
            return {
              success: false,
              message: 'No suitable token pair found for testing',
            }
          }
        }

        console.log(`🧪 [ROUTE TEST] Testing route logging with: ${input.amountIn} ${input.tokenIn} → ${tokenOut}`)

        // Call our route analysis endpoint
        const amountInCents = Math.round(input.amountIn * 100)
        const routeResponse = await fetchFromPoolManager([
          `find_best_swap_path(${amountInCents},"${input.tokenIn}","${tokenOut}",3)`,
        ])

        const pathInfoArray =
          routeResponse.calls[`find_best_swap_path(${amountInCents},"${input.tokenIn}","${tokenOut}",3)`].value

        if (!pathInfoArray) {
          console.log(`❌ [ROUTE TEST] No route found for test`)
          return {
            success: false,
            message: 'No route found for test case',
          }
        }

        // Parse the NamedTuple array to an object with proper property names
        const pathInfo = parseSwapPathInfo(pathInfoArray)

        console.log(`✅ [ROUTE TEST] Test route found:`)
        console.log(`   📍 Path: ${JSON.stringify(pathInfo.path || [])}`)
        console.log(`   💰 Amounts: ${JSON.stringify((pathInfo.amounts || []).map((amt: number) => amt / 100))}`)
        console.log(`   📈 Amount Out: ${(pathInfo.amount_out || 0) / 100}`)
        console.log(`   📊 Price Impact: ${pathInfo.price_impact || 0}%`)

        // Get token symbols for the path
        const tokenSymbols = new Map()
        for (const token of [input.tokenIn, tokenOut, ...(pathInfo.path || [])]) {
          try {
            const symbol = await getTokenSymbol(token)
            tokenSymbols.set(token, symbol)
          } catch (error) {
            tokenSymbols.set(token, token.substring(0, 8))
          }
        }

        const pathTokens = Array.isArray(pathInfo.path) ? pathInfo.path : pathInfo.path?.split(',') || []
        const pathWithSymbols = pathTokens.map((token: string) => `${token} (${tokenSymbols.get(token)})`)

        console.log(`   🏷️  Path with symbols: ${pathWithSymbols.join(' → ')}`)

        return {
          success: true,
          testCase: {
            input: `${input.amountIn} ${tokenSymbols.get(input.tokenIn)} → ${tokenSymbols.get(tokenOut)}`,
            route: pathInfo,
            pathWithSymbols,
          },
          message: 'Route logging test completed successfully - check server console for detailed logs',
        }
      } catch (error) {
        console.error('❌ [ROUTE TEST] Error in route logging test:', error)
        return {
          success: false,
          message: `Route logging test failed: ${error}`,
        }
      }
    }),

  // Get add liquidity quote for exact input amount
  front_quote_add_liquidity_in: procedure
    .input(
      z.object({
        id: z.string(), // Pool ID (can be pool key or symbol ID)
        amount_in: z.number(),
        token_in: z.string(), // Token UUID
      })
    )
    .query(async ({ input }) => {
      try {
        // Detect if ID is symbol-based or pool key
        const isSymbolId = input.id.includes('-') && !input.id.includes('/')
        let poolKey: string

        if (isSymbolId) {
          // Convert symbol ID to pool key
          const parts = input.id.split('-')
          if (parts.length !== 3) {
            throw new Error('Invalid symbol ID format')
          }

          const [symbol0, symbol1, feeString] = parts
          const feeValue = parseFloat(feeString || '0')
          const feeBasisPoints = Math.round(feeValue * 10)

          // Get all signed pools to find the matching one
          const batchResponse = await fetchFromPoolManager(['get_signed_pools()'])
          const poolKeys: string[] = batchResponse.calls['get_signed_pools()'].value || []

          let matchingPoolKey: string | null = null
          for (const key of poolKeys) {
            const [tokenA, tokenB, feeStr] = key.split('/')
            const poolFeeBasisPoints = parseInt(feeStr || '0')

            if (poolFeeBasisPoints === feeBasisPoints) {
              const tokenASymbol = await getTokenSymbol(tokenA || '')
              const tokenBSymbol = await getTokenSymbol(tokenB || '')

              if (
                (tokenASymbol === symbol0 && tokenBSymbol === symbol1) ||
                (tokenASymbol === symbol1 && tokenBSymbol === symbol0)
              ) {
                matchingPoolKey = key
                break
              }
            }
          }

          if (!matchingPoolKey) {
            throw new Error(`Pool not found for symbol ID: ${input.id}`)
          }
          poolKey = matchingPoolKey
        } else {
          // Use the ID as pool key directly
          poolKey = input.id
        }

        // Validate input amount
        if (input.amount_in <= 0 || !isFinite(input.amount_in)) {
          throw new Error('Invalid amount_in value')
        }

        // Convert decimal amount to cents (Amount type expects integers)
        const amountInCents = Math.round(input.amount_in * 100)

        // Call the contract method with the pool key
        const response = await fetchFromPoolManager([
          `front_quote_add_liquidity_in(${amountInCents}, "${input.token_in}", "${poolKey}")`,
        ])

        const resultInCents =
          response.calls[`front_quote_add_liquidity_in(${amountInCents}, "${input.token_in}", "${poolKey}")`].value

        // Validate and convert result back from cents to decimal
        if (typeof resultInCents !== 'number' || !isFinite(resultInCents)) {
          throw new Error('Invalid response from contract')
        }

        const result = resultInCents / 100

        return result
      } catch (error) {
        console.error(`Error in front_quote_add_liquidity_in for ${input.id}:`, error)
        throw new Error(`Failed to get liquidity quote: ${error}`)
      }
    }),

  // Get add liquidity quote for exact output amount
  front_quote_add_liquidity_out: procedure
    .input(
      z.object({
        id: z.string(), // Pool ID (can be pool key or symbol ID)
        amount_out: z.number(),
        token_in: z.string(), // Token UUID
      })
    )
    .query(async ({ input }) => {
      try {
        // Detect if ID is symbol-based or pool key
        const isSymbolId = input.id.includes('-') && !input.id.includes('/')
        let poolKey: string

        if (isSymbolId) {
          // Convert symbol ID to pool key
          const parts = input.id.split('-')
          if (parts.length !== 3) {
            throw new Error('Invalid symbol ID format')
          }

          const [symbol0, symbol1, feeString] = parts
          const feeValue = parseFloat(feeString || '0')
          const feeBasisPoints = Math.round(feeValue * 10)

          // Get all signed pools to find the matching one
          const batchResponse = await fetchFromPoolManager(['get_signed_pools()'])
          const poolKeys: string[] = batchResponse.calls['get_signed_pools()'].value || []

          let matchingPoolKey: string | null = null
          for (const key of poolKeys) {
            const [tokenA, tokenB, feeStr] = key.split('/')
            const poolFeeBasisPoints = parseInt(feeStr || '0')

            if (poolFeeBasisPoints === feeBasisPoints) {
              const tokenASymbol = await getTokenSymbol(tokenA || '')
              const tokenBSymbol = await getTokenSymbol(tokenB || '')

              if (
                (tokenASymbol === symbol0 && tokenBSymbol === symbol1) ||
                (tokenASymbol === symbol1 && tokenBSymbol === symbol0)
              ) {
                matchingPoolKey = key
                break
              }
            }
          }

          if (!matchingPoolKey) {
            throw new Error(`Pool not found for symbol ID: ${input.id}`)
          }
          poolKey = matchingPoolKey
        } else {
          // Use the ID as pool key directly
          poolKey = input.id
        }

        // Validate input amount
        if (input.amount_out <= 0 || !isFinite(input.amount_out)) {
          throw new Error('Invalid amount_out value')
        }

        // Convert decimal amount to cents (Amount type expects integers)
        const amountOutCents = Math.round(input.amount_out * 100)

        // Call the contract method with the pool key
        const response = await fetchFromPoolManager([
          `front_quote_add_liquidity_out(${amountOutCents}, "${input.token_in}", "${poolKey}")`,
        ])

        const resultInCents =
          response.calls[`front_quote_add_liquidity_out(${amountOutCents}, "${input.token_in}", "${poolKey}")`].value

        // Validate and convert result back from cents to decimal
        if (typeof resultInCents !== 'number' || !isFinite(resultInCents)) {
          throw new Error('Invalid response from contract')
        }

        const result = resultInCents / 100

        return result
      } catch (error) {
        console.error(`Error in front_quote_add_liquidity_out for ${input.id}:`, error)
        throw new Error(`Failed to get liquidity quote: ${error}`)
      }
    }),

  // Get all transaction history for debugging and analysis
  getAllTransactionHistory: procedure
    .input(
      z.object({
        count: z.number().min(1).max(500).optional().default(100),
        after: z.string().optional(),
        before: z.string().optional(),
        methodFilter: z.string().optional(),
        poolFilter: z.string().optional(),
        tokenFilter: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        // Build query parameters following the nano contract history API
        const queryParams = [`id=${NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID}`, `count=${input.count}`]

        if (input.after) queryParams.push(`after=${input.after}`)
        if (input.before) queryParams.push(`before=${input.before}`)

        const endpoint = 'nano_contract/history'
        const response = await fetchNodeData(endpoint, queryParams)

        if (!response || !response.success || !response.history) {
          return {
            transactions: [],
            hasMore: false,
            pagination: { after: null, before: null },
          }
        }

        // Filter transactions first
        const filteredTransactions = response.history.filter((tx: any) => {
          // Apply filters
          if (input.methodFilter && tx.nc_method !== input.methodFilter) {
            return false
          }
          if (input.poolFilter && (!tx.nc_args || !JSON.stringify(tx.nc_args).includes(input.poolFilter))) {
            return false
          }
          if (input.tokenFilter && (!tx.nc_args || !JSON.stringify(tx.nc_args).includes(input.tokenFilter))) {
            return false
          }
          return true
        })

        // Parse and enrich transaction data with async processing
        const transactions = await Promise.all(
          filteredTransactions.map(async (tx: any) => {
            // Analyze transaction for multi-hop routing
            const isMultiHop =
              tx.nc_args && tx.nc_args.path && typeof tx.nc_args.path === 'string' && tx.nc_args.path.includes(',')

            // Extract pool information from transaction args
            let poolsInvolved: string[] = []
            let tokensInvolved: string[] = []

            // Extract tokens from transaction outputs using proper Hathor format
            const tokensFromOutputs = new Set<string>()

            if (tx.outputs && Array.isArray(tx.outputs)) {
              tx.outputs.forEach((output: any) => {
                if (output.token_data !== undefined) {
                  const tokenIndex = output.token_data & 0b01111111 // Lower 7 bits
                  const isAuthority = (output.token_data & 0b10000000) !== 0 // Highest bit

                  // Skip authority outputs for token extraction
                  if (!isAuthority) {
                    if (tokenIndex === 0) {
                      // Index 0 is always HTR
                      tokensFromOutputs.add('00')
                    } else if (tx.tokens && tx.tokens[tokenIndex - 1]) {
                      // Other tokens map to tokens array (index - 1)
                      tokensFromOutputs.add(tx.tokens[tokenIndex - 1])
                    }
                  }
                }
              })
            }

            // For multi-hop swaps, also extract tokens from the routing path in nc_args
            const tokensFromArgs = new Set<string>()
            if (tx.nc_args) {
              // Extract tokens from pool path for multi-hop swaps
              // Format is: {uuid}/{uuid}/{fee}/{uuid}/{uuid}/{fee}/{uuid}/{uuid}/{fee}
              if (tx.nc_args.path && typeof tx.nc_args.path === 'string') {
                console.log('Processing multi-hop path:', tx.nc_args.path)
                const pathParts = tx.nc_args.path.split('/')
                console.log('Path parts array:', pathParts)
                console.log('Path parts length:', pathParts.length)

                // Every group of 3 is a pool: tokenA/tokenB/fee
                for (let i = 0; i < pathParts.length; i += 3) {
                  const tokenA = pathParts[i]
                  const tokenB = pathParts[i + 1]
                  const fee = pathParts[i + 2]
                  console.log(`Group ${i / 3}: tokenA='${tokenA}', tokenB='${tokenB}', fee='${fee}'`)

                  if (tokenA && tokenA.trim()) {
                    console.log('Adding tokenA:', tokenA)
                    tokensFromArgs.add(tokenA)
                  }
                  if (tokenB && tokenB.trim()) {
                    console.log('Adding tokenB:', tokenB)
                    tokensFromArgs.add(tokenB)
                  }
                }
                console.log('Final tokensFromArgs:', Array.from(tokensFromArgs))
              }

              // Also check for direct token arguments
              if (tx.nc_args.token_in) {
                tokensFromArgs.add(tx.nc_args.token_in)
              }
              if (tx.nc_args.token_out) {
                tokensFromArgs.add(tx.nc_args.token_out)
              }
              if (tx.nc_args.token_a) {
                tokensFromArgs.add(tx.nc_args.token_a)
              }
              if (tx.nc_args.token_b) {
                tokensFromArgs.add(tx.nc_args.token_b)
              }
            }

            // Combine tokens from outputs and arguments
            const allTokens = new Set([...tokensFromOutputs, ...tokensFromArgs])
            tokensInvolved = Array.from(allTokens)

            // Fetch token symbols for display
            const tokenSymbolPromises = tokensInvolved.map(async (tokenUuid) => {
              try {
                const tokenInfo = await fetchTokenInfo(tokenUuid)
                return {
                  uuid: tokenUuid,
                  symbol: tokenInfo.symbol,
                  name: tokenInfo.name,
                }
              } catch (error) {
                // Fallback for failed token info fetch
                return {
                  uuid: tokenUuid,
                  symbol: tokenUuid === '00' ? 'HTR' : tokenUuid.substring(0, 8).toUpperCase(),
                  name: tokenUuid === '00' ? 'Hathor' : `Token ${tokenUuid.substring(0, 8).toUpperCase()}`,
                }
              }
            })

            const tokenSymbols = await Promise.all(tokenSymbolPromises)

            // Try to extract pool information from nc_args if available
            if (tx.nc_args) {
              const args = tx.nc_args

              // For swap transactions, check for path (multi-hop)
              if (tx.nc_method && tx.nc_method.includes('swap') && args.path && typeof args.path === 'string') {
                // Parse the path format: {uuid}/{uuid}/{fee}/{uuid}/{uuid}/{fee}...
                const pathParts = args.path.split('/')
                const pools = []
                // Every group of 3 is a pool: tokenA/tokenB/fee
                for (let i = 0; i < pathParts.length; i += 3) {
                  const tokenA = pathParts[i]
                  const tokenB = pathParts[i + 1]
                  const fee = pathParts[i + 2]
                  if (tokenA && tokenB && fee) {
                    pools.push(`${tokenA}/${tokenB}/${fee}`)
                  }
                }
                poolsInvolved = pools
              }

              // For liquidity transactions, extract single pool
              if (
                tx.nc_method &&
                (tx.nc_method.includes('add_liquidity') || tx.nc_method.includes('remove_liquidity')) &&
                args.pool_key
              ) {
                poolsInvolved = [args.pool_key]
              }

              // For pool creation, extract tokens from arguments
              if (tx.nc_method && tx.nc_method.includes('create_pool') && args.token_a && args.token_b) {
                // Construct pool key for display
                if (args.fee !== undefined) {
                  poolsInvolved = [`${args.token_a}/${args.token_b}/${args.fee}`]
                }
              }
            }

            return {
              id: tx.tx_id, // Required by GenericTable
              tx_id: tx.tx_id,
              timestamp: tx.timestamp,
              method: tx.nc_method,
              args: tx.nc_args,
              poolsInvolved,
              tokensInvolved,
              tokenSymbols, // Include resolved token symbols
              isMultiHop,
              weight: tx.weight,
              success: Array.isArray(tx.voided_by) ? tx.voided_by.length === 0 : !tx.voided_by,
              // Include full transaction data for debugging
              debug: {
                fullTx: tx,
                inputs: tx.inputs,
                outputs: tx.outputs,
                parents: tx.parents,
                // Add debug info for token extraction only for multi-hop with string path
                ...(isMultiHop && tx.nc_args?.path && typeof tx.nc_args.path === 'string'
                  ? {
                      tokensFromOutputs: Array.from(tokensFromOutputs),
                      tokensFromArgs: Array.from(tokensFromArgs),
                      pathString: tx.nc_args.path,
                      pathParts: tx.nc_args.path.split('/'),
                    }
                  : {}),
              },
            }
          })
        )

        return {
          transactions,
          hasMore: response.has_more || false,
          pagination: {
            after: response.after || null,
            before: response.before || null,
          },
        }
      } catch (error) {
        console.error('Error fetching all transaction history:', error)
        return {
          transactions: [],
          hasMore: false,
          pagination: { after: null, before: null },
        }
      }
    }),
})
