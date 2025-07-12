// used for warning states
const ALLOWED_PRICE_IMPACT_LOW = 1
const ALLOWED_PRICE_IMPACT_MEDIUM = 3
const ALLOWED_PRICE_IMPACT_HIGH = 5
// if the price slippage exceeds this number, force the user to type 'confirm' to execute
const PRICE_IMPACT_WITHOUT_FEE_CONFIRM_MIN = 10
// for non expert mode disable swaps above this
const BLOCKED_PRICE_IMPACT_NON_EXPERT = 15

const IMPACT_TIERS = [
  BLOCKED_PRICE_IMPACT_NON_EXPERT,
  ALLOWED_PRICE_IMPACT_HIGH,
  ALLOWED_PRICE_IMPACT_MEDIUM,
  ALLOWED_PRICE_IMPACT_LOW,
]

type WarningSeverity = 0 | 1 | 2 | 3 | 4

export function warningSeverity(priceImpact: number | undefined): WarningSeverity {
  if (!priceImpact) return 0
  let impact: WarningSeverity = IMPACT_TIERS.length as WarningSeverity
  for (const impactLevel of IMPACT_TIERS) {
    if (impactLevel < priceImpact) return impact
    impact--
  }
  return 0
}

/**
 * Calculates price impact based on USD values of input and output amounts
 * Formula: ((inputUSD - outputUSD) / inputUSD) * 100
 * @param inputAmount - The amount being traded in
 * @param outputAmount - The amount being received
 * @param inputTokenPrice - USD price per unit of input token
 * @param outputTokenPrice - USD price per unit of output token
 * @returns Price impact percentage, or undefined if insufficient data
 */
export function calculateUSDPriceImpact(
  inputAmount: number | undefined,
  outputAmount: number | undefined,
  inputTokenPrice: number | undefined,
  outputTokenPrice: number | undefined
): number | undefined {
  if (!inputAmount || !outputAmount || !inputTokenPrice || !outputTokenPrice) {
    return undefined
  }

  const inputUSD = inputAmount * inputTokenPrice
  const outputUSD = outputAmount * outputTokenPrice

  if (inputUSD <= 0) {
    return undefined
  }

  return ((inputUSD - outputUSD) / inputUSD) * 100
}
