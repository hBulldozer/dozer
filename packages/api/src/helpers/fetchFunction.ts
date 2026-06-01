import { fetchFakeData } from './fetchFakeData'

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

export async function fetchNodeData(endpoint: string, queryParams: string[]): Promise<any> {
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

    // Historical state requests (nano_contract/state with a timestamp) are served from
    // the nginx cache on the local node. The public node doesn't have this nginx cache,
    // so falling back to it would just add another INITIAL_TIMEOUT wait for a request
    // it can't serve faster. Skip public fallback for these requests entirely.
    const isHistoricalStateRequest =
      endpoint === 'nano_contract/state' && queryParams.some((p) => p.startsWith('timestamp='))

    try {
      // Try local node first if configured
      if (process.env.NEXT_PUBLIC_LOCAL_NODE_URL) {
        try {
          const localNodeUrl = `${process.env.NEXT_PUBLIC_LOCAL_NODE_URL}${endpoint}?${queryParams.join('&')}`
          return await fetchWithRetry(localNodeUrl, MAX_RETRIES, INITIAL_TIMEOUT, headers)
        } catch (error) {
          if (isHistoricalStateRequest) {
            // No point trying the public node — it won't have our nginx chart cache.
            // Re-throw so the chart point is skipped (null → forward-filled) rather than
            // waiting another INITIAL_TIMEOUT for a result that won't come.
            throw error
          }
          console.warn(`Local node failed for ${endpoint}, trying public node:`, error)
        }
      }

      // Try public node as fallback or primary (live state only)
      if (process.env.NEXT_PUBLIC_PUBLIC_NODE_URL) {
        const publicNodeUrl = `${process.env.NEXT_PUBLIC_PUBLIC_NODE_URL}${endpoint}?${queryParams.join('&')}`
        return await fetchWithRetry(publicNodeUrl, MAX_RETRIES, INITIAL_TIMEOUT, headers)
      }

      throw new Error('No node URL configured (NEXT_PUBLIC_LOCAL_NODE_URL or NEXT_PUBLIC_PUBLIC_NODE_URL)')
    } catch (error: any) {
      throw new Error('Error fetching data from ' + endpoint + ' with params ' + queryParams + ': ' + error.message)
    }
  })
}
