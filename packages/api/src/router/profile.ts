import { z } from 'zod'

import { createTRPCRouter, procedure } from '../trpc'
import { fetchNodeData } from '../helpers/fetchFunction'
import { useTempTxStore } from '@dozer/zustand'

// Get the Pool Manager Contract ID from environment
const NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID = process.env.NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID

// Cache for token information to avoid repeated API calls
const tokenInfoCache = new Map<string, { symbol: string; name: string }>()

// Helper function to fetch token information from Hathor node
async function fetchTokenInfo(tokenUuid: string): Promise<{ symbol: string; name: string }> {
  if (tokenUuid === '00') {
    return { symbol: 'HTR', name: 'Hathor' }
  }

  // Check cache first
  if (tokenInfoCache.has(tokenUuid)) {
    return tokenInfoCache.get(tokenUuid)!
  }

  try {
    const endpoint = 'thin_wallet/token'
    const queryParams = [`id=${tokenUuid}`]
    const response = await fetchNodeData(endpoint, queryParams)

    const tokenInfo = {
      symbol: response.symbol || tokenUuid.substring(0, 8).toUpperCase(),
      name: response.name || `Token ${tokenUuid.substring(0, 8).toUpperCase()}`,
    }

    // Cache the result
    tokenInfoCache.set(tokenUuid, tokenInfo)
    return tokenInfo
  } catch (error) {
    console.error(`Error fetching token info for ${tokenUuid}:`, error)
    // Fallback to shortened UUID
    const fallback = {
      symbol: tokenUuid.substring(0, 8).toUpperCase(),
      name: `Token ${tokenUuid.substring(0, 8).toUpperCase()}`,
    }
    tokenInfoCache.set(tokenUuid, fallback)
    return fallback
  }
}

// Helper function to get token symbol from UUID (with caching)
async function getTokenSymbol(tokenUuid: string): Promise<string> {
  const tokenInfo = await fetchTokenInfo(tokenUuid)
  return tokenInfo.symbol
}

// Helper function to get token name from UUID (with caching)
async function getTokenName(tokenUuid: string): Promise<string> {
  const tokenInfo = await fetchTokenInfo(tokenUuid)
  return tokenInfo.name
}

// Helper function to fetch data from the pool manager contract
async function fetchFromPoolManager(calls: string[], timestamp?: number): Promise<any> {
  if (!NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID) {
    throw new Error('NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID environment variable not set')
  }

  const endpoint = 'nano_contract/state'
  const queryParams = [`id=${NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID}`, ...calls.map((call) => `calls[]=${call}`)]

  if (timestamp) {
    queryParams.push(`timestamp=${timestamp}`)
  }

  return await fetchNodeData(endpoint, queryParams)
}

// Helper function to parse JSON string responses from _str methods
function parseJsonResponse(jsonString: string): any {
  try {
    return JSON.parse(jsonString)
  } catch (error) {
    console.error('Error parsing JSON response:', error)
    throw new Error('Failed to parse contract response')
  }
}

const poolInfoCall = async (input: {
  address: string
  contractId: string
}): Promise<{
  balance_a: number
  balance_b: number
  liquidity: number
  max_withdraw_a: number
  max_withdraw_b: number
  last_tx: number
}> => {
  try {
    const endpoint = 'nano_contract/state'
    const queryParams = [`id=${input.contractId}`, `calls[]=user_info("a'${input.address}'")`]

    const response = await fetchNodeData(endpoint, queryParams)
    const result = response['calls'][`user_info("a'${input.address}'")`]['value']

    const endpoint_lasttx = 'nano_contract/history'
    const queryParams_lasttx = [`id=${input.contractId}`]
    const response_lasttx = await fetchNodeData(endpoint_lasttx, queryParams_lasttx)

    const add_remove_liquidity_txs = response_lasttx['history'].filter(
      (tx: any) => tx['nc_method'] == 'add_liquidity' || tx['nc_method'] == 'remove_liquidity'
    )
    const result_lasttx = add_remove_liquidity_txs
      ? Math.max(
          ...add_remove_liquidity_txs
            .filter((tx: any) => tx['inputs'].some((input: any) => input['address'] == input.address))
            .map((tx: any) => tx['timestamp'])
        )
      : Math.max(
          ...response_lasttx['history']
            .filter((tx: any) => tx['nc_method'] == 'initialize')
            .map((tx: any) => tx['timestamp'])
        )

    // Get temporary transaction data
    const tempTxs = useTempTxStore.getState().getTempTx(input.contractId, input.address)

    // Adjust max_withdraw values based on temporary transactions
    const adjustedMaxWithdrawA = result.max_withdraw_a + tempTxs.addedLiquidity.tokenA - tempTxs.removedLiquidity.tokenA
    const adjustedMaxWithdrawB = result.max_withdraw_b + tempTxs.addedLiquidity.tokenB - tempTxs.removedLiquidity.tokenB

    return {
      ...result,
      max_withdraw_a: Math.max(0, adjustedMaxWithdrawA) >= 0.1 ? Math.max(0, adjustedMaxWithdrawA) : 0, // Ensure non-negative values
      max_withdraw_b: Math.max(0, adjustedMaxWithdrawB) >= 0.1 ? Math.max(0, adjustedMaxWithdrawB) : 0,
      last_tx: result_lasttx,
    }
  } catch (error) {
    return {
      balance_a: 0,
      balance_b: 0,
      liquidity: 0,
      max_withdraw_a: 0,
      max_withdraw_b: 0,
      last_tx: 0,
    }
  }
}

