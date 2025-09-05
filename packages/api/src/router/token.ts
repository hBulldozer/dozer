import { z } from 'zod'

import { fetchNodeData } from '../helpers/fetchFunction'
import { createTRPCRouter, procedure } from '../trpc'
import { parsePoolApiInfo, type PoolApiInfo } from '../utils/namedTupleParsers'
import { formatPrice } from './constants'

// Get the Pool Manager Contract ID from environment
const NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID = process.env.NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID

if (!NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID) {
  console.warn('NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID environment variable not set')
}

// Get the bridged token UUIDs from environment
const BRIDGED_TOKEN_UUIDS = process.env.NEXT_PUBLIC_BRIDGED_TOKEN_UUIDS
  ? process.env.NEXT_PUBLIC_BRIDGED_TOKEN_UUIDS.split(',').map((uuid) => uuid.trim())
  : []

// Get the bridged token original addresses from environment
const BRIDGED_TOKEN_ADDRESSES = process.env.NEXT_PUBLIC_BRIDGED_TOKEN_ADDRESSES
  ? process.env.NEXT_PUBLIC_BRIDGED_TOKEN_ADDRESSES.split(',').map((address) => address.trim())
  : []

// Helper function to check if a token is bridged
function isBridgedToken(uuid: string): boolean {
  return BRIDGED_TOKEN_UUIDS.includes(uuid)
}

// Helper function to get original address for a bridged token
function getBridgedTokenOriginalAddress(uuid: string): string | null {
  const index = BRIDGED_TOKEN_UUIDS.indexOf(uuid)
  if (index !== -1 && index < BRIDGED_TOKEN_ADDRESSES.length) {
    return BRIDGED_TOKEN_ADDRESSES[index] || null
  }
  return null
}

