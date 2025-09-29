const MAX_RETRIES = 3
const INITIAL_TIMEOUT = 5000 // 5 seconds
const BACKOFF_FACTOR = 2

// Get Price Service URL from environment variables
const PRICE_SERVICE_URL = process.env.PRICE_SERVICE_URL || 'http://localhost:8000'

export interface OHLCDataPoint {
  token_uid: string
  timestamp: string // ISO datetime string from the API
  open: number
  high: number
  low: number
  close: number
  volume: number
  interval: string
}

// The price service returns List[OHLCData] directly, not wrapped in a response object
export type PriceHistoryResponse = OHLCDataPoint[]

export interface TokenPriceResponse {
  token_uid: string
  price_usd: number
  price_htr: number
  last_updated: string
}

export interface PoolVolumeHistoryResponse {
  pool_key: string
  interval: string
  data: Array<{
    timestamp: number
    volume_usd: number
    volume_token_a: number
    volume_token_b: number
    transactions: number
  }>
}

export interface PoolTVLHistoryResponse {
  pool_key: string
  interval: string
  data: Array<{
    timestamp: number
    tvl_usd: number
    reserve_a: number
    reserve_b: number
  }>
}

class PriceServiceError extends Error {
  constructor(message: string, public status?: number, public endpoint?: string) {
    super(message)
    this.name = 'PriceServiceError'
  }
}

async function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

async function fetchWithRetry(url: string, retries: number, timeout: number): Promise<unknown> {
  try {
    const response = await fetchWithTimeout(url, timeout)

    if (!response.ok) {
      throw new PriceServiceError(
        `Price service request failed: ${response.status} ${response.statusText}`,
        response.status,
        url
      )
    }

    return await response.json()
  } catch (error) {
    if (retries > 0 && !(error instanceof PriceServiceError && error.status === 404)) {
      // Don't retry 404 errors
      const nextTimeout = timeout * BACKOFF_FACTOR
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait 1 second before retry
      return await fetchWithRetry(url, retries - 1, nextTimeout)
    }
    throw error
  }
}

export class PriceServiceClient {
  private baseUrl: string

  constructor(baseUrl: string = PRICE_SERVICE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '') // Remove trailing slash
  }

  /**
   * Get current price for a specific token
   */
  async getTokenPrice(tokenUid: string): Promise<TokenPriceResponse> {
    const url = `${this.baseUrl}/prices/${tokenUid}`
    return (await fetchWithRetry(url, MAX_RETRIES, INITIAL_TIMEOUT)) as unknown as TokenPriceResponse
  }

  /**
   * Get current prices for all tokens
   */
  async getAllTokenPrices(): Promise<TokenPriceResponse[]> {
    const url = `${this.baseUrl}/prices`
    return (await fetchWithRetry(url, MAX_RETRIES, INITIAL_TIMEOUT)) as unknown as TokenPriceResponse[]
  }

  /**
   * Get OHLC price history for a token
   */
  async getTokenPriceHistory(
    tokenUid: string,
    params: {
      interval?: '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w'
      from_time?: string // ISO format
      to_time?: string // ISO format
      limit?: number
    } = {}
  ): Promise<PriceHistoryResponse> {
    const queryParams = new URLSearchParams()

    if (params.interval) queryParams.set('interval', params.interval)
    if (params.from_time) queryParams.set('from_time', params.from_time)
    if (params.to_time) queryParams.set('to_time', params.to_time)
    if (params.limit) queryParams.set('limit', params.limit.toString())

    const queryString = queryParams.toString()
    const url = `${this.baseUrl}/prices/${tokenUid}/history${queryString ? `?${queryString}` : ''}`

    return (await fetchWithRetry(url, MAX_RETRIES, INITIAL_TIMEOUT)) as PriceHistoryResponse
  }

  /**
   * Get pool volume history (if supported by price service)
   */
  async getPoolVolumeHistory(
    poolKey: string,
    params: {
      interval?: '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w'
      from_time?: string
      to_time?: string
      limit?: number
    } = {}
  ): Promise<PoolVolumeHistoryResponse> {
    const queryParams = new URLSearchParams()

    if (params.interval) queryParams.set('interval', params.interval)
    if (params.from_time) queryParams.set('from_time', params.from_time)
    if (params.to_time) queryParams.set('to_time', params.to_time)
    if (params.limit) queryParams.set('limit', params.limit.toString())

    const queryString = queryParams.toString()
    const encodedPoolKey = encodeURIComponent(poolKey)
    const url = `${this.baseUrl}/pools/${encodedPoolKey}/volume${queryString ? `?${queryString}` : ''}`

    return (await fetchWithRetry(url, MAX_RETRIES, INITIAL_TIMEOUT)) as PoolVolumeHistoryResponse
  }

  /**
   * Get pool TVL history (not supported by price service yet)
   * This endpoint doesn't exist in the current price service API
   */
  async getPoolTVLHistory(
    _poolKey: string,
    _params: {
      interval?: '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w'
      from_time?: string
      to_time?: string
      limit?: number
    } = {}
  ): Promise<PoolTVLHistoryResponse> {
    // TVL history is not available in the current price service
    // Return empty data structure to indicate this feature is not available
    throw new PriceServiceError('Pool TVL history is not available in the current price service version')
  }

  /**
   * Check if price service is healthy
   */
  async healthCheck(): Promise<{ status: string; redis: boolean; database: boolean; hathor: boolean }> {
    const url = `${this.baseUrl}/health`
    return (await fetchWithRetry(url, MAX_RETRIES, INITIAL_TIMEOUT)) as {
      status: string
      redis: boolean
      database: boolean
      hathor: boolean
    }
  }

  /**
   * Get service statistics
   */
  async getStats(): Promise<unknown> {
    const url = `${this.baseUrl}/stats`
    return (await fetchWithRetry(url, MAX_RETRIES, INITIAL_TIMEOUT)) as unknown
  }
}

// Export a default instance
export const priceServiceClient = new PriceServiceClient()

// Export error class for error handling
export { PriceServiceError }
