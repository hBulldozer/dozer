import { fetchNodeData } from '../../helpers/fetchFunction'
import { formatPrice } from '../constants'
import { parsePoolApiInfo } from '../../utils/namedTupleParsers'

// Get the Pool Manager Contract ID from environment
export const NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID = process.env.NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID

// Get the DozerTools Contract ID from environment
const NEXT_PUBLIC_DOZER_TOOLS_CONTRACT_ID = process.env.NEXT_PUBLIC_DOZER_TOOLS_CONTRACT_ID
const NEXT_PUBLIC_DOZER_TOOLS_VERCEL_BLOB_URL = process.env.NEXT_PUBLIC_DOZER_TOOLS_VERCEL_BLOB_URL
const NEXT_PUBLIC_KHENSU_MANAGER_CONTRACT_ID = process.env.NEXT_PUBLIC_KHENSU_MANAGER_CONTRACT_ID
const NEXT_PUBLIC_PINATA_GATEWAY_URL = process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs'

// Cache for token information to avoid repeated API calls
const tokenInfoCache = new Map<string, { symbol: string; name: string }>()
const tokenMetadataCache = new Map<string, { expiresAt: number; promise: Promise<TokenDisplayMetadata> }>()
const poolManagerResponseCache = new Map<string, { expiresAt: number; promise: Promise<any> }>()

const LIVE_POOL_MANAGER_TTL_MS = 5_000
const HISTORICAL_POOL_MANAGER_TTL_MS = 24 * 60 * 60 * 1000
const TOKEN_METADATA_TTL_MS = 60 * 1000

export interface TokenDisplayMetadata {
  imageUrl: string | null
  about: string | null
  telegram: string | null
  twitter: string | null
  website: string | null
  createdBy: string | null
  communityTag: string | null
  metadataSource: 'khensu' | 'dozer-tools' | null
}

if (!NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID) {
  console.warn('NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID environment variable not set')
}

function prunePoolManagerResponseCache(now: number) {
  if (poolManagerResponseCache.size < 500) return

  for (const [key, entry] of poolManagerResponseCache.entries()) {
    if (entry.expiresAt <= now) {
      poolManagerResponseCache.delete(key)
    }
  }
}

// Fetch full metadata from the DozerTools contract for a token
async function getDozerToolsMetadata(tokenUuid: string): Promise<TokenDisplayMetadata | null> {
  try {
    if (!NEXT_PUBLIC_DOZER_TOOLS_CONTRACT_ID) {
      return null
    }

    const endpoint = 'nano_contract/state'
    const queryParams = [`id=${NEXT_PUBLIC_DOZER_TOOLS_CONTRACT_ID}`, `calls[]=get_project_info("${tokenUuid}")`]

    const response = await fetchNodeData(endpoint, queryParams)
    const projectInfo = response.calls[`get_project_info("${tokenUuid}")`]?.value

    if (!projectInfo) {
      console.warn(`[DozerTools] No project info found for token ${tokenUuid} — token not registered in DozerTools contract`)
      return null
    }

    // Resolve image URL
    let imageUrl: string | null = null
    const logoUrl: string | null = projectInfo.logo_url || null
    if (logoUrl) {
      imageUrl = logoUrl.startsWith('http')
        ? logoUrl
        : NEXT_PUBLIC_DOZER_TOOLS_VERCEL_BLOB_URL
          ? `${NEXT_PUBLIC_DOZER_TOOLS_VERCEL_BLOB_URL}/${logoUrl}`
          : null
    } else if (NEXT_PUBLIC_DOZER_TOOLS_VERCEL_BLOB_URL) {
      // Pattern-based fallback: token-icons/{symbol}-{dev}
      const symbol: string | null = projectInfo.symbol || null
      const dev: string | null = projectInfo.dev || null
      if (symbol && dev) {
        imageUrl = `${NEXT_PUBLIC_DOZER_TOOLS_VERCEL_BLOB_URL}/token-icons/${symbol}-${dev}`
      }
    }

    return {
      imageUrl,
      about: (projectInfo.description as string) || null,
      telegram: (projectInfo.telegram as string) || null,
      twitter: (projectInfo.twitter as string) || null,
      website: (projectInfo.website as string) || null,
      createdBy: (projectInfo.dev as string) || null,
      communityTag: 'Tools',
      metadataSource: 'dozer-tools',
    }
  } catch (error) {
    console.warn(`[DozerTools] Failed to fetch metadata for token ${tokenUuid}:`, error)
    return null
  }
}

// Keep the old export for any direct callers that only need the image URL
export async function getDozerToolsImageUrl(tokenUuid: string): Promise<string | null> {
  const metadata = await getDozerToolsMetadata(tokenUuid)
  return metadata?.imageUrl ?? null
}

function convertIpfsToGatewayUrl(imageLink: string): string {
  const trimmedImageLink = imageLink.trim()

  if (trimmedImageLink.startsWith('ipfs://ipfs/')) {
    const hash = trimmedImageLink.replace('ipfs://ipfs/', '')
    const gatewayBaseUrl = NEXT_PUBLIC_PINATA_GATEWAY_URL.replace(/\/$/, '')
    return gatewayBaseUrl.endsWith('/ipfs') ? `${gatewayBaseUrl}/${hash}` : `${gatewayBaseUrl}/ipfs/${hash}`
  }

  if (trimmedImageLink.startsWith('ipfs://')) {
    const hash = trimmedImageLink.replace('ipfs://', '')
    const gatewayBaseUrl = NEXT_PUBLIC_PINATA_GATEWAY_URL.replace(/\/$/, '')
    return gatewayBaseUrl.endsWith('/ipfs') ? `${gatewayBaseUrl}/${hash}` : `${gatewayBaseUrl}/ipfs/${hash}`
  }

  return trimmedImageLink
}

