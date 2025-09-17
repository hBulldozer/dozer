import { z } from 'zod'
import { createTRPCRouter, procedure } from '../trpc'
import { fetchNodeData } from '../helpers/fetchFunction'

// Get DozerTools contract ID from environment
const NEXT_PUBLIC_DOZER_TOOLS_CONTRACT_ID = process.env.NEXT_PUBLIC_DOZER_TOOLS_CONTRACT_ID
const NEXT_PUBLIC_DOZER_TOOLS_VERCEL_BLOB_URL = process.env.NEXT_PUBLIC_DOZER_TOOLS_VERCEL_BLOB_URL

if (!NEXT_PUBLIC_DOZER_TOOLS_CONTRACT_ID) {
  console.warn('NEXT_PUBLIC_DOZER_TOOLS_CONTRACT_ID environment variable not set - DozerTools integration disabled')
}

if (!NEXT_PUBLIC_DOZER_TOOLS_VERCEL_BLOB_URL) {
  console.warn('NEXT_PUBLIC_DOZER_TOOLS_VERCEL_BLOB_URL environment variable not set - DozerTools blob images disabled')
}

// Helper function to fetch data from DozerTools contract
async function fetchFromDozerToolsContract(calls: string[]): Promise<any> {
  if (!NEXT_PUBLIC_DOZER_TOOLS_CONTRACT_ID) {
    throw new Error('NEXT_PUBLIC_DOZER_TOOLS_CONTRACT_ID environment variable not set')
  }

  const endpoint = 'nano_contract/state'
  const queryParams = [`id=${NEXT_PUBLIC_DOZER_TOOLS_CONTRACT_ID}`, ...calls.map((call) => `calls[]=${call}`)]

  return await fetchNodeData(endpoint, queryParams)
}

// Helper function to build DozerTools image URLs
function buildDozerToolsImageUrl(logoUrl: string | null, symbol: string, userAddress?: string): string | null {
  if (!logoUrl && !NEXT_PUBLIC_DOZER_TOOLS_VERCEL_BLOB_URL) {
    return null
  }

  // If we have a direct logo URL from the contract, use it
  if (logoUrl) {
    // If it's already a full URL, return it directly
    if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
      return logoUrl
    }

    // If it's a relative path, prefix with the blob URL
    if (NEXT_PUBLIC_DOZER_TOOLS_VERCEL_BLOB_URL) {
      return `${NEXT_PUBLIC_DOZER_TOOLS_VERCEL_BLOB_URL}/${logoUrl}`
    }
  }

  // If no direct logo URL but we have a user address, try pattern-based URL
  if (userAddress && NEXT_PUBLIC_DOZER_TOOLS_VERCEL_BLOB_URL) {
    // Return the base pattern URL - the Icon component will handle extension fallback
    return `${NEXT_PUBLIC_DOZER_TOOLS_VERCEL_BLOB_URL}/token-icons/${symbol}-${userAddress}`
  }

  return null
}

