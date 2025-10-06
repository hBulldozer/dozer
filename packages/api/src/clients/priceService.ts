const MAX_RETRIES = 3
const INITIAL_TIMEOUT = 5000 // 5 seconds
const BACKOFF_FACTOR = 2
const SUMMARY_TIMEOUT = 10000 // 10 seconds for summary endpoint (can have more data)

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

// Pool volume data point - matches FastAPI PoolVolumeData model
export interface PoolVolumeDataPoint {
  pool_key: string
  timestamp: string // ISO datetime string from API
  volume_a: number
  volume_b: number
  volume_usd: number
  volume_htr: number
  transactions: number
  interval: string
}

// The API returns List[PoolVolumeData] directly, not wrapped
export type PoolVolumeHistoryResponse = PoolVolumeDataPoint[]

// Pool TVL data point - matches FastAPI PoolTVLData model
export interface PoolTVLDataPoint {
  pool_key: string
  timestamp: string // ISO datetime string from API
  reserve_a: number
  reserve_b: number
  tvl_usd: number
  tvl_htr: number
  price_a_usd: number
  price_b_usd: number
  interval: string
}

// The TVL endpoint returns wrapped response
export interface PoolTVLHistoryResponse {
  pool_key: string
  interval: string
  data: PoolTVLDataPoint[]
  total: number
}

// Pool APR data point - matches FastAPI APR endpoint response
export interface PoolAPRDataPoint {
  pool_key: string
  timestamp: string // ISO datetime string from API
  apr: number
  tvl_usd: number
  daily_volume_usd: number
  fee_rate: number
  interval: string
}

// The APR endpoint returns wrapped response
export interface PoolAPRHistoryResponse {
  pool_key: string
  interval: string
  data: PoolAPRDataPoint[]
  total: number
}

export interface TokenSummaryData {
  current_price: number
  change_24h: number
  mini_chart: Array<{ timestamp: string; price: number }>
}

export type TokensSummaryResponse = Record<string, TokenSummaryData>

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
   * Get pool volume history
   * Returns array of volume data points directly from API
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

    // Pool key is now a query parameter (not URL encoded path parameter)
    queryParams.set('pool_key', poolKey)
    if (params.interval) queryParams.set('interval', params.interval)
    if (params.from_time) queryParams.set('from_time', params.from_time)
    if (params.to_time) queryParams.set('to_time', params.to_time)
    if (params.limit) queryParams.set('limit', params.limit.toString())

    const queryString = queryParams.toString()
    const url = `${this.baseUrl}/pools/volume?${queryString}`

    return (await fetchWithRetry(url, MAX_RETRIES, INITIAL_TIMEOUT)) as PoolVolumeHistoryResponse
  }

  /**
   * Get pool TVL history
   * Returns wrapped response with pool_key, interval, data array, and total
   */
  async getPoolTVLHistory(
    poolKey: string,
    params: {
      interval?: '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w'
      limit?: number
    } = {}
  ): Promise<PoolTVLHistoryResponse> {
    const queryParams = new URLSearchParams()

    // Pool key is a query parameter
    queryParams.set('pool_key', poolKey)
    if (params.interval) queryParams.set('interval', params.interval)
    if (params.limit) queryParams.set('limit', params.limit.toString())

    const queryString = queryParams.toString()
    const url = `${this.baseUrl}/pools/tvl?${queryString}`

    return (await fetchWithRetry(url, MAX_RETRIES, INITIAL_TIMEOUT)) as PoolTVLHistoryResponse
  }

  /**
   * Get pool APR history
   * Returns wrapped response with pool_key, interval, data array, and total
   */
  async getPoolAPRHistory(
    poolKey: string,
    params: {
      interval?: '1h' | '4h' | '1d'
      limit?: number
    } = {}
  ): Promise<PoolAPRHistoryResponse> {
    const queryParams = new URLSearchParams()

    // Pool key is a query parameter
    queryParams.set('pool_key', poolKey)
    if (params.interval) queryParams.set('interval', params.interval)
    if (params.limit) queryParams.set('limit', params.limit.toString())

    const queryString = queryParams.toString()
    const url = `${this.baseUrl}/pools/apr?${queryString}`

    return (await fetchWithRetry(url, MAX_RETRIES, INITIAL_TIMEOUT)) as PoolAPRHistoryResponse
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

  /**
   * Get tokens summary with price, 24h change, and mini charts
   */
  async getTokensSummary(
    params: {
      currency?: 'USD' | 'HTR'
      mini_chart_points?: number
    } = {}
  ): Promise<TokensSummaryResponse> {
    const queryParams = new URLSearchParams()

    if (params.currency) queryParams.set('currency', params.currency)
    if (params.mini_chart_points) queryParams.set('mini_chart_points', params.mini_chart_points.toString())

    const queryString = queryParams.toString()
    const url = `${this.baseUrl}/swap/tokens/summary${queryString ? `?${queryString}` : ''}`

    // Use longer timeout for summary endpoint (has more data to process)
    // Only retry once to fail faster if service is down
    return (await fetchWithRetry(url, 1, SUMMARY_TIMEOUT)) as TokensSummaryResponse
  }
}

// Export a default instance
export const priceServiceClient = new PriceServiceClient()

// Export error class for error handling
export { PriceServiceError }
