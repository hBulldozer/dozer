import { z } from 'zod'

import { createTRPCRouter, procedure } from '../trpc'
import { fetchNodeData } from '../helpers/fetchFunction'
import { formatPrice } from './constants'
import {
  parsePoolApiInfo,
  parsePoolInfo,
  parseSwapPathInfo,
  parseSwapPathExactOutputInfo,
  parseUserPositions,
  parseUserProfitInfo,
  parseQuoteSingleTokenResult,
  parseQuoteRemoveSingleTokenResult,
  type PoolApiInfo,
  type PoolInfo,
  type SwapPathInfo,
  type SwapPathExactOutputInfo,
  type UserProfitInfo,
  type QuoteSingleTokenResult,
  type QuoteRemoveSingleTokenResult,
} from '../utils/namedTupleParsers'

// Get the Pool Manager Contract ID from environment
const NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID = process.env.NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID

// Get the DozerTools Contract ID from environment
const NEXT_PUBLIC_DOZER_TOOLS_CONTRACT_ID = process.env.NEXT_PUBLIC_DOZER_TOOLS_CONTRACT_ID
const NEXT_PUBLIC_DOZER_TOOLS_VERCEL_BLOB_URL = process.env.NEXT_PUBLIC_DOZER_TOOLS_VERCEL_BLOB_URL

// Helper function to fetch DozerTools image URL for a token
async function getDozerToolsImageUrl(tokenUuid: string): Promise<string | null> {
  try {
    // Skip if DozerTools integration is not configured
    if (!NEXT_PUBLIC_DOZER_TOOLS_CONTRACT_ID || !NEXT_PUBLIC_DOZER_TOOLS_VERCEL_BLOB_URL) {
      return null
    }

    // Fetch project info from DozerTools contract
    const endpoint = 'nano_contract/state'
    const queryParams = [`id=${NEXT_PUBLIC_DOZER_TOOLS_CONTRACT_ID}`, `calls[]=get_project_info("${tokenUuid}")`]

    const response = await fetchNodeData(endpoint, queryParams)
    const projectInfo = response.calls[`get_project_info("${tokenUuid}")`]?.value

    if (projectInfo && projectInfo.logo_url) {
      // Check if it's a valid Vercel Blob URL format
      if (projectInfo.logo_url.startsWith('http')) {
        return projectInfo.logo_url
      } else {
        // Construct URL using Vercel Blob base URL
        return `${NEXT_PUBLIC_DOZER_TOOLS_VERCEL_BLOB_URL}/${projectInfo.logo_url}`
      }
    }

    return null
  } catch (error) {
    // Silently fail for DozerTools integration - it's optional
    console.debug(`DozerTools image lookup failed for token ${tokenUuid}`)
    return null
  }
}

// Helper function to calculate 24h transaction count using delta approach
async function calculate24hTransactionCount(poolKey: string): Promise<number> {
  try {
    const now = Math.floor(Date.now() / 1000)
    const oneDayAgo = now - 24 // 24 hours ago in seconds

    // Get current pool data
    const currentResponse = await fetchFromPoolManager([`front_end_api_pool("${poolKey}")`])
    const currentPoolDataArray = currentResponse.calls[`front_end_api_pool("${poolKey}")`]?.value

    if (!currentPoolDataArray) {
      console.warn(`⚠️  No current data found for pool ${poolKey}`)
      return 0
    }

    const currentPoolData = parsePoolApiInfo(currentPoolDataArray)
    const currentTransactions = currentPoolData.transactions || 0

    // Get historical pool data from 24 hours ago
    let historicalTransactions = 0
    try {
      const historicalResponse = await fetchFromPoolManager([`front_end_api_pool("${poolKey}")`], oneDayAgo)
      const historicalPoolDataArray = historicalResponse.calls[`front_end_api_pool("${poolKey}")`]?.value

      if (historicalPoolDataArray) {
        const historicalPoolData = parsePoolApiInfo(historicalPoolDataArray)
        historicalTransactions = historicalPoolData.transactions || 0
      }
    } catch (error) {
      // If historical data is not available (common in development), assume 0
      console.warn(
        `Historical data unavailable for pool ${poolKey} at ${oneDayAgo}, assuming 0 historical transactions`
      )
      historicalTransactions = 0
    }

    // Calculate 24h transaction delta
    const transactions24h = Math.max(0, currentTransactions - historicalTransactions)

    return transactions24h
  } catch (error) {
    console.error(`Error calculating 24h transaction count for pool ${poolKey}:`, error)
    return 0
  }
}

