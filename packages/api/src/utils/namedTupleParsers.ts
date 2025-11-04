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

export interface UserProfitInfo {
  current_value_usd: number
  initial_value_usd: number
  profit_amount_usd: number
  profit_percentage: number
  last_action_timestamp: number
}

export interface QuoteSingleTokenResult {
  liquidity_amount: number
  token_a_used: number
  token_b_used: number
  excess_token: string
  excess_amount: number
  swap_amount: number
  swap_output: number
  price_impact: number
}

export interface QuoteRemoveSingleTokenResult {
  amount_out: number
  token_a_withdrawn: number
  token_b_withdrawn: number
  swap_amount: number
  swap_output: number
  price_impact: number
  user_liquidity: number
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

export interface OasisInfo {
  total_liquidity: number
  oasis_htr_balance: number
  token_b: string
  protocol_fee: number
  dev_deposit_amount: number
}

export interface OasisUserInfo {
  user_deposit_b: number
  user_liquidity: number
  user_withdrawal_time: number
  oasis_htr_balance: number
  total_liquidity: number
  user_balance_a: number
  user_balance_b: number
  closed_balance_a: number
  closed_balance_b: number
  user_lp_b: number
  user_lp_htr: number
  max_withdraw_b: number
  max_withdraw_htr: number
  htr_price_in_deposit: number
  token_price_in_htr_in_deposit: number
  position_closed: boolean
}

export interface OasisQuoteInfo {
  bonus: number
  htr_amount: number
  withdrawal_time: number
  has_position: boolean
  deposit_amount: number
  fee_amount: number
  protocol_fee: number
}

/**
 * Parse OasisInfo NamedTuple array to object
 * Contract definition: [total_liquidity, oasis_htr_balance, token_b, protocol_fee, dev_deposit_amount]
 */
export function parseOasisInfo(array: any[]): OasisInfo {
  if (!Array.isArray(array) || array.length !== 5) {
    throw new Error('Invalid OasisInfo array format')
  }
  
  return {
    total_liquidity: array[0] || 0,
    oasis_htr_balance: array[1] || 0,
    token_b: array[2] || '',
    protocol_fee: array[3] || 0,
    dev_deposit_amount: array[4] || 0,
  }
}

/**
 * Parse OasisUserInfo NamedTuple array to object
 * Contract definition: [user_deposit_b, user_liquidity, user_withdrawal_time, oasis_htr_balance, total_liquidity, user_balance_a, user_balance_b, closed_balance_a, closed_balance_b, user_lp_b, user_lp_htr, max_withdraw_b, max_withdraw_htr, htr_price_in_deposit, token_price_in_htr_in_deposit, position_closed]
 */
export function parseOasisUserInfo(array: any[]): OasisUserInfo {
  if (!Array.isArray(array) || array.length !== 16) {
    throw new Error('Invalid OasisUserInfo array format')
  }
  
  return {
    user_deposit_b: array[0] || 0,
    user_liquidity: array[1] || 0,
    user_withdrawal_time: array[2] || 0,
    oasis_htr_balance: array[3] || 0,
    total_liquidity: array[4] || 0,
    user_balance_a: array[5] || 0,
    user_balance_b: array[6] || 0,
    closed_balance_a: array[7] || 0,
    closed_balance_b: array[8] || 0,
    user_lp_b: array[9] || 0,
    user_lp_htr: array[10] || 0,
    max_withdraw_b: array[11] || 0,
    max_withdraw_htr: array[12] || 0,
    htr_price_in_deposit: array[13] || 0,
    token_price_in_htr_in_deposit: array[14] || 0,
    position_closed: Boolean(array[15] || false),
  }
}

/**
 * Parse OasisQuoteInfo NamedTuple array to object
 * Contract definition: [bonus, htr_amount, withdrawal_time, has_position, fee_amount, deposit_amount, protocol_fee]
 */
export function parseOasisQuoteInfo(array: any[]): OasisQuoteInfo {
  if (!Array.isArray(array) || array.length !== 7) {
    throw new Error('Invalid OasisQuoteInfo array format')
  }

  return {
    bonus: array[0] || 0,
    htr_amount: array[1] || 0,
    withdrawal_time: array[2] || 0,
    has_position: Boolean(array[3] || false),
    fee_amount: array[4] || 0,
    deposit_amount: array[5] || 0,
    protocol_fee: array[6] || 0,
  }
}

/**
 * Parse UserProfitInfo NamedTuple array to object
 * Contract definition: [current_value_usd, initial_value_usd, profit_amount_usd, profit_percentage, last_action_timestamp]
 */
export function parseUserProfitInfo(array: any[]): UserProfitInfo {
  if (!Array.isArray(array) || array.length !== 5) {
    throw new Error('Invalid UserProfitInfo array format')
  }

  return {
    current_value_usd: array[0] || 0,
    initial_value_usd: array[1] || 0,
    profit_amount_usd: array[2] || 0,
    profit_percentage: array[3] || 0,
    last_action_timestamp: array[4] || 0,
  }
}

/**
 * Parse QuoteSingleTokenResult NamedTuple array to object
 * Contract definition: [liquidity_amount, token_a_used, token_b_used, excess_token, excess_amount, swap_amount, swap_output, price_impact]
 */
export function parseQuoteSingleTokenResult(array: any[]): QuoteSingleTokenResult {
  if (!Array.isArray(array) || array.length !== 8) {
    throw new Error('Invalid QuoteSingleTokenResult array format')
  }

  return {
    liquidity_amount: array[0] || 0,
    token_a_used: array[1] || 0,
    token_b_used: array[2] || 0,
    excess_token: array[3] || '',
    excess_amount: array[4] || 0,
    swap_amount: array[5] || 0,
    swap_output: array[6] || 0,
    price_impact: array[7] || 0,
  }
}

/**
 * Parse QuoteRemoveSingleTokenResult NamedTuple array to object
 * Contract definition: [amount_out, token_a_withdrawn, token_b_withdrawn, swap_amount, swap_output, price_impact, user_liquidity]
 */
export function parseQuoteRemoveSingleTokenResult(array: any[]): QuoteRemoveSingleTokenResult {
  if (!Array.isArray(array) || array.length !== 7) {
    throw new Error('Invalid QuoteRemoveSingleTokenResult array format')
  }

  return {
    amount_out: array[0] || 0,
    token_a_withdrawn: array[1] || 0,
    token_b_withdrawn: array[2] || 0,
    swap_amount: array[3] || 0,
    swap_output: array[4] || 0,
    price_impact: array[5] || 0,
    user_liquidity: array[6] || 0,
  }
}