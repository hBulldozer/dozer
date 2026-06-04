import { fetchFakeData } from './fetchFakeData'

/** Thrown when the local node is unreachable for a historical state request
 *  and the caller has opted out of the public-node fallback. */
export class NodeUnavailableError extends Error {
  constructor() {
    super('Historical chart data temporarily unavailable — local node unreachable')
    this.name = 'NodeUnavailableError'
  }
}

// Check if running in local development environment
const isLocalDevelopment = process.env.NODE_ENV === 'development'

// Timeout / retry settings.
// No retries in either environment — retrying a timed-out node request just doubles the wait.
const MAX_RETRIES = 0
// 8s is enough for nginx-cached requests (~200ms) and uncached historical state queries
// (3-5s node computation + network). Old values: 3s dev (too short for cold cache),
// 25s prod (held queue slots too long on hung requests).
const INITIAL_TIMEOUT = 8000
const BACKOFF_FACTOR = 0

// Request queue — throttles concurrent node requests.
//
// Production (maxConcurrency=10): most chart requests hit the nginx cache (~200ms) so
// high concurrency is safe and improves throughput.
//
// Development (maxConcurrency=5): the local node computes historical state without nginx
// caching on first load. 10 simultaneous state computations stress the node, pushing
// individual request times above the timeout. 5 keeps the node comfortable.
class RequestQueue {
  private queue: Array<() => Promise<any>> = []
  private activeCount = 0
  private maxConcurrency = isLocalDevelopment ? 5 : 10

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      this.process()
    })
  }

  private async process() {
    if (this.activeCount >= this.maxConcurrency || this.queue.length === 0) {
      return
    }

    const fn = this.queue.shift()
    if (!fn) return

    this.activeCount++
    try {
      await fn()
    } finally {
      this.activeCount--
      this.process()
    }
  }
}

const requestQueue = new RequestQueue()

async function fetchWithTimeout(url: string, timeout: number, headers?: HeadersInit): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

async function fetchWithRetry(url: string, retries: number, timeout: number, headers?: HeadersInit): Promise<any> {
  try {
    const response = await fetchWithTimeout(url, timeout, headers)

    // Check if response is HTML (rate limit or error page) instead of JSON
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('text/html')) {
      throw new Error(`Node returned HTML error page (likely rate limited or server error). Status: ${response.status}`)
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    if (retries > 0) {
      const nextTimeout = timeout * BACKOFF_FACTOR
      // Small delay before retry to reduce load
      await new Promise((resolve) => setTimeout(resolve, 100))
      return await fetchWithRetry(url, retries - 1, nextTimeout, headers)
    }
    throw error
  }
}

export interface FetchNodeOptions {
  /**
   * When true AND the local node fails, throw `NodeUnavailableError` instead of
   * falling through to the public node. Use this only for full chart data where
   * the public node won't have the nginx-cached historical state anyway.
   * Sparklines, live state and all other data should leave this unset (default false)
   * so the public node fallback is preserved.
   */
  skipPublicFallback?: boolean
}

export async function fetchNodeData(
  endpoint: string,
  queryParams: string[],
  options?: FetchNodeOptions
): Promise<any> {
  if (!process.env.NEXT_PUBLIC_LOCAL_NODE_URL && !process.env.NEXT_PUBLIC_PUBLIC_NODE_URL) {
    return fetchFakeData(endpoint, queryParams)
  }

  // Use request queue to prevent overwhelming the node with concurrent requests
  return requestQueue.add(async () => {
    // Prepare headers with API key if available (server-side only)
    const headers: HeadersInit = {}
    if (process.env.NODE_API_KEY) {
      headers['X-API-Key'] = process.env.NODE_API_KEY
    }

    try {
      // Try local node first if configured
      if (process.env.NEXT_PUBLIC_LOCAL_NODE_URL) {
        try {
          const localNodeUrl = `${process.env.NEXT_PUBLIC_LOCAL_NODE_URL}${endpoint}?${queryParams.join('&')}`
          return await fetchWithRetry(localNodeUrl, MAX_RETRIES, INITIAL_TIMEOUT, headers)
        } catch (error) {
          if (options?.skipPublicFallback) {
            // Caller has opted out of public fallback (e.g. full chart data where the public
            // node won't have our nginx-cached historical state). Signal the caller so it
            // can show a "temporarily unavailable" overlay instead of waiting another timeout.
            throw new NodeUnavailableError()
          }
          console.warn(`Local node failed for ${endpoint}, trying public node:`, error)
        }
      }

      // Try public node as fallback or primary
      if (process.env.NEXT_PUBLIC_PUBLIC_NODE_URL) {
        const publicNodeUrl = `${process.env.NEXT_PUBLIC_PUBLIC_NODE_URL}${endpoint}?${queryParams.join('&')}`
        return await fetchWithRetry(publicNodeUrl, MAX_RETRIES, INITIAL_TIMEOUT, headers)
      }

      throw new Error('No node URL configured (NEXT_PUBLIC_LOCAL_NODE_URL or NEXT_PUBLIC_PUBLIC_NODE_URL)')
    } catch (error: any) {
      if (error instanceof NodeUnavailableError) throw error
      throw new Error('Error fetching data from ' + endpoint + ' with params ' + queryParams + ': ' + error.message)
    }
  })
}
