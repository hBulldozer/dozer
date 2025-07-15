import { z } from 'zod'

import { fetchNodeData } from '../helpers/fetchFunction'
import { createTRPCRouter, procedure } from '../trpc'
import { parseOasisInfo, parseOasisUserInfo, parseOasisQuoteInfo } from '../utils/namedTupleParsers'

// Price precision constant to match the contract (10^8 for 8 decimal places)
const PRICE_PRECISION = 10 ** 8

// Cache for token information to avoid repeated API calls
const tokenInfoCache = new Map<string, { symbol: string; name: string }>()

// Helper function to fetch token information from Hathor node
async function fetchTokenInfo(tokenUuid: string): Promise<{ symbol: string; name: string }> {
  if (tokenUuid === '00') {
    return { symbol: 'HTR', name: 'Hathor' }
  }

  // Validate tokenUuid
  if (!tokenUuid || typeof tokenUuid !== 'string') {
    throw new Error(`Invalid token UUID: ${tokenUuid}`)
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
    // Return fallback token info
    const fallbackInfo = {
      symbol: tokenUuid.substring(0, 8).toUpperCase(),
      name: `Token ${tokenUuid.substring(0, 8).toUpperCase()}`,
    }
    tokenInfoCache.set(tokenUuid, fallbackInfo)
    return fallbackInfo
  }
}

// Get Oasis contract IDs from environment variable
const getOasisContracts = () => {
  const contractIds = process.env.NEXT_PUBLIC_OASIS_CONTRACT_IDS
  if (!contractIds) {
    throw new Error('NEXT_PUBLIC_OASIS_CONTRACT_IDS environment variable not set')
  }
  return contractIds
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0)
}

// Get token info for a contract by calling oasis_info
const getOasisTokenInfo = async (contractId: string) => {
  const endpoint = 'nano_contract/state'
  const oasisInfoCall = `oasis_info()`
  const poolFeeCall = `pool_fee`
  const poolManagerCall = `dozer_pool_manager`
  const queryParams = [
    `id=${contractId}`,
    `calls[]=${oasisInfoCall}`,
    `calls[]=${poolFeeCall}`,
    `calls[]=${poolManagerCall}`,
  ]
  const response = await fetchNodeData(endpoint, queryParams)

  const oasisInfoRaw = response['calls'][`${oasisInfoCall}`]['value']
  const poolFee = response['calls'][`${poolFeeCall}`]['value']
  const poolManager = response['calls'][`${poolManagerCall}`]['value']

  // Check if result exists and is valid
  if (!oasisInfoRaw || !Array.isArray(oasisInfoRaw)) {
    throw new Error(`Invalid oasis_info response for contract ${contractId}: ${JSON.stringify(oasisInfoRaw)}`)
  }

  // Parse the NamedTuple using the proper parser
  const oasisInfo = parseOasisInfo(oasisInfoRaw)
  const tokenB = oasisInfo.token_b
  const tokenInfo = await fetchTokenInfo(tokenB)

  return {
    id: contractId,
    token_b: tokenB,
    pool_fee: poolFee || 100, // Default fee if not available
    pool_manager: poolManager || process.env.NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID,
    token: {
      symbol: tokenInfo.symbol,
      uuid: tokenB,
      name: tokenInfo.name,
    },
  }
}

