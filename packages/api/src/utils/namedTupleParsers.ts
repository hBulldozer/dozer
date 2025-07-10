/**
 * Utility functions to parse NamedTuple arrays returned from the DozerPoolManager contract
 * into JavaScript objects with proper property names.
 * 
 * When NamedTuples are returned from nano contracts, they come as arrays where values
 * are ordered according to the NamedTuple definition in the contract.
 */

export interface PoolApiInfo {
  reserve0: number
  reserve1: number
  fee: number
  volume: number
  fee0: number
  fee1: number
  dzr_rewards: number
  transactions: number
  is_signed: number
  signer: string | null
}

export interface PoolInfo {
  token_a: string
  token_b: string
  reserve_a: number | null
  reserve_b: number | null
  fee: number | null
  total_liquidity: number | null
  transactions: number | null
  volume_a: number | null
  volume_b: number | null
  last_activity: number | null
  is_signed: boolean
  signer: string | null
}

export interface UserInfo {
  liquidity: number
  token0Amount: number
  token1Amount: number
  share: number
  balance_a: number
  balance_b: number
  token_a: string
  token_b: string
}

export interface UserPosition {
  liquidity: number
  token0Amount: number
  token1Amount: number
  share: number
  balance_a: number
  balance_b: number
  token_a: string
  token_b: string
}

export interface SwapPathInfo {
  path: string
  amounts: number[]
  amount_out: number
  price_impact: number
}

export interface SwapPathExactOutputInfo {
  path: string
  amounts: number[]
  amount_in: number
  price_impact: number
}

/**
 * Parse PoolApiInfo NamedTuple array to object
 * Contract definition: [reserve0, reserve1, fee, volume, fee0, fee1, dzr_rewards, transactions, is_signed, signer]
 */
export function parsePoolApiInfo(array: any[]): PoolApiInfo {
  if (!Array.isArray(array) || array.length !== 10) {
    throw new Error('Invalid PoolApiInfo array format')
  }
  
  return {
    reserve0: array[0] || 0,
    reserve1: array[1] || 0,
    fee: array[2] || 0,
    volume: array[3] || 0,
    fee0: array[4] || 0,
    fee1: array[5] || 0,
    dzr_rewards: array[6] || 0,
    transactions: array[7] || 0,
    is_signed: array[8] || 0,
    signer: array[9] || null,
  }
}

/**
 * Parse PoolInfo NamedTuple array to object
 * Contract definition: [token_a, token_b, reserve_a, reserve_b, fee, total_liquidity, transactions, volume_a, volume_b, last_activity, is_signed, signer]
 */
export function parsePoolInfo(array: any[]): PoolInfo {
  if (!Array.isArray(array) || array.length !== 12) {
    throw new Error('Invalid PoolInfo array format')
  }
  
  return {
    token_a: array[0] || '',
    token_b: array[1] || '',
    reserve_a: array[2],
    reserve_b: array[3],
    fee: array[4],
    total_liquidity: array[5],
    transactions: array[6],
    volume_a: array[7],
    volume_b: array[8],
    last_activity: array[9],
    is_signed: Boolean(array[10]),
    signer: array[11] || null,
  }
}

/**
 * Parse UserInfo NamedTuple array to object
 * Contract definition: [liquidity, token0Amount, token1Amount, share, balance_a, balance_b, token_a, token_b]
 */
export function parseUserInfo(array: any[]): UserInfo {
  if (!Array.isArray(array) || array.length !== 8) {
    throw new Error('Invalid UserInfo array format')
  }
  
  return {
    liquidity: array[0] || 0,
    token0Amount: array[1] || 0,
    token1Amount: array[2] || 0,
    share: array[3] || 0,
    balance_a: array[4] || 0,
    balance_b: array[5] || 0,
    token_a: array[6] || '',
    token_b: array[7] || '',
  }
}

/**
 * Parse UserPosition NamedTuple array to object
 * Contract definition: [liquidity, token0Amount, token1Amount, share, balance_a, balance_b, token_a, token_b]
 */
export function parseUserPosition(array: any[]): UserPosition {
  if (!Array.isArray(array) || array.length !== 8) {
    throw new Error('Invalid UserPosition array format')
  }
  
  return {
    liquidity: array[0] || 0,
    token0Amount: array[1] || 0,
    token1Amount: array[2] || 0,
    share: array[3] || 0,
    balance_a: array[4] || 0,
    balance_b: array[5] || 0,
    token_a: array[6] || '',
    token_b: array[7] || '',
  }
}

/**
 * Parse SwapPathInfo NamedTuple array to object
 * Contract definition: [path, amounts, amount_out, price_impact]
 */
export function parseSwapPathInfo(array: any[]): SwapPathInfo {
  if (!Array.isArray(array) || array.length !== 4) {
    throw new Error('Invalid SwapPathInfo array format')
  }
  
  return {
    path: array[0] || '',
    amounts: Array.isArray(array[1]) ? array[1] : [],
    amount_out: array[2] || 0,
    price_impact: array[3] || 0,
  }
}

/**
 * Parse SwapPathExactOutputInfo NamedTuple array to object
 * Contract definition: [path, amounts, amount_in, price_impact]
 */
export function parseSwapPathExactOutputInfo(array: any[]): SwapPathExactOutputInfo {
  if (!Array.isArray(array) || array.length !== 4) {
    throw new Error('Invalid SwapPathExactOutputInfo array format')
  }
  
  return {
    path: array[0] || '',
    amounts: Array.isArray(array[1]) ? array[1] : [],
    amount_in: array[2] || 0,
    price_impact: array[3] || 0,
  }
}

/**
 * Parse user positions object (which contains multiple UserPosition arrays)
 * The contract returns: { poolKey: UserPosition[], ... }
 */
export function parseUserPositions(positions: Record<string, any[]>): Record<string, UserPosition> {
  const result: Record<string, UserPosition> = {}
  
  for (const [poolKey, positionArray] of Object.entries(positions)) {
    if (Array.isArray(positionArray)) {
      result[poolKey] = parseUserPosition(positionArray)
    }
  }
  
  return result
}