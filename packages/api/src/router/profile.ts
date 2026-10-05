import { z } from 'zod'

import { createTRPCRouter, procedure } from '../trpc'
import { fetchNodeData } from '../helpers/fetchFunction'
import { useTempTxStore } from '@dozer/zustand'
import { fetchFromPoolManager, fetchTokenInfo, getTokenName, getTokenSymbol } from './pool/helpers'
import { 
  parseUserPositions, 
  parseUserInfo,
  type UserPosition,
  type UserInfo
} from '../utils/namedTupleParsers'
import { TOKEN_PRICES_USD, fetchPagedView, userPositions } from './pool/pagedViews'

// Get the Pool Manager Contract ID from environment
const NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID = process.env.NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID

type HistoryIO = { token: string; value: number; decoded?: { address?: string } }

/**
 * Same shape as thin_wallet/address_balance
 * ({ success, total_transactions, tokens_data: { [uid]: { name, symbol, received, spent } } }),
 * computed from the address history: outputs paid to the address minus inputs spent from it.
 */
async function getAddressBalanceFromHistory(address: string) {
  const tokens: Record<string, { received: number; spent: number }> = {}
  const add = (token: string, field: 'received' | 'spent', value: number) => {
    tokens[token] ??= { received: 0, spent: 0 }
    tokens[token][field] += value
  }
  let totalTransactions = 0
  let hash: string | null = null
  for (let page = 0; page < 50; page++) {
    const params = [`addresses[]=${address}`, ...(hash ? [`hash=${hash}`] : [])]
    const response = await fetchNodeData('thin_wallet/address_history', params)
    for (const tx of response.history ?? []) {
      if (tx.is_voided) continue
      totalTransactions++
      for (const output of (tx.outputs ?? []) as HistoryIO[]) {
        if (output.decoded?.address === address) add(output.token, 'received', output.value)
      }
      for (const txInput of (tx.inputs ?? []) as HistoryIO[]) {
        if (txInput.decoded?.address === address) add(txInput.token, 'spent', txInput.value)
      }
    }
    if (!response.has_more || !response.first_hash) break
    hash = response.first_hash
  }

  const tokensData: Record<string, { name: string; symbol: string; received: number; spent: number }> = {}
  await Promise.all(
    Object.entries(tokens).map(async ([uid, amounts]) => {
      const info = await fetchTokenInfo(uid)
      tokensData[uid] = { ...info, ...amounts }
    })
  )
  return { success: true, total_transactions: totalTransactions, tokens_data: tokensData }
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
      try {
        return await fetchNodeData('thin_wallet/address_balance', [`address=${input.address}`])
      } catch (error) {
        // Public nodes block address_balance (403); rebuild it from the address history
        console.warn('address_balance unavailable, computing balance from history:', error)
        return await getAddressBalanceFromHistory(input.address)
      }
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

      const positionsArrays = await fetchPagedView(userPositions(input.address))

      // Parse the user positions object (contains NamedTuple arrays for each pool)
      const positions = parseUserPositions(positionsArrays)

      // Get token prices for USD values
      const tokenPrices = await fetchPagedView(TOKEN_PRICES_USD)

      const positionPromises = []
      for (const [poolKey, position] of Object.entries(positions)) {
        if (typeof position === 'object' && position !== null) {
          const [tokenA, tokenB, feeStr] = poolKey.split('/')

          positionPromises.push(
            (async () => {
              const token0Amount = (position.token0Amount || 0) / 100
              const token1Amount = (position.token1Amount || 0) / 100

              // Calculate USD values
              const token0PriceUSD = (tokenA && tokenPrices[tokenA]) || 0
              const token1PriceUSD = (tokenB && tokenPrices[tokenB]) || 0
              const token0ValueUSD = token0Amount * token0PriceUSD
              const token1ValueUSD = token1Amount * token1PriceUSD
              const totalValueUSD = token0ValueUSD + token1ValueUSD

              return {
                poolKey,
                poolName: `${await getTokenSymbol(tokenA || '')}-${await getTokenSymbol(tokenB || '')}`,
                liquidity: position.liquidity || 0,
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

      const positionsArrays = await fetchPagedView(userPositions(input.address))

      // Parse the user positions object (contains NamedTuple arrays for each pool)
      const positions = parseUserPositions(positionsArrays)

      // Get token prices for USD values
      const tokenPrices = await fetchPagedView(TOKEN_PRICES_USD)

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

        const [tokenA, tokenB] = input.poolKey.split('/')

        // Batch contract calls + token metadata in parallel
        const [batchResponse, tokenPrices, token0Info, token1Info] = await Promise.all([
          fetchFromPoolManager([`user_info("${input.address}", "${input.poolKey}")`]),
          fetchPagedView(TOKEN_PRICES_USD),
          fetchTokenInfo(tokenA || ''),
          fetchTokenInfo(tokenB || ''),
        ])

        const userInfoArray = batchResponse.calls[`user_info("${input.address}", "${input.poolKey}")`].value
        if (!userInfoArray || !Array.isArray(userInfoArray)) {
          return null
        }

        const userInfo = parseUserInfo(userInfoArray)

        const token0Amount = userInfo.token0Amount || 0
        const token1Amount = userInfo.token1Amount || 0
        const balanceA = userInfo.balance_a || 0
        const balanceB = userInfo.balance_b || 0

        const token0PriceUSD = (tokenA && tokenPrices[tokenA]) || 0
        const token1PriceUSD = (tokenB && tokenPrices[tokenB]) || 0

        return {
          poolKey: input.poolKey,
          liquidity: userInfo.liquidity || 0,
          token0Amount,
          token1Amount,
          balanceA,
          balanceB,
          token0ValueUSD: token0Amount * token0PriceUSD,
          token1ValueUSD: token1Amount * token1PriceUSD,
          totalValueUSD: token0Amount * token0PriceUSD + token1Amount * token1PriceUSD,
          token0: {
            uuid: tokenA,
            symbol: token0Info.symbol,
            name: token0Info.name,
            priceUSD: token0PriceUSD,
          },
          token1: {
            uuid: tokenB,
            symbol: token1Info.symbol,
            name: token1Info.name,
            priceUSD: token1PriceUSD,
          },
        }
      } catch (error) {
        console.error(`Error fetching user position for ${input.address} in pool ${input.poolKey}:`, error)
        return null
      }
    }),
})