// Helper function to calculate 24h volume using delta approach
async function calculate24hVolume(poolKey: string): Promise<{ volume24h: number; volume24hUSD: number }> {
  try {
    const now = Math.floor(Date.now() / 1000)
    const oneDayAgo = now - 24 * 60 * 60 // 24 hours ago in seconds

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

// Helper function to calculate 24h transaction count using delta approach
async function calculate24hTransactionCount(poolKey: string): Promise<number> {
  try {
    const now = Math.floor(Date.now() / 1000)
    const oneDayAgo = now - 24 * 60 * 60 // 24 hours ago in seconds

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

// Helper function to extract unique tokens from pool keys
function extractTokensFromPools(poolKeys: string[]): string[] {
  const tokens = new Set<string>()

  for (const poolKey of poolKeys) {
    const [tokenA, tokenB] = poolKey.split('/')
    if (tokenA) tokens.add(tokenA)
    if (tokenB) tokens.add(tokenB)
  }

  return Array.from(tokens)
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

export const tokenRouter = createTRPCRouter({
  // Get all tokens that have signed pools
  all: procedure.query(async ({ ctx }) => {
    try {
      // Fetch all signed pools from the contract
      const response = await fetchFromPoolManager(['get_signed_pools()'])
      const poolKeys: string[] = response.calls['get_signed_pools()'].value || []

      // Extract unique tokens from pool keys
      const tokenUuids = extractTokensFromPools(poolKeys)

      // Build token data for each token
      const tokenPromises = tokenUuids.map(async (uuid) => ({
        id: uuid,
        uuid: uuid,
        symbol: await getTokenSymbol(uuid),
        name: await getTokenName(uuid),
        decimals: 2,
        chainId: 1,
        custom: false,
        imageUrl: null, // Will be null until added to contract
        about: null, // Will be null until added to contract
        telegram: null, // Will be null until added to contract
        twitter: null, // Will be null until added to contract
        website: null, // Will be null until added to contract
        createdBy: null, // Will be null until added to contract
        bridged: isBridgedToken(uuid),
        sourceChain: isBridgedToken(uuid) ? 'unknown' : null,
        targetChain: isBridgedToken(uuid) ? 'hathor' : null,
        originalAddress: getBridgedTokenOriginalAddress(uuid),
        // Add pool information for each token
        pools0: [], // Will be populated by frontend if needed
        pools1: [], // Will be populated by frontend if needed
      }))

      const tokens = await Promise.all(tokenPromises)

      return tokens
    } catch (error) {
      console.error('Error fetching tokens:', error)
      throw new Error('Failed to fetch tokens from contract')
    }
  }),

  // Get token by symbol
  bySymbol: procedure.input(z.object({ symbol: z.string().max(8).min(1) })).query(async ({ input }) => {
    try {
      // For HTR, return immediately
      if (input.symbol.toLowerCase() === 'htr') {
        return { uuid: '00' }
      }

      // Fetch all signed pools to find tokens
      const response = await fetchFromPoolManager(['get_signed_pools()'])
      const poolKeys: string[] = response.calls['get_signed_pools()'].value || []
      const tokenUuids = extractTokensFromPools(poolKeys)

      // Find token by symbol (simplified matching)
      // Find matching token by checking symbols
      let matchingToken: string | undefined
      for (const uuid of tokenUuids) {
        const symbol = await getTokenSymbol(uuid)
        if (symbol.toLowerCase() === input.symbol.toLowerCase()) {
          matchingToken = uuid
          break
        }
      }

      if (matchingToken) {
        return { uuid: matchingToken }
      }

      return null
    } catch (error) {
      console.error(`Error fetching token by symbol ${input.symbol}:`, error)
      return null
    }
  }),

  // Get token by UUID
  byUuid: procedure.input(z.object({ uuid: z.string() })).query(async ({ input }) => {
    try {
      // Check if this token exists in any signed pool
      const response = await fetchFromPoolManager(['get_signed_pools()'])
      const poolKeys: string[] = response.calls['get_signed_pools()'].value || []
      const tokenUuids = extractTokensFromPools(poolKeys)

      if (!tokenUuids.includes(input.uuid)) {
        return null
      }

      return {
        id: input.uuid,
        uuid: input.uuid,
        symbol: await getTokenSymbol(input.uuid),
        name: await getTokenName(input.uuid),
        decimals: 2,
        chainId: 1,
        custom: false,
        imageUrl: null,
        about: null,
        telegram: null,
        twitter: null,
        website: null,
        createdBy: null,
        bridged: isBridgedToken(input.uuid),
        sourceChain: isBridgedToken(input.uuid) ? 'unknown' : null,
        targetChain: isBridgedToken(input.uuid) ? 'hathor' : null,
        originalAddress: getBridgedTokenOriginalAddress(input.uuid),
      }
    } catch (error) {
      console.error(`Error fetching token by UUID ${input.uuid}:`, error)
      return null
    }
  }),

  // Get comprehensive token data by symbol (for token detail page)
  bySymbolDetailed: procedure.input(z.object({ symbol: z.string().max(8).min(1) })).query(async ({ input }) => {
    try {
      console.log(`🔍 [TOKEN_BY_SYMBOL_DETAILED] Looking for token with symbol: ${input.symbol}`)

      // Find token UUID by symbol
      let tokenUuid: string | undefined
      if (input.symbol.toLowerCase() === 'htr') {
        tokenUuid = '00'
      } else {
        // Fetch all signed pools to find tokens
        const response = await fetchFromPoolManager(['get_signed_pools()'])
        const poolKeys: string[] = response.calls['get_signed_pools()'].value || []
        const tokenUuids = extractTokensFromPools(poolKeys)

        // Find matching token by checking symbols
        for (const uuid of tokenUuids) {
          const symbol = await getTokenSymbol(uuid)
          if (symbol.toLowerCase() === input.symbol.toLowerCase()) {
            tokenUuid = uuid
            break
          }
        }
      }

      if (!tokenUuid) {
        throw new Error(`Token with symbol ${input.symbol} not found`)
      }

      // Get token basic info
      const tokenInfo = await fetchTokenInfo(tokenUuid)

      // Get pools for this token and token prices
      const batchResponse = await fetchFromPoolManager([
        `get_pools_for_token("${tokenUuid}")`,
        'get_all_token_prices_in_usd()',
        'get_signed_pools()',
      ])

      const allTokenPools: string[] = batchResponse.calls[`get_pools_for_token("${tokenUuid}")`].value || []
      const rawTokenPrices: Record<string, number> = batchResponse.calls['get_all_token_prices_in_usd()'].value || {}
      // Format token prices from contract units to USD (divide by PRICE_PRECISION)
      const tokenPrices: Record<string, number> = Object.fromEntries(
        Object.entries(rawTokenPrices).map(([k, v]) => [k, formatPrice(v as number)])
      )
      const allSignedPools: string[] = batchResponse.calls['get_signed_pools()'].value || []

      // Filter to only include pools that are both token-related AND signed
      const tokenPools = allTokenPools.filter((poolKey) => allSignedPools.includes(poolKey))

      console.log(
        `   📊 Found ${allTokenPools.length} total pools for token ${input.symbol}, ${tokenPools.length} signed pools`
      )

      // Get detailed pool data for token's pools
      let totalLiquidityUSD = 0
      let totalVolumeUSD = 0
      let totalFeesUSD = 0
      const pools = []

      if (tokenPools.length > 0) {
        // Batch fetch all pool data using front_end_api_pool
        const poolDataCalls = tokenPools.map((poolKey) => `front_end_api_pool("${poolKey}")`)
        const poolDataResponse = await fetchFromPoolManager(poolDataCalls)

        for (const poolKey of tokenPools) {
          try {
            const poolDataArray = poolDataResponse.calls[`front_end_api_pool("${poolKey}")`]?.value

            if (!poolDataArray) {
              console.warn(`⚠️  No data found for pool ${poolKey}`)
              continue
            }

            // Parse the NamedTuple array to an object with proper property names
            const poolData = parsePoolApiInfo(poolDataArray)

            // Parse pool key to get tokens and fee
            const [tokenA, tokenB, feeStr] = poolKey.split('/')
            const swapFee = parseInt(feeStr || '0') / 10 // Convert fee format to percentage (fee_numerator/fee_denominator*100 = x/1000*100 = x/10)

            // Get token metadata for both tokens
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
            const { volume24h, volume24hUSD } = await calculate24hVolume(poolKey)
            const volume1d = volume24h
            const volumeUSD = volume24hUSD

            // Calculate 24h fees using volume * fee rate
            const { fees24h, fees24hUSD } = await calculate24hFees(poolKey, volume24hUSD)
            const feeUSD = fees24hUSD

            // Calculate 24h transaction count using delta approach
            const txCount1d = await calculate24hTransactionCount(poolKey)

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

            const poolDetails = {
              id: poolKey,
              symbolId,
              name: `${token0Info.symbol}-${token1Info.symbol}`,
              liquidityUSD,
              volumeUSD,
              feeUSD,
              txCount1d,
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
            }

            pools.push(poolDetails)

            // Aggregate totals
            totalLiquidityUSD += liquidityUSD
            totalVolumeUSD += volumeUSD
            totalFeesUSD += feeUSD

            console.log(
              `   ✅ Processed pool ${poolKey}: ${token0Info.symbol}-${token1Info.symbol}, TVL: $${liquidityUSD.toFixed(
                2
              )}`
            )
          } catch (error) {
            console.error(`❌ Error processing pool ${poolKey}:`, error)
          }
        }
      }

      // Get total supply
      let totalSupply = 0
      try {
        const endpoint = 'thin_wallet/token'
        const queryParams = [`id=${tokenUuid}`]
        const tokenData = await fetchNodeData(endpoint, queryParams)
        totalSupply = (tokenData.total || 0) / 100
      } catch (error) {
        console.error(`Error fetching total supply for token ${tokenUuid}:`, error)
      }

      // Get current price
      const currentPriceUSD = tokenPrices[tokenUuid] || 0
      const marketCap = totalSupply * currentPriceUSD

      console.log(`🎉 [TOKEN_BY_SYMBOL_DETAILED] Successfully processed token ${input.symbol}:`)
      console.log(`   💰 Total TVL: $${totalLiquidityUSD.toFixed(2)}`)
      console.log(`   📊 Total Pools: ${pools.length}`)
      console.log(`   💲 Price: $${currentPriceUSD.toFixed(4)}`)
      console.log(`   🏦 Market Cap: $${marketCap.toFixed(2)}`)

      return {
        // Basic token info
        uuid: tokenUuid,
        symbol: tokenInfo.symbol,
        name: tokenInfo.name,
        decimals: 2,
        chainId: 1,

        // Token metrics
        totalSupply,
        priceUSD: currentPriceUSD,
        marketCap,

        // Aggregated pool data
        totalLiquidityUSD,
        totalVolumeUSD,
        totalFeesUSD,
        poolCount: pools.length,

        // Related pools
        pools: pools.sort((a, b) => b.liquidityUSD - a.liquidityUSD), // Sort by TVL descending

        // Additional metadata
        bridged: isBridgedToken(tokenUuid),
        sourceChain: isBridgedToken(tokenUuid) ? 'unknown' : null,
        targetChain: isBridgedToken(tokenUuid) ? 'hathor' : null,
        originalAddress: getBridgedTokenOriginalAddress(tokenUuid),
      }
    } catch (error) {
      console.error(`❌ [TOKEN_BY_SYMBOL_DETAILED] Error fetching detailed token data for ${input.symbol}:`, error)
      throw new Error(`Failed to fetch detailed token data: ${error}`)
    }
  }),

  // Get total supply for a token
  totalSupply: procedure.input(z.string()).query(async ({ input }) => {
    try {
      const endpoint = 'thin_wallet/token'
      const queryParams = [`id=${input}`]
      const rawTokenData = await fetchNodeData(endpoint, queryParams)
      return rawTokenData.total || 0
    } catch (error) {
      console.error(`Error fetching total supply for token ${input}:`, error)
      return 0
    }
  }),

  // Get all token total supplies (for tokens with signed pools)
  allTotalSupply: procedure.query(async ({ ctx }) => {
    try {
      // Fetch all signed pools to get token list
      const response = await fetchFromPoolManager(['get_signed_pools()'])
      const poolKeys: string[] = response.calls['get_signed_pools()'].value || []
      const tokenUuids = extractTokensFromPools(poolKeys)

      const totalSupplies: Record<string, number> = {}

      // Fetch total supply for each token
      await Promise.all(
        tokenUuids.map(async (uuid) => {
          try {
            const endpoint = 'thin_wallet/token'
            const queryParams = [`id=${uuid}`]
            const rawTokenData = await fetchNodeData(endpoint, queryParams)
            totalSupplies[uuid] = (rawTokenData.total || 0) / 100
          } catch (error) {
            console.error(`Error fetching total supply for token ${uuid}:`, error)
            totalSupplies[uuid] = 0
          }
        })
      )

      return totalSupplies
    } catch (error) {
      console.error('Error fetching all token total supplies:', error)
      return {}
    }
  }),

  // Get token prices in USD
  prices: procedure.query(async ({ ctx }) => {
    try {
      const response = await fetchFromPoolManager(['get_all_token_prices_in_usd()'])
      const prices = response.calls['get_all_token_prices_in_usd()'].value || {}

      return prices
    } catch (error) {
      console.error('Error fetching token prices:', error)
      return {}
    }
  }),

  // Get token prices in HTR
  pricesHTR: procedure.query(async ({ ctx }) => {
    try {
      const response = await fetchFromPoolManager(['get_all_token_prices_in_htr()'])
      const prices = response.calls['get_all_token_prices_in_htr()'].value || {}

      return prices
    } catch (error) {
      console.error('Error fetching token prices in HTR:', error)
      return {}
    }
  }),

  // Get specific token price in USD
  priceUSD: procedure.input(z.object({ tokenUid: z.string() })).query(async ({ input }) => {
    try {
      const response = await fetchFromPoolManager([`get_token_price_in_usd("${input.tokenUid}")`])
      const price = response.calls[`get_token_price_in_usd("${input.tokenUid}")`].value || 0

      return price
    } catch (error) {
      console.error(`Error fetching USD price for token ${input.tokenUid}:`, error)
      return 0
    }
  }),

  // Get specific token price in HTR
  priceHTR: procedure.input(z.object({ tokenUid: z.string() })).query(async ({ input }) => {
    try {
      const response = await fetchFromPoolManager([`get_token_price_in_htr("${input.tokenUid}")`])
      const price = response.calls[`get_token_price_in_htr("${input.tokenUid}")`].value || 0

      return price
    } catch (error) {
      console.error(`Error fetching HTR price for token ${input.tokenUid}:`, error)
      return 0
    }
  }),

  // Get pools for a specific token
  poolsForToken: procedure.input(z.object({ tokenUid: z.string() })).query(async ({ input }) => {
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
      return []
    }
  }),

  // Create custom token (placeholder - would need to be implemented with contract support)
  createCustom: procedure
    .input(
      z.object({
        name: z.string(),
        symbol: z.string(),
        chainId: z.number(),
        decimals: z.number(),
        description: z.string(),
        imageUrl: z.string(),
        telegram: z.string().optional(),
        twitter: z.string().optional(),
        website: z.string().optional(),
        createdBy: z.string(),
        totalSupply: z.number(),
        hash: z.string(),
        bridged: z.boolean().optional(),
        sourceChain: z.string().optional(),
        targetChain: z.string().optional(),
        originalAddress: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // For now, this is a placeholder
      // In the future, this would need to create a token on the blockchain
      // and possibly store metadata in the contract
      throw new Error('Custom token creation not yet implemented with contract-based approach')
    }),

  // Get token statistics
  stats: procedure.input(z.object({ tokenUid: z.string() })).query(async ({ input }) => {
    try {
      // Get pools for this token
      const poolsResponse = await fetchFromPoolManager([`get_pools_for_token("${input.tokenUid}")`])
      const poolKeys: string[] = poolsResponse.calls[`get_pools_for_token("${input.tokenUid}")`].value || []

      // Get total supply
      const endpoint = 'thin_wallet/token'
      const queryParams = [`id=${input.tokenUid}`]
      const tokenData = await fetchNodeData(endpoint, queryParams)
      const totalSupply = (tokenData.total || 0) / 100

      // Get price in USD
      const priceResponse = await fetchFromPoolManager([`get_token_price_in_usd("${input.tokenUid}")`])
      const priceUSD = priceResponse.calls[`get_token_price_in_usd("${input.tokenUid}")`].value || 0

      return {
        tokenUid: input.tokenUid,
        symbol: getTokenSymbol(input.tokenUid),
        name: getTokenName(input.tokenUid),
        totalSupply,
        priceUSD,
        marketCap: totalSupply * priceUSD,
        poolCount: poolKeys.length,
        pools: poolKeys,
      }
    } catch (error) {
      console.error(`Error fetching token stats for ${input.tokenUid}:`, error)
      return {
        tokenUid: input.tokenUid,
        symbol: getTokenSymbol(input.tokenUid),
        name: getTokenName(input.tokenUid),
        totalSupply: 0,
        priceUSD: 0,
        marketCap: 0,
        poolCount: 0,
        pools: [],
      }
    }
  }),
})