const fetchAndProcessUserOasis = async (
  contractId: string,
  tokenInfo: {
    token_b: string
    pool_fee: number
    pool_manager: string
    token: { symbol: string; uuid: string; name: string }
  },
  address: string
) => {
  const endpoint = 'nano_contract/state'
  const call = `user_info("${address}")`
  const queryParams = [`id=${contractId}`, `calls[]=${call}`]
  const response = await fetchNodeData(endpoint, queryParams)
  const result = response['calls'][`${call}`]['value']

  // Handle NamedTuple structure from new contract
  if (result && Array.isArray(result)) {
    const userInfo = parseOasisUserInfo(result)
    return {
      id: contractId,
      token: tokenInfo.token,
      pool: { id: contractId }, // Mock pool structure for compatibility
      token_b: tokenInfo.token_b,
      pool_fee: tokenInfo.pool_fee,
      pool_manager: tokenInfo.pool_manager,
      user_deposit_b: userInfo.user_deposit_b / 100,
      user_liquidity: userInfo.user_liquidity,
      user_withdrawal_time: new Date(userInfo.user_withdrawal_time * 1000),
      oasis_htr_balance: userInfo.oasis_htr_balance / 100,
      total_liquidity: userInfo.total_liquidity,
      user_balance_a: userInfo.user_balance_a / 100,
      user_balance_b: userInfo.user_balance_b / 100,
      closed_balance_a: userInfo.closed_balance_a / 100,
      closed_balance_b: userInfo.closed_balance_b / 100,
      user_lp_b: userInfo.user_lp_b / 100,
      user_lp_htr: userInfo.user_lp_htr / 100,
      max_withdraw_htr: userInfo.max_withdraw_htr / 100,
      max_withdraw_b: userInfo.max_withdraw_b / 100,
      htr_price_in_deposit: userInfo.htr_price_in_deposit / PRICE_PRECISION,
      token_price_in_htr_in_deposit: userInfo.token_price_in_htr_in_deposit / PRICE_PRECISION,
      position_closed: userInfo.position_closed,
    }
  } else {
    // Return empty position if no user info
    return {
      id: contractId,
      token: tokenInfo.token,
      pool: { id: contractId }, // Mock pool structure for compatibility
      token_b: tokenInfo.token_b,
      pool_fee: tokenInfo.pool_fee,
      pool_manager: tokenInfo.pool_manager,
      user_deposit_b: 0,
      user_liquidity: 0,
      user_withdrawal_time: new Date(0),
      oasis_htr_balance: 0,
      total_liquidity: 0,
      user_balance_a: 0,
      user_balance_b: 0,
      closed_balance_a: 0,
      closed_balance_b: 0,
      user_lp_b: 0,
      user_lp_htr: 0,
      max_withdraw_htr: 0,
      max_withdraw_b: 0,
      htr_price_in_deposit: 0,
      token_price_in_htr_in_deposit: 0,
      position_closed: false,
    }
  }
}

const fetchAndProcessReserves = async (
  contractId: string,
  tokenInfo: {
    token_b: string
    pool_fee: number
    pool_manager: string
    token: { symbol: string; uuid: string; name: string }
  }
) => {
  const endpoint = 'nano_contract/state'
  const call = `oasis_info()`
  const queryParams = [`id=${contractId}`, `calls[]=${call}`]
  const response = await fetchNodeData(endpoint, queryParams)
  const result = response['calls'][`${call}`]['value']

  // Handle NamedTuple structure from new contract
  if (!result || !Array.isArray(result)) {
    throw new Error(`Invalid oasis_info response for reserves: ${JSON.stringify(result)}`)
  }

  const oasisInfo = parseOasisInfo(result)
  return {
    id: contractId,
    token: tokenInfo.token,
    pool: { id: contractId }, // Mock pool structure for compatibility
    token_b: tokenInfo.token_b,
    pool_fee: tokenInfo.pool_fee,
    pool_manager: tokenInfo.pool_manager,
    oasis_htr_balance: oasisInfo.oasis_htr_balance / 100,
    dev_deposit_amount: oasisInfo.dev_deposit_amount / 100,
    total_liquidity: oasisInfo.total_liquidity,
    protocol_fee: oasisInfo.protocol_fee,
  }
}