async function fetchKhensuTokenMetadata(tokenUuid: string): Promise<TokenDisplayMetadata | null> {
  if (!NEXT_PUBLIC_KHENSU_MANAGER_CONTRACT_ID || tokenUuid === '00') {
    return null
  }

  try {
    const call = `get_token_info("${tokenUuid}")`
    const response = await fetchNodeData('nano_contract/state', [
      `id=${NEXT_PUBLIC_KHENSU_MANAGER_CONTRACT_ID}`,
      `calls[]=${call}`,
    ])
    const tokenInfo = response.calls?.[call]?.value

    if (!tokenInfo) {
      return null
    }

    // TokenInfo NamedTuple field order (contract: khensu_manager.py → TokenInfo):
    //   0: creator, 1: token_name, 2: token_symbol, 3: image_link,
    //   4: description, 5: twitter, 6: telegram, 7: website, ...
    // Hathor nodes may return NamedTuples as a plain array OR as a named object — handle both.
    let creator: string, imageLink: string, description: string,
        twitter: string, telegram: string, website: string

    if (Array.isArray(tokenInfo)) {
      if (tokenInfo.length < 8) return null
      creator     = typeof tokenInfo[0] === 'string' ? tokenInfo[0] : ''
      imageLink   = typeof tokenInfo[3] === 'string' ? tokenInfo[3] : ''
      description = typeof tokenInfo[4] === 'string' ? tokenInfo[4] : ''
      twitter     = typeof tokenInfo[5] === 'string' ? tokenInfo[5] : ''
      telegram    = typeof tokenInfo[6] === 'string' ? tokenInfo[6] : ''
      website     = typeof tokenInfo[7] === 'string' ? tokenInfo[7] : ''
    } else {
      // Object / named-key response
      creator     = typeof tokenInfo.creator     === 'string' ? tokenInfo.creator     : ''
      imageLink   = typeof tokenInfo.image_link  === 'string' ? tokenInfo.image_link  : ''
      description = typeof tokenInfo.description === 'string' ? tokenInfo.description : ''
      twitter     = typeof tokenInfo.twitter     === 'string' ? tokenInfo.twitter     : ''
      telegram    = typeof tokenInfo.telegram    === 'string' ? tokenInfo.telegram    : ''
      website     = typeof tokenInfo.website     === 'string' ? tokenInfo.website     : ''
    }

    return {
      imageUrl: imageLink ? convertIpfsToGatewayUrl(imageLink) : null,
      about: description || null,
      telegram: telegram || null,
      twitter: twitter || null,
      website: website || null,
      createdBy: creator || null,
      communityTag: 'Community',
      metadataSource: 'khensu',
    }
  } catch {
    return null
  }
}

export async function getTokenDisplayMetadata(tokenUuid: string): Promise<TokenDisplayMetadata> {
  const now = Date.now()
  const cachedEntry = tokenMetadataCache.get(tokenUuid)

  if (cachedEntry && cachedEntry.expiresAt > now) {
    return cachedEntry.promise
  }

  const promise = (async (): Promise<TokenDisplayMetadata> => {
    const khensuMetadata = await fetchKhensuTokenMetadata(tokenUuid)
    if (khensuMetadata) {
      return khensuMetadata
    }

    const dozerToolsMetadata = await getDozerToolsMetadata(tokenUuid)
    if (dozerToolsMetadata) {
      return dozerToolsMetadata
    }

    return {
      imageUrl: null,
      about: null,
      telegram: null,
      twitter: null,
      website: null,
      createdBy: null,
      communityTag: null,
      metadataSource: null,
    }
  })().catch((error) => {
    tokenMetadataCache.delete(tokenUuid)
    throw error
  })

  tokenMetadataCache.set(tokenUuid, {
    expiresAt: now + TOKEN_METADATA_TTL_MS,
    promise,
  })

  return promise
}

// Helper function to fetch data from the pool manager contract
export async function fetchFromPoolManager(calls: string[], timestamp?: number): Promise<any> {
  if (!NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID) {
    throw new Error('NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID environment variable not set')
  }

  const normalizedCalls = Array.from(new Set(calls)).sort()
  const cacheKey = JSON.stringify({
    timestamp: timestamp ?? 'live',
    calls: normalizedCalls,
  })
  const now = Date.now()
  prunePoolManagerResponseCache(now)
  const cachedEntry = poolManagerResponseCache.get(cacheKey)

  if (cachedEntry && cachedEntry.expiresAt > now) {
    return cachedEntry.promise
  }

  const endpoint = 'nano_contract/state'
  const queryParams = [
    `id=${NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID}`,
    ...normalizedCalls.map((call) => `calls[]=${call}`),
  ]

  if (timestamp !== undefined) {
    queryParams.push(`timestamp=${timestamp}`)
  }

  const promise = fetchNodeData(endpoint, queryParams).catch((error) => {
    poolManagerResponseCache.delete(cacheKey)
    throw error
  })

  poolManagerResponseCache.set(cacheKey, {
    expiresAt: now + (timestamp !== undefined ? HISTORICAL_POOL_MANAGER_TTL_MS : LIVE_POOL_MANAGER_TTL_MS),
    promise,
  })

  return await promise
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

    // Fee rate format: fee/1000 = decimal rate (e.g., fee=8 means 8/1000 = 0.008 = 0.8%)
    const feeRate = (currentPoolData.fee || 0) / 1000

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
