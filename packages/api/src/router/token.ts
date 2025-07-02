import { z } from 'zod'

import { fetchNodeData } from '../helpers/fetchFunction'
import { createTRPCRouter, procedure } from '../trpc'

// Get the Pool Manager Contract ID from environment
const POOL_MANAGER_CONTRACT_ID = process.env.POOL_MANAGER_CONTRACT_ID

if (!POOL_MANAGER_CONTRACT_ID) {
  console.warn('POOL_MANAGER_CONTRACT_ID environment variable not set')
}

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
        bridged: uuid !== '00', // Assume all non-HTR tokens are bridged for now
        sourceChain: uuid !== '00' ? 'unknown' : null,
        targetChain: uuid !== '00' ? 'hathor' : null,
        originalAddress: null, // Will be null until added to contract
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
        bridged: input.uuid !== '00',
        sourceChain: input.uuid !== '00' ? 'unknown' : null,
        targetChain: input.uuid !== '00' ? 'hathor' : null,
        originalAddress: null,
      }
    } catch (error) {
      console.error(`Error fetching token by UUID ${input.uuid}:`, error)
      return null
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
