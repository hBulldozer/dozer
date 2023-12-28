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
  try {
    const localNodeUrl = `${process.env.LOCAL_NODE_URL}${endpoint}?${queryParams.join('&')}`
    if (localNodeUrl) {
      const response = await fetch(localNodeUrl)
      if (response.ok) {
        return await response.json()
      }
    }

    const publicNodeUrl = `${process.env.PUBLIC_NODE_URL}${endpoint}?${queryParams.join('&')}`
    if (publicNodeUrl) {
      const response = await fetch(publicNodeUrl)
      if (response.ok) {
        return await response.json()
      }
    }

    throw new Error('Failed to fetch data from both local and public nodes')
  } catch (error: any) {
    throw new Error('Error fetching data: ' + error.message)
  }
}
