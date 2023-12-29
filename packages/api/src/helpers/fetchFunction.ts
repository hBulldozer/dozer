import { fetchFakeData } from './fetchFakeData'

/**
 * Fetches data from a node, prioritizing a local node if available,
 * and constructs the URL based on the provided endpoint and query parameters.
 *
 * @param {string} endpoint The endpoint to fetch data from.
 * @param {string[]} queryParams An array of query parameters to include in the URL.
 * @returns {Promise<NodeData>} A promise that resolves with the fetched data.
 * @throws {Error} If both local and public node fetches fail, or if there are errors during the process.
 */
export async function fetchNodeData(endpoint: string, queryParams: string[]): Promise<any> {
  if (!process.env.LOCAL_NODE_URL && !process.env.PUBLIC_NODE_URL) {
    // If Node URL is not given, returns fake data
    return fetchFakeData(endpoint, queryParams)
  }
  try {
    const localNodeUrl = `${process.env.LOCAL_NODE_URL}${endpoint}?${queryParams.join('&')}`
    if (localNodeUrl) {
      try {
        const response = await fetch(localNodeUrl)
        return await response.json()
      } catch {
        const publicNodeUrl = `${process.env.PUBLIC_NODE_URL}${endpoint}?${queryParams.join('&')}`
        if (publicNodeUrl) {
          const response = await fetch(publicNodeUrl)
          return await response.json()
        }

        throw new Error('Failed to fetch data from both local and public nodes')
      }
    }
  } catch (error: any) {
    throw new Error('Error fetching data: ' + error.message)
  }
}