export const oasisRouter = createTRPCRouter({
  all: procedure.query(async () => {
    try {
      const contractIds = getOasisContracts()

      if (contractIds.length === 0) {
        console.warn('No Oasis contract IDs found in environment variable')
        return []
      }

      // Get token info for each contract
      const oasisContractsPromises = contractIds.map(async (contractId) => {
        try {
          const tokenInfo = await getOasisTokenInfo(contractId)
          return {
            id: contractId,
            token: tokenInfo.token,
            pool: { id: contractId }, // Mock pool structure for compatibility
            token_b: tokenInfo.token_b,
            pool_fee: tokenInfo.pool_fee,
            pool_manager: tokenInfo.pool_manager,
          }
        } catch (error) {
          console.error(`Error fetching info for Oasis contract ${contractId}:`, error)
          return null
        }
      })

      const oasisContracts = await Promise.all(oasisContractsPromises)
      return oasisContracts.filter((contract) => contract !== null)
    } catch (error) {
      console.error('Error in oasis.all query:', error)
      throw error
    }
  }),
  allUser: procedure.input(z.object({ address: z.string() })).query(async ({ input }) => {
    try {
      const contractIds = getOasisContracts()

      if (contractIds.length === 0) {
        return []
      }

      // Get user info for each contract
      const userOasisPromises = contractIds.map(async (contractId) => {
        try {
          const tokenInfo = await getOasisTokenInfo(contractId)
          return fetchAndProcessUserOasis(contractId, tokenInfo, input.address)
        } catch (error) {
          console.error(`Error fetching user info for Oasis contract ${contractId}:`, error)
          return null
        }
      })

      const userOasis = await Promise.all(userOasisPromises)
      return userOasis.filter((oasis) => oasis !== null && oasis.user_deposit_b && oasis.user_deposit_b > 0)
    } catch (error) {
      console.error('Error in oasis.allUser query:', error)
      throw error
    }
  }),
  allReserves: procedure.query(async () => {
    try {
      const contractIds = getOasisContracts()

      if (!contractIds || contractIds.length === 0) {
        return []
      }

      // Get reserves for each contract
      const reservesPromises = contractIds.map(async (contractId) => {
        try {
          const tokenInfo = await getOasisTokenInfo(contractId)
          return fetchAndProcessReserves(contractId, tokenInfo)
        } catch (error) {
          console.error(`Error fetching reserves for Oasis contract ${contractId}:`, error)
          return null
        }
      })

      const reserves = await Promise.all(reservesPromises)
      return reserves.filter((reserve) => reserve !== null)
    } catch (error) {
      console.error('Error in oasis.allReserves query:', error)
      throw error
    }
  }),

  getFrontQuoteLiquidityIn: procedure
    .input(
      z.object({
        id: z.string(),
        amount_in: z.number(),
        timelock: z.number(),
        now: z.number(),
        address: z.string(),
      })
    )
    .output(
      z.object({
        bonus: z.number(),
        htr_amount: z.number(),
        withdrawal_time: z.date(),
        has_position: z.boolean(),
        deposit_amount: z.number(),
        fee_amount: z.number(),
        protocol_fee: z.number(),
      })
    )
    .query(async ({ input }) => {
      const endpoint = 'nano_contract/state'
      const amount = input.amount_in
      const call = `front_quote_add_liquidity_in(${Math.floor(amount * 100)},${input.timelock},${Math.floor(
        input.now / 1000
      )},"${input.address}")`
      const queryParams = [`id=${input.id}`, `calls[]=${call}`]
      const response = await fetchNodeData(endpoint, queryParams)
      const result = response['calls'][`${call}`]['value']

      // Handle NamedTuple structure from new contract (OasisQuoteInfo)
      if (!result || !Array.isArray(result)) {
        throw new Error(`Invalid quote response: ${JSON.stringify(result)}`)
      }

      const quoteInfo = parseOasisQuoteInfo(result)
      return {
        bonus: quoteInfo.bonus / 100,
        htr_amount: quoteInfo.htr_amount / 100,
        withdrawal_time: new Date(quoteInfo.withdrawal_time * 1000),
        has_position: quoteInfo.has_position,
        deposit_amount: quoteInfo.deposit_amount / 100,
        fee_amount: quoteInfo.fee_amount / 100,
        protocol_fee: quoteInfo.protocol_fee,
      }
    }),
})
