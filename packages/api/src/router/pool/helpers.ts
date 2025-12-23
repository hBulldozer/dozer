import { fetchNodeData } from '../../helpers/fetchFunction'
import { formatPrice } from '../constants'
import { parsePoolApiInfo } from '../../utils/namedTupleParsers'

// Get the Pool Manager Contract ID from environment
export const NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID = process.env.NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID

// Get the DozerTools Contract ID from environment
const NEXT_PUBLIC_DOZER_TOOLS_CONTRACT_ID = process.env.NEXT_PUBLIC_DOZER_TOOLS_CONTRACT_ID
const NEXT_PUBLIC_DOZER_TOOLS_VERCEL_BLOB_URL = process.env.NEXT_PUBLIC_DOZER_TOOLS_VERCEL_BLOB_URL

// Cache for token information to avoid repeated API calls
const tokenInfoCache = new Map<string, { symbol: string; name: string }>()

if (!NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID) {
  console.warn('NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID environment variable not set')
}

// Helper function to fetch DozerTools image URL for a token
export async function getDozerToolsImageUrl(tokenUuid: string): Promise<string | null> {
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
  } catch {
    // Silently fail for DozerTools integration - it's optional
    return null
  }
}

// Helper function to fetch data from the pool manager contract
export async function fetchFromPoolManager(calls: string[], timestamp?: number): Promise<any> {
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

// Helper function to calculate 24h transaction count using delta approach
export async function calculate24hTransactionCount(poolKey: string): Promise<number> {
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
    } catch {
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

// Helper function to calculate 24h volume using delta approach
export async function calculate24hVolume(poolKey: string): Promise<{ volume24h: number; volume24hUSD: number }> {
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
    } catch {
      // If historical data is not available (common in development), assume 0
      console.warn(`Historical data unavailable for pool ${poolKey} at ${oneDayAgo}, assuming 0 historical volume`)
      historicalVolume = 0
    }

    // Calculate 24h volume delta
    const volume24h = Math.max(0, currentVolume - historicalVolume)

    // Get token prices for USD calculation
    const [tokenA] = poolKey.split('/')
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
export async function calculate24hFees(
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

// Helper function to enrich pool with 24h metrics (volume, fees, txCount)
export async function enrichPoolWith24hMetrics(poolKey: string) {
  const { volume24h, volume24hUSD } = await calculate24hVolume(poolKey)
  const { fees24h, fees24hUSD } = await calculate24hFees(poolKey, volume24hUSD)
  const txCount1d = await calculate24hTransactionCount(poolKey)

  return {
    volume24h,
    volume24hUSD,
    fees24h,
    fees24hUSD,
    txCount1d,
  }
}

// Helper function to extract tokens from pool keys
export function extractTokensFromPools(poolKeys: string[]): string[] {
  const tokens = new Set<string>()

  for (const poolKey of poolKeys) {
    const [tokenA, tokenB] = poolKey.split('/')
    if (tokenA) tokens.add(tokenA)
    if (tokenB) tokens.add(tokenB)
  }

  return Array.from(tokens)
}

// Helper function to fetch token information from Hathor node
export async function fetchTokenInfo(tokenUuid: string): Promise<{ symbol: string; name: string }> {
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
export async function getTokenSymbol(tokenUuid: string): Promise<string> {
  const tokenInfo = await fetchTokenInfo(tokenUuid)
  return tokenInfo.symbol
}

// Helper function to get token name from UUID (with caching)
export async function getTokenName(tokenUuid: string): Promise<string> {
  const tokenInfo = await fetchTokenInfo(tokenUuid)
  return tokenInfo.name
}
