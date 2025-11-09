/**
 * Price Impact Utilities
 *
 * These utilities calculate and categorize price impact for swap operations.
 * Used across swap and liquidity interfaces to protect users from unfavorable trades.
 */

// Price impact thresholds (in percentages)
export const ALLOWED_PRICE_IMPACT_LOW = 1
export const ALLOWED_PRICE_IMPACT_MEDIUM = 3
export const ALLOWED_PRICE_IMPACT_HIGH = 5
export const PRICE_IMPACT_WITHOUT_FEE_CONFIRM_MIN = 10
export const BLOCKED_PRICE_IMPACT_NON_EXPERT = 15

const IMPACT_TIERS = [
  BLOCKED_PRICE_IMPACT_NON_EXPERT,
  ALLOWED_PRICE_IMPACT_HIGH,
  ALLOWED_PRICE_IMPACT_MEDIUM,
  ALLOWED_PRICE_IMPACT_LOW,
]

export type WarningSeverity = 0 | 1 | 2 | 3 | 4

/**
 * Determines the severity level of a price impact percentage
 * @param priceImpact - Price impact as a percentage (e.g., 5.2 for 5.2%)
 * @returns Severity level from 0 (low/acceptable) to 4 (blocked in non-expert mode)
 *
 * Severity levels:
 * - 0: < 1% (no warning)
 * - 1: 1-3% (low warning)
 * - 2: 3-5% (medium warning)
 * - 3: 5-15% (high warning)
 * - 4: >= 15% (blocked unless expert mode)
 */
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
 *
 * Formula: ((inputUSD - outputUSD) / inputUSD) * 100
 *
 * This measures the percentage loss in USD value between what you're trading
 * and what you're receiving.
 *
 * @param inputAmount - The amount being traded in
 * @param outputAmount - The amount being received
 * @param inputTokenPrice - USD price per unit of input token
 * @param outputTokenPrice - USD price per unit of output token
 * @returns Price impact percentage (e.g., 5.2 for 5.2% impact), or undefined if insufficient data
 *
 * @example
 * // Trading 100 tokens worth $1 each for 95 tokens worth $1 each
 * calculateUSDPriceImpact(100, 95, 1, 1) // Returns 5 (5% price impact)
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
