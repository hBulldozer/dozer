import { fetchFakeData } from './fetchFakeData'

// Check if running in local development environment
const isLocalDevelopment = process.env.NODE_ENV === 'development'

// Timeout / retry settings.
//
// Production: historical contract-state queries (chart data) can take 10-30s on
// the node. We set a generous 25s timeout with NO retries so the worst-case per
// request is 25s (local) + 25s (public fallback) = 50s, safely within Vercel's
// 60s function limit. Retrying a timed-out historical query just doubles the wait.
//
// Development: fail fast so socket hang-ups don't stall local dev.
const MAX_RETRIES = isLocalDevelopment ? 0 : 0
const INITIAL_TIMEOUT = isLocalDevelopment ? 3000 : 25000 // 3s dev, 25s prod
const BACKOFF_FACTOR = isLocalDevelopment ? 0 : 1.5

// Request queue to prevent overwhelming the node with concurrent requests
class RequestQueue {
  private queue: Array<() => Promise<any>> = []
  private activeCount = 0
  // Conservative concurrency limits to prevent rate limiting.
  // Production is lower (5) because historical chart state queries are slow and
  // firing 15 at once risks saturating the node before nginx can cache results.
  private maxConcurrency = isLocalDevelopment ? 10 : 5

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

    try {
      // Try local node first if configured
      if (process.env.NEXT_PUBLIC_LOCAL_NODE_URL) {
        try {
          const localNodeUrl = `${process.env.NEXT_PUBLIC_LOCAL_NODE_URL}${endpoint}?${queryParams.join('&')}`
          return await fetchWithRetry(localNodeUrl, MAX_RETRIES, INITIAL_TIMEOUT, headers)
        } catch (error) {
          // If local node fails, fall through to try public node
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
      throw new Error('Error fetching data from ' + endpoint + ' with params ' + queryParams + ': ' + error.message)
    }
  })
}