export const dozerToolsRouter = createTRPCRouter({
  // Check if DozerTools integration is available
  isAvailable: procedure.query(async () => {
    return {
      contractAvailable: !!NEXT_PUBLIC_DOZER_TOOLS_CONTRACT_ID,
      blobUrlAvailable: !!NEXT_PUBLIC_DOZER_TOOLS_VERCEL_BLOB_URL,
    }
  }),

  // Get project info from DozerTools contract
  getProjectInfo: procedure
    .input(z.object({ tokenUuid: z.string() }))
    .query(async ({ input }) => {
      try {
        if (!NEXT_PUBLIC_DOZER_TOOLS_CONTRACT_ID) {
          return null
        }

        const response = await fetchFromDozerToolsContract([`get_project_info("${input.tokenUuid}")`])
        const projectData = response.calls[`get_project_info("${input.tokenUuid}")`]?.value

        if (!projectData) {
          return null
        }

        return {
          tokenUuid: input.tokenUuid,
          name: projectData.name || null,
          symbol: projectData.symbol || null,
          description: projectData.description || null,
          logoUrl: projectData.logo_url || null,
          totalSupply: projectData.total_supply || null,
          createdAt: projectData.created_at || null,
          dev: projectData.dev || null, // Creator address
          // Social links
          website: projectData.website || null,
          twitter: projectData.twitter || null,
          telegram: projectData.telegram || null,
          discord: projectData.discord || null,
          github: projectData.github || null,
          whitepaperUrl: projectData.whitepaper_url || null,
          category: projectData.category || null,
        }
      } catch (error) {
        console.error(`Error fetching project info for token ${input.tokenUuid}:`, error)
        return null
      }
    }),

  // Get token image URL with fallback patterns
  getTokenImageUrl: procedure
    .input(z.object({
      tokenUuid: z.string(),
      symbol: z.string(),
      userAddress: z.string().optional(),
    }))
    .query(async ({ input }) => {
      try {
        if (!NEXT_PUBLIC_DOZER_TOOLS_CONTRACT_ID) {
          return null
        }

        // First, try to get the project info to see if there's a direct logo URL
        const response = await fetchFromDozerToolsContract([`get_project_info("${input.tokenUuid}")`])
        const projectData = response.calls[`get_project_info("${input.tokenUuid}")`]?.value

        const logoUrl = projectData?.logo_url || null
        const imageUrl = buildDozerToolsImageUrl(logoUrl, input.symbol, input.userAddress)

        return {
          tokenUuid: input.tokenUuid,
          symbol: input.symbol,
          logoUrl,
          imageUrl,
          hasProject: !!projectData,
          supportedExtensions: ['png', 'jpeg', 'jpg'], // For pattern-based fallback
        }
      } catch (error) {
        console.error(`Error fetching token image URL for ${input.tokenUuid}:`, error)
        return null
      }
    }),

  // Get multiple token image URLs in batch
  getTokenImageUrls: procedure
    .input(z.object({
      tokens: z.array(z.object({
        tokenUuid: z.string(),
        symbol: z.string(),
        userAddress: z.string().optional(),
      }))
    }))
    .query(async ({ input }) => {
      try {
        if (!NEXT_PUBLIC_DOZER_TOOLS_CONTRACT_ID || input.tokens.length === 0) {
          return {}
        }

        // Batch fetch all project info
        const calls = input.tokens.map((token) => `get_project_info("${token.tokenUuid}")`)
        const response = await fetchFromDozerToolsContract(calls)

        const results: Record<string, any> = {}

        for (const token of input.tokens) {
          const projectData = response.calls[`get_project_info("${token.tokenUuid}")`]?.value
          const logoUrl = projectData?.logo_url || null
          const imageUrl = buildDozerToolsImageUrl(logoUrl, token.symbol, token.userAddress)

          results[token.tokenUuid] = {
            tokenUuid: token.tokenUuid,
            symbol: token.symbol,
            logoUrl,
            imageUrl,
            hasProject: !!projectData,
            supportedExtensions: ['png', 'jpeg', 'jpg'],
          }
        }

        return results
      } catch (error) {
        console.error('Error fetching batch token image URLs:', error)
        return {}
      }
    }),

  // Get projects by developer address
  getProjectsByDeveloper: procedure
    .input(z.object({ developerAddress: z.string() }))
    .query(async ({ input }) => {
      try {
        if (!NEXT_PUBLIC_DOZER_TOOLS_CONTRACT_ID) {
          return []
        }

        const response = await fetchFromDozerToolsContract([`get_projects_by_dev("${input.developerAddress}")`])
        const projects = response.calls[`get_projects_by_dev("${input.developerAddress}")`]?.value || {}

        // Convert to array format with basic info
        const projectList = Object.entries(projects).map(([tokenUuid, name]) => ({
          tokenUuid,
          name: name as string,
        }))

        return projectList
      } catch (error) {
        console.error(`Error fetching projects for developer ${input.developerAddress}:`, error)
        return []
      }
    }),
})