export const profileRouter = createTRPCRouter({
  balance: procedure
    // .input(z.object({ address: z.string() }))
    .input(
      z.object({
        address: z
          .string()
          .length(34)
          .refine((val) => val.startsWith('W') || val.startsWith('H'), {
            message: "Invalid address: must initiatewith 'W' or 'H'.",
          }),
      })
    )
    .query(async ({ input }) => {
      const endpoint = 'thin_wallet/address_balance'
      const response = await fetchNodeData(endpoint, [`address=${input.address}`])
      return response
    }),
  poolInfo: procedure
    .input(
      z.object({
        address: z.string(),
        contractId: z.string(),
      })
    )
    .output(
      z.object({
        balance_a: z.number(),
        balance_b: z.number(),
        liquidity: z.number(),
        max_withdraw_a: z.number(),
        max_withdraw_b: z.number(),
        last_tx: z.number(),
      })
    )
    .query(async ({ input }) => {
      return await poolInfoCall(input)
    }),
  allPoolInfo: procedure
    .input(
      z.object({
        address: z.string(),
      })
    )
    .output(
      z.array(
        z.object({
          balance_a: z.number(),
          balance_b: z.number(),
          liquidity: z.number(),
          max_withdraw_a: z.number(),
          max_withdraw_b: z.number(),
          last_tx: z.number(),
          contractId: z.string(),
        })
      )
    )
    .query(async ({ ctx, input }) => {
      const allPools = await ctx.prisma.pool.findMany({
        select: {
          id: true,
        },
      })
      const poolInfo = await Promise.all(
        allPools.map(async (pool) => {
          const result = await poolInfoCall({ address: input.address, contractId: pool.id })
          return { ...result, contractId: pool.id }
        })
      )
      return poolInfo
    }),

  // Get user positions from the pool manager contract
  userPositions: procedure.input(z.object({ address: z.string() })).query(async ({ input }) => {
    try {
      if (!NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID) {
        console.warn('NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID not set, falling back to legacy method')
        return []
      }

      const response = await fetchFromPoolManager([`get_user_positions_str("${input.address}")`])
      const positionsStr = response.calls[`get_user_positions_str("${input.address}")`].value || '{}'

      // Parse the JSON string response
      const positions = parseJsonResponse(positionsStr)

      // Get token prices for USD values
      const pricesResponse = await fetchFromPoolManager(['get_all_token_prices_in_usd()'])
      const tokenPrices = pricesResponse.calls['get_all_token_prices_in_usd()'].value || {}

      const positionPromises = []
      for (const [poolKey, position] of Object.entries(positions)) {
        if (typeof position === 'object' && position !== null) {
          const [tokenA, tokenB, feeStr] = poolKey.split('/')
          const pos = position as any

          positionPromises.push(
            (async () => {
              const token0Amount = (pos.token_a_amount || 0) / 100
              const token1Amount = (pos.token_b_amount || 0) / 100

              // Calculate USD values
              const token0PriceUSD = (tokenA && tokenPrices[tokenA]) || 0
              const token1PriceUSD = (tokenB && tokenPrices[tokenB]) || 0
              const token0ValueUSD = token0Amount * token0PriceUSD
              const token1ValueUSD = token1Amount * token1PriceUSD
              const totalValueUSD = token0ValueUSD + token1ValueUSD

              return {
                poolKey,
                poolName: `${await getTokenSymbol(tokenA || '')}-${await getTokenSymbol(tokenB || '')}`,
                liquidity: pos.liquidity || 0,
                token0Amount,
                token1Amount,
                token0ValueUSD,
                token1ValueUSD,
                totalValueUSD,
                token0: {
                  uuid: tokenA,
                  symbol: await getTokenSymbol(tokenA || ''),
                  name: await getTokenName(tokenA || ''),
                  priceUSD: token0PriceUSD,
                },
                token1: {
                  uuid: tokenB,
                  symbol: await getTokenSymbol(tokenB || ''),
                  name: await getTokenName(tokenB || ''),
                  priceUSD: token1PriceUSD,
                },
              }
            })()
          )
        }
      }

      const positionData = await Promise.all(positionPromises)

      // Sort by total USD value (highest first)
      positionData.sort((a, b) => b.totalValueUSD - a.totalValueUSD)

      return positionData
    } catch (error) {
      console.error(`Error fetching user positions for ${input.address}:`, error)
      return []
    }
  }),

  // Get user positions summary
  userPositionsSummary: procedure.input(z.object({ address: z.string() })).query(async ({ input }) => {
    try {
      if (!NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID) {
        return {
          totalPositions: 0,
          totalValueUSD: 0,
          positions: [],
        }
      }

      const response = await fetchFromPoolManager([`get_user_positions_str("${input.address}")`])
      const positionsStr = response.calls[`get_user_positions_str("${input.address}")`].value || '{}'

      // Parse the JSON string response
      const positions = parseJsonResponse(positionsStr)

      // Get token prices for USD values
      const pricesResponse = await fetchFromPoolManager(['get_all_token_prices_in_usd()'])
      const tokenPrices = pricesResponse.calls['get_all_token_prices_in_usd()'].value || {}

      const positionPromises = []

      for (const [poolKey, position] of Object.entries(positions)) {
        if (typeof position === 'object' && position !== null) {
          const [tokenA, tokenB] = poolKey.split('/')
          const pos = position as any

          positionPromises.push(
            (async () => {
              const token0Amount = (pos.token_a_amount || 0) / 100
              const token1Amount = (pos.token_b_amount || 0) / 100

              // Calculate USD values
              const token0PriceUSD = (tokenA && tokenPrices[tokenA]) || 0
              const token1PriceUSD = (tokenB && tokenPrices[tokenB]) || 0
              const token0ValueUSD = token0Amount * token0PriceUSD
              const token1ValueUSD = token1Amount * token1PriceUSD
              const positionValueUSD = token0ValueUSD + token1ValueUSD

              return {
                poolKey,
                poolName: `${await getTokenSymbol(tokenA || '')}-${await getTokenSymbol(tokenB || '')}`,
                valueUSD: positionValueUSD,
              }
            })()
          )
        }
      }

      const positionSummaries = await Promise.all(positionPromises)
      const totalValueUSD = positionSummaries.reduce((sum, pos) => sum + pos.valueUSD, 0)

      // Sort by value
      positionSummaries.sort((a, b) => b.valueUSD - a.valueUSD)

      return {
        totalPositions: positionSummaries.length,
        totalValueUSD,
        positions: positionSummaries,
      }
    } catch (error) {
      console.error(`Error fetching user positions summary for ${input.address}:`, error)
      return {
        totalPositions: 0,
        totalValueUSD: 0,
        positions: [],
      }
    }
  }),

  // Get user position for a specific pool using DozerPoolManager
  userPositionByPool: procedure
    .input(z.object({ address: z.string(), poolKey: z.string() }))
    .query(async ({ input }) => {
      try {
        if (!NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID) {
          console.warn('NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID not set, falling back to legacy method')
          return null
        }

        const response = await fetchFromPoolManager([`user_info_str("${input.address}", "${input.poolKey}")`])
        const userInfo = parseJsonResponse(
          response.calls[`user_info_str("${input.address}", "${input.poolKey}")`].value
        )

        if (!userInfo || typeof userInfo !== 'object') {
          return null
        }

        // Get token prices for USD values
        const pricesResponse = await fetchFromPoolManager(['get_all_token_prices_in_usd()'])
        const tokenPrices = pricesResponse.calls['get_all_token_prices_in_usd()'].value || {}

        const [tokenA, tokenB, feeStr] = input.poolKey.split('/')

        // Convert amounts from cents to decimals
        const token0Amount = userInfo.token_a_amount || 0
        const token1Amount = userInfo.token_b_amount || 0
        const balanceA = userInfo.balance_a || 0
        const balanceB = userInfo.balance_b || 0

        // Calculate USD values
        const token0PriceUSD = (tokenA && tokenPrices[tokenA]) || 0
        const token1PriceUSD = (tokenB && tokenPrices[tokenB]) || 0
        const token0ValueUSD = token0Amount * token0PriceUSD
        const token1ValueUSD = token1Amount * token1PriceUSD

        return {
          poolKey: input.poolKey,
          liquidity: userInfo.liquidity || 0,
          token0Amount,
          token1Amount,
          balanceA,
          balanceB,
          token0ValueUSD,
          token1ValueUSD,
          totalValueUSD: token0ValueUSD + token1ValueUSD,
          token0: {
            uuid: tokenA,
            symbol: await getTokenSymbol(tokenA || ''),
            name: await getTokenName(tokenA || ''),
            priceUSD: token0PriceUSD,
          },
          token1: {
            uuid: tokenB,
            symbol: await getTokenSymbol(tokenB || ''),
            name: await getTokenName(tokenB || ''),
            priceUSD: token1PriceUSD,
          },
        }
      } catch (error) {
        console.error(`Error fetching user position for ${input.address} in pool ${input.poolKey}:`, error)
        return null
      }
    }),
})
