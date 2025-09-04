import { formatTimeAgo } from './transactionUtils'

// Token trading transaction interface
export interface TokenTradingTransaction {
  id: string
  hash: string
  timestamp: number
  timeAgo: string
  type: 'Buy' | 'Sell'
  tokenSymbol: string // The token being traded
  tokenAmount: number // Amount of the target token
  otherTokenSymbol: string // The other token in the trade
  otherTokenAmount: number // Amount of the other token
  totalValue?: string // USD value
  account: string
  success: boolean
  explorerUrl?: string
  isMultiHop: boolean // Flag for multi-hop trades
}

// Original complex transaction structure from API
interface ComplexTransaction {
  id: string
  tx_id: string
  timestamp: number
  method: string
  poolsInvolved?: string[]
  tokensInvolved?: string[]
  tokenSymbols?: Array<{ uuid: string; symbol: string; name: string }>
  success: boolean
  weight: number
  debug?: {
    fullTx?: {
      inputs?: Array<{
        value: number
        token_data?: number
        decoded?: {
          address?: string
        }
        token?: string
      }>
      outputs?: Array<{
        value: number
        token_data?: number
        decoded?: {
          address?: string
        }
        token?: string
      }>
      tokens?: string[]
    }
  }
}

// Helper function to format USD amounts with proper formatting for large numbers
const formatUSD = (amount: number): string => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`
  } else if (amount >= 1000) {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  } else {
    return `$${amount.toFixed(2)}`
  }
}

// Helper function to get token symbol from UUID
const getTokenSymbol = (
  tokenUuid: string,
  tokenSymbols: Array<{ uuid: string; symbol: string; name: string }>
): string => {
  if (tokenUuid === '00') return 'HTR'

  const tokenInfo = tokenSymbols.find((t) => t.uuid === tokenUuid)
  return tokenInfo?.symbol || tokenUuid.substring(0, 8).toUpperCase()
}

// Helper function to determine if a transaction involves the target token
const involvesToken = (complexTx: ComplexTransaction, targetTokenUuid: string): boolean => {
  const tokensInvolved = complexTx.tokensInvolved || []

  // Check tokensInvolved array
  if (tokensInvolved.includes(targetTokenUuid)) {
    return true
  }

  // Also check inputs and outputs directly in case tokensInvolved is incomplete
  const inputs = complexTx.debug?.fullTx?.inputs || []
  const outputs = complexTx.debug?.fullTx?.outputs || []

  // Check if target token appears in any input or output
  const hasTokenInInputs = inputs.some((input) => input.token === targetTokenUuid)
  const hasTokenInOutputs = outputs.some((output) => output.token === targetTokenUuid)

  return hasTokenInInputs || hasTokenInOutputs
}

// Helper function to determine if target token is being bought or sold
const determineTradeSide = (complexTx: ComplexTransaction, targetTokenUuid: string): 'Buy' | 'Sell' | null => {
  const inputs = complexTx.debug?.fullTx?.inputs || []
  const outputs = complexTx.debug?.fullTx?.outputs || []

  // Count target token in inputs and outputs
  let targetTokenInInputs = 0
  let targetTokenInOutputs = 0

  // Check inputs
  inputs.forEach((input) => {
    if (input.token === targetTokenUuid) {
      targetTokenInInputs += input.value
    }
  })

  // Check outputs
  outputs.forEach((output) => {
    if (output.token === targetTokenUuid) {
      targetTokenInOutputs += output.value
    }
  })

  // If more target token in outputs than inputs, it's a Buy
  // If more target token in inputs than outputs, it's a Sell
  if (targetTokenInOutputs > targetTokenInInputs) {
    return 'Buy'
  } else if (targetTokenInInputs > targetTokenInOutputs) {
    return 'Sell'
  }

  return null
}

// Helper function to calculate token amounts for the trade
const calculateTokenAmounts = (
  complexTx: ComplexTransaction,
  targetTokenUuid: string,
  tokenSymbols: Array<{ uuid: string; symbol: string; name: string }>
): { tokenAmount: number; otherTokenSymbol: string; otherTokenAmount: number } => {
  const inputs = complexTx.debug?.fullTx?.inputs || []
  const outputs = complexTx.debug?.fullTx?.outputs || []

  // Get all tokens involved in this transaction
  const allTokens = new Set<string>()
  inputs.forEach((input) => input.token && allTokens.add(input.token))
  outputs.forEach((output) => output.token && allTokens.add(output.token))

  // Find the other token (not the target token)
  const otherTokenUuid = Array.from(allTokens).find((token) => token !== targetTokenUuid)
  const otherTokenSymbol = otherTokenUuid ? getTokenSymbol(otherTokenUuid, tokenSymbols) : 'Unknown'

  // Calculate amounts for target token
  let targetTokenAmount = 0
  inputs.forEach((input) => {
    if (input.token === targetTokenUuid) {
      targetTokenAmount -= input.value / 100 // Convert from cents
    }
  })
  outputs.forEach((output) => {
    if (output.token === targetTokenUuid) {
      targetTokenAmount += output.value / 100 // Convert from cents
    }
  })

  // Calculate amounts for other token
  let otherTokenAmount = 0
  if (otherTokenUuid) {
    inputs.forEach((input) => {
      if (input.token === otherTokenUuid) {
        otherTokenAmount -= input.value / 100 // Convert from cents
      }
    })
    outputs.forEach((output) => {
      if (output.token === otherTokenUuid) {
        otherTokenAmount += output.value / 100 // Convert from cents
      }
    })
  }

  return {
    tokenAmount: Math.abs(targetTokenAmount),
    otherTokenSymbol,
    otherTokenAmount: Math.abs(otherTokenAmount),
  }
}

// Helper function to get sender address
const getSenderAddress = (complexTx: ComplexTransaction): string => {
  // For most transactions, use the first input address
  const firstInput = complexTx.debug?.fullTx?.inputs?.[0]?.decoded?.address
  if (firstInput) {
    return firstInput
  }

  // Fallback: try to find any address in inputs
  const inputs = complexTx.debug?.fullTx?.inputs || []
  for (const input of inputs) {
    if (input.decoded?.address) {
      return input.decoded.address
    }
  }

  return 'Unknown'
}

// Transform complex transaction to token trading format
export function transformToTokenTradingTransaction(
  complexTx: ComplexTransaction,
  targetTokenUuid: string,
  targetTokenSymbol: string,
  pricesUSD?: Record<string, number>
): TokenTradingTransaction | null {
  // Only process swap transactions (including multi-hop)
  if (!complexTx.method.includes('swap')) {
    return null
  }

  // Check if transaction involves the target token
  if (!involvesToken(complexTx, targetTokenUuid)) {
    return null
  }

  // Determine if it's a Buy or Sell
  const tradeSide = determineTradeSide(complexTx, targetTokenUuid)
  if (!tradeSide) {
    return null
  }

  // Get token symbols
  const tokenSymbols = complexTx.tokenSymbols || []

  // Calculate token amounts
  const { tokenAmount, otherTokenSymbol, otherTokenAmount } = calculateTokenAmounts(
    complexTx,
    targetTokenUuid,
    tokenSymbols
  )

  // Skip if amounts are too small (likely dust or calculation errors)
  if (tokenAmount < 0.01 || otherTokenAmount < 0.01) {
    return null
  }

  // Calculate USD value
  let totalValueUSD = 0
  if (pricesUSD) {
    const targetTokenPrice = pricesUSD[targetTokenUuid] || 0
    const otherTokenPrice = pricesUSD[complexTx.tokensInvolved?.find((t) => t !== targetTokenUuid) || ''] || 0

    // Use the higher value between target token and other token
    const targetTokenValue = tokenAmount * targetTokenPrice
    const otherTokenValue = otherTokenAmount * otherTokenPrice
    totalValueUSD = Math.max(targetTokenValue, otherTokenValue)
  }

  // Get sender address
  const account = getSenderAddress(complexTx)

  // Determine if it's multi-hop
  const isMultiHop: boolean =
    complexTx.method.includes('through_path') ||
    Boolean(complexTx.tokensInvolved && complexTx.tokensInvolved.length > 2)

  return {
    id: complexTx.id,
    hash: complexTx.tx_id,
    timestamp: complexTx.timestamp,
    timeAgo: formatTimeAgo(complexTx.timestamp),
    type: tradeSide,
    tokenSymbol: targetTokenSymbol,
    tokenAmount,
    otherTokenSymbol,
    otherTokenAmount,
    totalValue: totalValueUSD > 0 ? formatUSD(totalValueUSD) : undefined,
    account,
    success: complexTx.success,
    isMultiHop,
  }
}

// Transform array of complex transactions to token trading format
export function transformTokenTradingTransactions(
  complexTransactions: ComplexTransaction[],
  targetTokenUuid: string,
  targetTokenSymbol: string,
  pricesUSD?: Record<string, number>
): TokenTradingTransaction[] {
  return complexTransactions
    .map((tx) => transformToTokenTradingTransaction(tx, targetTokenUuid, targetTokenSymbol, pricesUSD))
    .filter((tx): tx is TokenTradingTransaction => tx !== null)
    .sort((a, b) => b.timestamp - a.timestamp) // Sort by newest first
}
