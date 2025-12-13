import { fetchFakeData } from './fetchFakeData'

const MAX_RETRIES = 2
const INITIAL_TIMEOUT = 5000 // 5 seconds
const BACKOFF_FACTOR = 1

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
