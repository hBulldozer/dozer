import { fetchFakeData } from './fetchFakeData'

// Check if running in local development environment
const isLocalDevelopment = process.env.NODE_ENV === 'development'

// Balanced settings to prevent rate limiting while maintaining ISR compatibility
// Development: fail fast to avoid socket hang up and provide quick feedback
// Production: moderate retry for reliability without breaking ISR timeout
const MAX_RETRIES = isLocalDevelopment ? 0 : 1
const INITIAL_TIMEOUT = isLocalDevelopment ? 3000 : 8000 // 3s dev, 8s prod
const BACKOFF_FACTOR = isLocalDevelopment ? 0 : 1.5

// Request queue to prevent overwhelming the node with concurrent requests
class RequestQueue {
  private queue: Array<() => Promise<any>> = []
  private activeCount = 0
  // Conservative concurrency limits to prevent rate limiting
  private maxConcurrency = isLocalDevelopment ? 10 : 15

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
      headers
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
      const localNodeUrl = `${process.env.NEXT_PUBLIC_LOCAL_NODE_URL}${endpoint}?${queryParams.join('&')}`
      if (localNodeUrl) {
        try {
          return await fetchWithRetry(localNodeUrl, MAX_RETRIES, INITIAL_TIMEOUT, headers)
        } catch {
          const publicNodeUrl = `${process.env.NEXT_PUBLIC_PUBLIC_NODE_URL}${endpoint}?${queryParams.join('&')}`
          if (publicNodeUrl) {
            return await fetchWithRetry(publicNodeUrl, MAX_RETRIES, INITIAL_TIMEOUT, headers)
          }
          throw new Error('Failed to fetch data from both local and public nodes')
        }
      }
    } catch (error: any) {
      throw new Error('Error fetching data to ' + endpoint + 'with params ' + queryParams + ': ' + error.message)
    }
  })
}