if (!NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID) {
  console.warn('NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID environment variable not set')
}

// Cache for token information to avoid repeated API calls
const tokenInfoCache = new Map<string, { symbol: string; name: string }>()

// Helper function to calculate 24h volume using delta approach
async function calculate24hVolume(poolKey: string): Promise<{ volume24h: number; volume24hUSD: number }> {
  try {
    const now = Math.floor(Date.now() / 1000)
    const oneDayAgo = now - 24 // 24 hours ago in seconds

    // Get current pool data
    const currentResponse = await fetchFromPoolManager([`front_end_api_pool("${poolKey}")`])
    const currentPoolDataArray = currentResponse.calls[`front_end_api_pool("${poolKey}")`]?.value

    if (!currentPoolDataArray) {
      console.warn(`⚠️  No current data found for pool ${poolKey}`)
      return { volume24h: 0, volume24hUSD: 0 }
    }

    const currentPoolData = parsePoolApiInfo(currentPoolDataArray)
    const currentVolume = (currentPoolData.volume || 0) / 100 // Convert from cents

    // Get historical pool data from 24 hours ago
    let historicalVolume = 0
    try {
      const historicalResponse = await fetchFromPoolManager([`front_end_api_pool("${poolKey}")`], oneDayAgo)
      const historicalPoolDataArray = historicalResponse.calls[`front_end_api_pool("${poolKey}")`]?.value

      if (historicalPoolDataArray) {
        const historicalPoolData = parsePoolApiInfo(historicalPoolDataArray)
        historicalVolume = (historicalPoolData.volume || 0) / 100 // Convert from cents
      }
    } catch (error) {
      // If historical data is not available (common in development), assume 0
      console.warn(`Historical data unavailable for pool ${poolKey} at ${oneDayAgo}, assuming 0 historical volume`)
      historicalVolume = 0
    }

    // Calculate 24h volume delta
    const volume24h = Math.max(0, currentVolume - historicalVolume)

    // Get token prices for USD calculation
    const [tokenA, tokenB] = poolKey.split('/')
    if (!tokenA) {
      console.warn(`⚠️  Invalid pool key format: ${poolKey}`)
      return { volume24h: 0, volume24hUSD: 0 }
    }

    const tokenPricesResponse = await fetchFromPoolManager(['get_all_token_prices_in_usd()'])
    const rawTokenPrices: Record<string, number> =
      tokenPricesResponse.calls['get_all_token_prices_in_usd()'].value || {}
    const tokenPrices: Record<string, number> = Object.fromEntries(
      Object.entries(rawTokenPrices).map(([k, v]) => [k, formatPrice(v as number)])
    )

    const token0PriceUSD = tokenPrices[tokenA] || 0
    const volume24hUSD = volume24h * token0PriceUSD

    return { volume24h, volume24hUSD }
  } catch (error) {
    console.error(`Error calculating 24h volume for pool ${poolKey}:`, error)
    return { volume24h: 0, volume24hUSD: 0 }
  }
}

