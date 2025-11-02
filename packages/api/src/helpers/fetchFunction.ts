import { fetchFakeData } from './fetchFakeData'

const MAX_RETRIES = 3
const INITIAL_TIMEOUT = 5000 // 5 seconds
const BACKOFF_FACTOR = 2

async function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

async function fetchWithRetry(url: string, retries: number, timeout: number): Promise<any> {
  try {
    const response = await fetchWithTimeout(url, timeout)
    return await response.json()
  } catch (error) {
    if (retries > 0) {
      const nextTimeout = timeout * BACKOFF_FACTOR
      await new Promise((resolve) => setTimeout(resolve, nextTimeout))
      return await fetchWithRetry(url, retries - 1, nextTimeout)
    }
    throw error
  }
}

export async function fetchNodeData(endpoint: string, queryParams: string[]): Promise<any> {
  if (!process.env.NEXT_PUBLIC_LOCAL_NODE_URL && !process.env.NEXT_PUBLIC_PUBLIC_NODE_URL) {
    return fetchFakeData(endpoint, queryParams)
  }

  try {
    const localNodeUrl = `${process.env.NEXT_PUBLIC_LOCAL_NODE_URL}${endpoint}?${queryParams.join('&')}`
    if (localNodeUrl) {
      try {
        return await fetchWithRetry(localNodeUrl, MAX_RETRIES, INITIAL_TIMEOUT)
      } catch {
        const publicNodeUrl = `${process.env.NEXT_PUBLIC_PUBLIC_NODE_URL}${endpoint}?${queryParams.join('&')}`
        if (publicNodeUrl) {
          return await fetchWithRetry(publicNodeUrl, MAX_RETRIES, INITIAL_TIMEOUT)
        }
        throw new Error('Failed to fetch data from both local and public nodes')
      }
    }
  } catch (error: any) {
    throw new Error('Error fetching data to ' + endpoint + 'with params ' + queryParams + ': ' + error.message)
  }
}

/**
 * Fetch historical time-series data from the history_optimized endpoint.
 * This endpoint provides optimized data for chart visualization.
 *
 * @param contractId - The nano contract ID in hex
 * @param startTimestamp - Start of time range in seconds
 * @param endTimestamp - End of time range in seconds
 * @param resolution - Sampling resolution ('5m', '15m', '1h', '1d')
 * @param options - Optional parameters (calls, fields, balances)
 * @returns Historical data points with timestamps and values
 *
 * @example
 * ```ts
 * const data = await fetchHistoricalData(
 *   poolManagerId,
 *   dayAgo,
 *   now,
 *   '5m',
 *   { calls: ['get_pool_info(00/token...)'] }
 * )
 * ```
 */
export async function fetchHistoricalData(
  contractId: string,
  startTimestamp: number,
  endTimestamp: number,
  resolution: '5m' | '15m' | '1h' | '1d' | 'block',
  options?: {
    calls?: string[]
    fields?: string[]
    balances?: string[]
  }
): Promise<{
  success: boolean
  resolution: string
  start_timestamp: number
  end_timestamp: number
  data_points: Array<{
    timestamp: number
    block_height: number
    block_hash: string
    values: Record<string, any>
  }>
  total_points: number
  errors?: Array<{ timestamp: number; error: string }>
}> {
  const endpoint = 'nano_contract/history_optimized'
  const queryParams = [
    `id=${contractId}`,
    `start_timestamp=${startTimestamp}`,
    `end_timestamp=${endTimestamp}`,
    `resolution=${resolution}`,
  ]

  // Add optional parameters
  if (options?.calls) {
    options.calls.forEach((call) => queryParams.push(`calls[]=${encodeURIComponent(call)}`))
  }
  if (options?.fields) {
    options.fields.forEach((field) => queryParams.push(`fields[]=${encodeURIComponent(field)}`))
  }
  if (options?.balances) {
    options.balances.forEach((balance) => queryParams.push(`balances[]=${encodeURIComponent(balance)}`))
  }

  return await fetchNodeData(endpoint, queryParams)
}