// Helper function to calculate 24h fees using volume * fee rate
async function calculate24hFees(
  poolKey: string,
  volume24hUSD: number
): Promise<{ fees24h: number; fees24hUSD: number }> {
  try {
    // Get current pool data to get the fee rate
    const currentResponse = await fetchFromPoolManager([`front_end_api_pool("${poolKey}")`])
    const currentPoolDataArray = currentResponse.calls[`front_end_api_pool("${poolKey}")`]?.value

    if (!currentPoolDataArray) {
      console.warn(`⚠️  No current data found for pool ${poolKey}`)
      return { fees24h: 0, fees24hUSD: 0 }
    }

    const currentPoolData = parsePoolApiInfo(currentPoolDataArray)

    // Fee rate is in basis points, convert to decimal (e.g., 5 basis points = 0.0005)
    const feeRate = (currentPoolData.fee || 0) / 10000

    // Calculate fees: volume * fee rate
    const fees24hUSD = volume24hUSD * feeRate

    // For raw fees, we can approximate using the same ratio
    const fees24h = volume24hUSD > 0 ? fees24hUSD : 0

    return { fees24h, fees24hUSD }
  } catch (error) {
    console.error(`Error calculating 24h fees for pool ${poolKey}:`, error)
    return { fees24h: 0, fees24hUSD: 0 }
  }
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
      // Convert token prices from contract units to USD (divide by PRICE_PRECISION)
      const tokenPrices: Record<string, number> = Object.fromEntries(
        Object.entries(rawTokenPrices).map(([k, v]) => [k, formatPrice(v as number)])
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
      const poolsData = await Promise.all(
        poolKeys.map(async (poolKey) => {
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
            const swapFee = parseInt(feeStr || '0') / 10 // Convert fee format to percentage (fee_numerator/fee_denominator*100 = x/1000*100 = x/10)

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

            // Calculate 24h volume using delta approach
            const { volume24h, volume24hUSD } = await calculate24hVolume(poolKey)
            const volume1d = volume24h
            const volumeUSD = volume24hUSD

            // Calculate 24h fees using volume * fee rate
            const { fees24h, fees24hUSD } = await calculate24hFees(poolKey, volume24hUSD)
            const feeUSD = fees24hUSD

            // Keep the old fee calculation for APR (using accumulated fees)
            const fee0 = (poolData.fee0 || 0) / 100
            const fee1 = (poolData.fee1 || 0) / 100
            const accumulatedFeeUSD = fee0 * token0PriceUSD + fee1 * token1PriceUSD

            // Calculate APR (annualized based on accumulated fees)
            const apr = liquidityUSD > 0 ? ((accumulatedFeeUSD * 365) / liquidityUSD) * 100 : 0

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
                imageUrl: (await getDozerToolsImageUrl(tokenA || '')) || undefined,
              },
              token1: {
                uuid: tokenB,
                symbol: token1Info.symbol,
                name: token1Info.name,
                decimals: 2,
                chainId: 1,
                imageUrl: (await getDozerToolsImageUrl(tokenB || '')) || undefined,
              },
              reserve0,
              reserve1,
              chainId: 1,
              liquidity: reserve0 * 2,
              volume1d,
              fee0,
              fee1,
              fees1d: feeUSD,
              txCount: poolData.transactions || 0,
              txCount1d: await calculate24hTransactionCount(poolKey),
              daySnapshots: [],
              hourSnapshots: [],
            }
          } catch (error) {
            console.error(`❌ [GET_POOLS_ALL] Error processing pool ${poolKey}:`, error)
            return null
          }
        })
      )

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
          imageUrl: (await getDozerToolsImageUrl(tokenA || '')) || undefined,
        },
        token1: {
          uuid: tokenB,
          symbol: await getTokenSymbol(tokenB || ''),
          name: await getTokenName(tokenB || ''),
          decimals: 2,
          chainId: 1,
          imageUrl: (await getDozerToolsImageUrl(tokenB || '')) || undefined,
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

      // Try to find the pool in signed pools first
      const batchResponse = await fetchFromPoolManager(['get_signed_pools()'])
      const signedPoolKeys: string[] = batchResponse.calls['get_signed_pools()'].value || []

      // Find the pool that matches the symbol and fee criteria in signed pools first
      let matchingPoolKey: string | null = null

      for (const poolKey of signedPoolKeys) {
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

      // If not found in signed pools, try all pools (including unsigned ones)
      if (!matchingPoolKey) {
        const allPoolsResponse = await fetchFromPoolManager(['get_all_pools()'])
        const allPoolKeys: string[] = allPoolsResponse.calls['get_all_pools()'].value || []

        for (const poolKey of allPoolKeys) {
          // Skip if we already checked this pool in signed pools
          if (signedPoolKeys.includes(poolKey)) continue

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
      // Convert token prices from contract units to USD (divide by PRICE_PRECISION)
      const tokenPrices: Record<string, number> = Object.fromEntries(
        Object.entries(rawTokenPrices).map(([k, v]) => [k, formatPrice(v as number)])
      )

      if (!poolDataArray) {
        throw new Error('Pool data not found')
      }

      // Parse the NamedTuple array to an object with proper property names
      const poolData = parsePoolApiInfo(poolDataArray)

      // Parse pool key
      const [tokenA, tokenB, feeStrSecond] = matchingPoolKey.split('/')
      const fee = parseInt(feeStrSecond || '0') / 1000
      const swapFee = parseInt(feeStrSecond || '0') / 10 // Convert fee format to percentage (fee_numerator/fee_denominator*100 = x/1000*100 = x/10)

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

      // Calculate 24h volume using delta approach
      const { volume24h, volume24hUSD } = await calculate24hVolume(matchingPoolKey)
      const volume1d = volume24h
      const volumeUSD = volume24hUSD

      // Calculate 24h fees using volume * fee rate
      const { fees24h, fees24hUSD } = await calculate24hFees(matchingPoolKey, volume24hUSD)
      const feeUSD = fees24hUSD

      // Keep the old fee calculation for APR (using accumulated fees)
      const fee0 = (poolData.fee0 || 0) / 100
      const fee1 = (poolData.fee1 || 0) / 100
      const accumulatedFeeUSD = fee0 * token0PriceUSD + fee1 * token1PriceUSD

      // Calculate APR (annualized based on accumulated fees)
      const apr = liquidityUSD > 0 ? ((accumulatedFeeUSD * 365) / liquidityUSD) * 100 : 0

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
          imageUrl: (await getDozerToolsImageUrl(tokenA || '')) || undefined,
        },
        token1: {
          uuid: tokenB,
          symbol: token1Info.symbol,
          name: token1Info.name,
          decimals: 2,
          chainId: 1,
          imageUrl: (await getDozerToolsImageUrl(tokenB || '')) || undefined,
        },
        reserve0,
        reserve1,
        chainId: 1,
        liquidity: liquidityUSD,
        volume1d,
        fee0,
        fee1,
        fees1d: feeUSD,
        txCount: poolData.transactions || 0,
        txCount1d: await calculate24hTransactionCount(matchingPoolKey),
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
            let nextToken = null

            if (tokenA && tokenA === currentToken && tokenB) {
              nextToken = tokenB
            } else if (tokenB && tokenB === currentToken && tokenA) {
              nextToken = tokenA
            }

            // Only add the next token if we found a valid transition
            if (nextToken && nextToken !== currentToken) {
              tokenPath.push(nextToken)
              currentToken = nextToken
            }
          }
        }

        return {
          path: tokenPath,
          amounts: (pathInfo.amounts || []).map((amt: number) => amt / 100),
          amountOut: (pathInfo.amount_out || 0) / 100,
          priceImpact: (pathInfo.price_impact || 0) / 100, // Convert from integer format (341 = 3.41%) to percentage
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
        // For exact output, the pool path is returned in REVERSE order from contract
        const tokenPath = []
        if (poolKeys.length > 0) {
          // For exact output, reverse the pool keys to get forward path
          const reversedPoolKeys = [...poolKeys].reverse()

          // Start with input token
          tokenPath.push(input.tokenIn)

          // Follow the path through each pool to build token sequence
          let currentToken = input.tokenIn
          for (const poolKey of reversedPoolKeys) {
            const [tokenA, tokenB] = poolKey.split('/')
            let nextToken = null

            if (tokenA && tokenA === currentToken && tokenB) {
              nextToken = tokenB
            } else if (tokenB && tokenB === currentToken && tokenA) {
              nextToken = tokenA
            }

            // Only add the next token if we found a valid transition
            if (nextToken && nextToken !== currentToken) {
              tokenPath.push(nextToken)
              currentToken = nextToken
            }
          }
        }

        // For exact output, we need to reverse the poolPath for contract execution
        // The contract returns paths in reverse order, but expects them in forward order for execution
        const executionPoolPath = poolKeys.length > 0 ? [...poolKeys].reverse().join(',') : poolPath

        return {
          path: tokenPath,
          amounts: (pathInfo.amounts || []).map((amt: number) => amt / 100),
          amountIn: (pathInfo.amount_in || 0) / 100,
          priceImpact: (pathInfo.price_impact || 0) / 100, // Convert from integer format (341 = 3.41%) to percentage
          route: tokenPath, // Keep for backward compatibility
          poolPath: executionPoolPath, // Add the pool path for contract execution (reversed for exact output)
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
          volume24h: (poolInfo.volume_a || 0) + (poolInfo.volume_b || 0),
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
        console.log(`   📊 Price impact: ${((pathInfo.price_impact || 0) / 100).toFixed(2)}%`)
        console.log(`   🔀 Number of hops: ${(pathInfo.path || []).length - 1}`)

        // Calculate efficiency metrics
        const inputAmount = input.amountIn
        const outputAmount = (pathInfo.amount_out || 0) / 100
        const directRate = outputAmount / inputAmount
        const priceImpact = (pathInfo.price_impact || 0) / 100 // Convert from integer format to percentage

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
        console.log(`   📊 Price Impact: ${((pathInfo.price_impact || 0) / 100).toFixed(2)}%`)

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

        const pathArray = Array.isArray(pathInfo.path) ? pathInfo.path : []
        const pathWithSymbols = pathArray.map((token: string) => `${token} (${tokenSymbols.get(token)})`)

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

  // Get transaction history for a specific pool
  poolTransactionHistory: procedure
    .input(
      z.object({
        poolKey: z.string(),
        count: z.number().min(1).max(200).optional().default(50),
        after: z.string().optional(),
        before: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        // Build query parameters for nano contract history API
        const queryParams = [`id=${NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID}`, `count=${input.count * 3}`] // Get more to filter

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

        // Filter transactions specific to this pool
        const poolSpecificTransactions = response.history.filter((tx: any) => {
          // Check if transaction involves this specific pool
          if (tx.nc_args) {
            const args = tx.nc_args

            // For swap transactions with path, check if pool is in the path
            if (args.path && typeof args.path === 'string') {
              // Multi-hop path format: token/token/fee,token/token/fee
              // Or single path format: token/token/fee
              const pathPools = args.path.split(',')
              return pathPools.some((pathSegment: string) => {
                // Parse each path segment as: token/token/fee
                const parts = pathSegment.split('/')
                if (parts.length >= 3) {
                  const reconstructedPool = `${parts[0]}/${parts[1]}/${parts[2]}`
                  return reconstructedPool === input.poolKey
                }
                return false
              })
            }

            // For liquidity transactions, check pool_key
            if (args.pool_key === input.poolKey) {
              return true
            }

            // For pool creation, check if tokens and fee match
            if (tx.nc_method === 'create_pool' && args.token_a && args.token_b && args.fee !== undefined) {
              const constructedPoolKey = `${args.token_a}/${args.token_b}/${args.fee}`
              return constructedPoolKey === input.poolKey
            }
          }

          return false
        })

        // Limit to requested count
        const limitedTransactions = poolSpecificTransactions.slice(0, input.count)

        // Parse and enrich transaction data
        const transactions = await Promise.all(
          limitedTransactions.map(async (tx: any) => {
            // Determine transaction type and extract relevant info
            const txType = tx.nc_method
            let action = 'Unknown'
            const tokenAmounts: {
              tokenIn?: { uuid: string; amount: number }
              tokenOut?: { uuid: string; amount: number }
            } = {}

            // Parse transaction based on method type
            if (txType && txType.includes('swap')) {
              action = txType.includes('multi_hop') || txType.includes('through_path') ? 'Multi-hop Swap' : 'Swap'

              // Extract token amounts from transaction
              if (tx.nc_args) {
                // For swaps, amount_in and amount_out are in args
                if (tx.nc_args.amount_in && tx.nc_args.token_in) {
                  tokenAmounts.tokenIn = {
                    uuid: tx.nc_args.token_in,
                    amount: tx.nc_args.amount_in / 100, // Convert from cents
                  }
                }
                if (tx.nc_args.amount_out && tx.nc_args.token_out) {
                  tokenAmounts.tokenOut = {
                    uuid: tx.nc_args.token_out,
                    amount: tx.nc_args.amount_out / 100, // Convert from cents
                  }
                }
              }
            } else if (txType && txType.includes('add_liquidity')) {
              action = 'Add Liquidity'

              // Extract liquidity amounts from transaction outputs
              if (tx.outputs && Array.isArray(tx.outputs)) {
                const liquidityAmounts = tx.outputs
                  .filter((output: any) => output.value > 0)
                  .map((output: any) => {
                    let tokenUuid = '00' // Default to HTR
                    if (output.token_data !== undefined) {
                      const tokenIndex = output.token_data & 0b01111111
                      if (tokenIndex > 0 && tx.tokens && tx.tokens[tokenIndex - 1]) {
                        tokenUuid = tx.tokens[tokenIndex - 1]
                      }
                    }
                    return {
                      uuid: tokenUuid,
                      amount: output.value / 100, // Convert from cents
                    }
                  })

                // Set token amounts for display
                if (liquidityAmounts.length >= 2) {
                  tokenAmounts.tokenIn = liquidityAmounts[0]
                  tokenAmounts.tokenOut = liquidityAmounts[1]
                }
              }
            } else if (txType && txType.includes('remove_liquidity')) {
              action = 'Remove Liquidity'

              // Similar to add_liquidity but for withdrawal
              if (tx.outputs && Array.isArray(tx.outputs)) {
                const liquidityAmounts = tx.outputs
                  .filter((output: any) => output.value > 0)
                  .map((output: any) => {
                    let tokenUuid = '00'
                    if (output.token_data !== undefined) {
                      const tokenIndex = output.token_data & 0b01111111
                      if (tokenIndex > 0 && tx.tokens && tx.tokens[tokenIndex - 1]) {
                        tokenUuid = tx.tokens[tokenIndex - 1]
                      }
                    }
                    return {
                      uuid: tokenUuid,
                      amount: output.value / 100,
                    }
                  })

                if (liquidityAmounts.length >= 2) {
                  tokenAmounts.tokenIn = liquidityAmounts[0]
                  tokenAmounts.tokenOut = liquidityAmounts[1]
                }
              }
            } else if (txType === 'create_pool') {
              action = 'Create Pool'
            }

            // Get token symbols for display
            const tokenSymbols = new Map()
            const tokensToFetch = []
            if (tokenAmounts.tokenIn) tokensToFetch.push(tokenAmounts.tokenIn.uuid)
            if (tokenAmounts.tokenOut) tokensToFetch.push(tokenAmounts.tokenOut.uuid)

            for (const tokenUuid of tokensToFetch) {
              try {
                const tokenInfo = await fetchTokenInfo(tokenUuid)
                tokenSymbols.set(tokenUuid, tokenInfo)
              } catch (error) {
                tokenSymbols.set(tokenUuid, {
                  symbol: tokenUuid === '00' ? 'HTR' : tokenUuid.substring(0, 8).toUpperCase(),
                  name: tokenUuid === '00' ? 'Hathor' : `Token ${tokenUuid.substring(0, 8).toUpperCase()}`,
                })
              }
            }

            return {
              id: tx.tx_id,
              hash: tx.tx_id,
              timestamp: tx.timestamp,
              action,
              method: tx.nc_method,
              tokenIn: tokenAmounts.tokenIn
                ? {
                    ...tokenAmounts.tokenIn,
                    symbol: tokenSymbols.get(tokenAmounts.tokenIn.uuid)?.symbol || 'UNK',
                    name: tokenSymbols.get(tokenAmounts.tokenIn.uuid)?.name || 'Unknown',
                  }
                : null,
              tokenOut: tokenAmounts.tokenOut
                ? {
                    ...tokenAmounts.tokenOut,
                    symbol: tokenSymbols.get(tokenAmounts.tokenOut.uuid)?.symbol || 'UNK',
                    name: tokenSymbols.get(tokenAmounts.tokenOut.uuid)?.name || 'Unknown',
                  }
                : null,
              success: Array.isArray(tx.voided_by) ? tx.voided_by.length === 0 : !tx.voided_by,
              weight: tx.weight || 0,
              // Include raw args for debugging
              args: tx.nc_args,
            }
          })
        )

        return {
          transactions,
          hasMore: poolSpecificTransactions.length > input.count,
          pagination: {
            after: response.after || null,
            before: response.before || null,
          },
        }
      } catch (error) {
        console.error(
          `❌ [POOL_TRANSACTION_HISTORY] Error fetching pool transaction history for ${input.poolKey}:`,
          error
        )

        // Log additional context for debugging
        console.error(`   Pool Key: ${input.poolKey}`)
        console.error(`   Count: ${input.count}`)
        console.error(`   After: ${input.after || 'none'}`)
        console.error(`   Before: ${input.before || 'none'}`)
        console.error(`   Contract ID: ${NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID || 'not set'}`)

        return {
          transactions: [],
          hasMore: false,
          pagination: { after: null, before: null },
        }
      }
    }),

  // Get user profit info for a specific pool
  getUserProfitInfo: procedure
    .input(
      z.object({
        address: z.string(),
        poolKey: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const response = await fetchFromPoolManager([`get_user_profit_info("${input.address}", "${input.poolKey}")`])
        const profitInfoArray = response.calls[`get_user_profit_info("${input.address}", "${input.poolKey}")`].value

        if (!profitInfoArray) {
          return {
            current_value_usd: 0,
            initial_value_usd: 0,
            profit_amount_usd: 0,
            profit_percentage: 0,
            last_action_timestamp: 0,
          }
        }

        // Parse the NamedTuple array to an object with proper property names
        const profitInfo = parseUserProfitInfo(profitInfoArray)

        return {
          current_value_usd: profitInfo.current_value_usd / 100, // Convert from cents
          initial_value_usd: profitInfo.initial_value_usd / 100, // Convert from cents
          profit_amount_usd: profitInfo.profit_amount_usd / 100, // Convert from cents
          profit_percentage: profitInfo.profit_percentage / 100, // Convert from percentage with 2 decimal places
          last_action_timestamp: profitInfo.last_action_timestamp,
        }
      } catch (error) {
        console.error(`Error fetching profit info for ${input.address} in pool ${input.poolKey}:`, error)
        throw new Error('Failed to fetch user profit information')
      }
    }),

  // Quote for adding liquidity with single token
  quoteSingleTokenLiquidity: procedure
    .input(
      z.object({
        tokenIn: z.string(),
        amountIn: z.number(),
        tokenOut: z.string(),
        fee: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        const amountInCents = Math.round(input.amountIn * 100)
        const response = await fetchFromPoolManager([
          `quote_add_liquidity_single_token("${input.tokenIn}", ${amountInCents}, "${input.tokenOut}", ${
            input.fee * 10
          })`,
        ])
        const quoteArray =
          response.calls[
            `quote_add_liquidity_single_token("${input.tokenIn}", ${amountInCents}, "${input.tokenOut}", ${
              input.fee * 10
            })`
          ].value

        if (!quoteArray) {
          throw new Error('Failed to get single token liquidity quote')
        }

        // Parse the NamedTuple array to an object with proper property names
        const quote = parseQuoteSingleTokenResult(quoteArray)

        return {
          liquidity_amount: quote.liquidity_amount,
          token_a_used: quote.token_a_used / 100, // Convert from cents
          token_b_used: quote.token_b_used / 100, // Convert from cents
          excess_token: quote.excess_token,
          excess_amount: quote.excess_amount / 100, // Convert from cents
          swap_amount: quote.swap_amount / 100, // Convert from cents
          swap_output: quote.swap_output / 100, // Convert from cents
        }
      } catch (error) {
        console.error(`Error getting single token liquidity quote:`, error)
        throw new Error('Failed to get single token liquidity quote')
      }
    }),

  // Quote for removing liquidity to receive single token
  quoteSingleTokenRemoval: procedure
    .input(
      z.object({
        address: z.string(),
        tokenA: z.string(),
        tokenB: z.string(),
        tokenOut: z.string(),
        fee: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        const response = await fetchFromPoolManager([
          `quote_remove_liquidity_single_token("${input.address}", "${input.tokenA}", "${input.tokenB}", "${
            input.tokenOut
          }", ${input.fee * 10})`,
        ])
        const quoteArray =
          response.calls[
            `quote_remove_liquidity_single_token("${input.address}", "${input.tokenA}", "${input.tokenB}", "${
              input.tokenOut
            }", ${input.fee * 10})`
          ].value

        if (!quoteArray) {
          throw new Error('Failed to get single token removal quote')
        }

        // Parse the NamedTuple array to an object with proper property names
        const quote = parseQuoteRemoveSingleTokenResult(quoteArray)

        return {
          amount_out: quote.amount_out / 100, // Convert from cents
          token_a_withdrawn: quote.token_a_withdrawn / 100, // Convert from cents
          token_b_withdrawn: quote.token_b_withdrawn / 100, // Convert from cents
          swap_amount: quote.swap_amount / 100, // Convert from cents
          swap_output: quote.swap_output / 100, // Convert from cents
          user_liquidity: quote.user_liquidity,
        }
      } catch (error) {
        console.error(`Error getting single token removal quote:`, error)
        throw new Error('Failed to get single token removal quote')
      }
    }),

  // Get enhanced user positions with profit tracking
  getUserPositionsDetailed: procedure.input(z.object({ address: z.string() })).query(async ({ input }) => {
    try {
      const response = await fetchFromPoolManager([`get_user_positions("${input.address}")`])
      const positionsArrays = response.calls[`get_user_positions("${input.address}")`].value

      if (!positionsArrays) {
        return []
      }

      // Parse the user positions object
      const positions = parseUserPositions(positionsArrays)

      const positionPromises = []
      for (const [poolKey, position] of Object.entries(positions)) {
        if (typeof position === 'object' && position !== null) {
          const [tokenA, tokenB, feeStr] = poolKey.split('/')
          positionPromises.push(
            (async () => {
              // Also get profit info for this position
              let profitInfo = null
              try {
                const profitResponse = await fetchFromPoolManager([
                  `get_user_profit_info("${input.address}", "${poolKey}")`,
                ])
                const profitArray = profitResponse.calls[`get_user_profit_info("${input.address}", "${poolKey}")`].value
                if (profitArray) {
                  const parsedProfit = parseUserProfitInfo(profitArray)
                  profitInfo = {
                    current_value_usd: parsedProfit.current_value_usd / 100,
                    initial_value_usd: parsedProfit.initial_value_usd / 100,
                    profit_amount_usd: parsedProfit.profit_amount_usd / 100,
                    profit_percentage: parsedProfit.profit_percentage / 100,
                    last_action_timestamp: parsedProfit.last_action_timestamp,
                  }
                }
              } catch (error) {
                console.warn(`Could not fetch profit info for pool ${poolKey}:`, error)
              }

              return {
                poolKey,
                poolName: `${await getTokenSymbol(tokenA || '')}-${await getTokenSymbol(tokenB || '')}`,
                liquidity: position.liquidity || 0,
                token0Amount: (position.token0Amount || 0) / 100,
                token1Amount: (position.token1Amount || 0) / 100,
                share: (position.share || 0) / 100, // Convert from percentage
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
                profit: profitInfo,
              }
            })()
          )
        }
      }

      const positionData = await Promise.all(positionPromises)
      return positionData
    } catch (error) {
      console.error(`Error fetching detailed user positions for ${input.address}:`, error)
      throw new Error('Failed to fetch detailed user positions')
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
