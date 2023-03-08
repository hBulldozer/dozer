// used for warning states
export const ALLOWED_PRICE_IMPACT_LOW = 0.01
export const ALLOWED_PRICE_IMPACT_MEDIUM = 0.03
export const ALLOWED_PRICE_IMPACT_HIGH = 0.05
// if the price slippage exceeds this number, force the user to type 'confirm' to execute
export const PRICE_IMPACT_WITHOUT_FEE_CONFIRM_MIN = 0.1
// for non expert mode disable swaps above this
export const BLOCKED_PRICE_IMPACT_NON_EXPERT = 0.15

const IMPACT_TIERS = [
  BLOCKED_PRICE_IMPACT_NON_EXPERT,
  ALLOWED_PRICE_IMPACT_HIGH,
  ALLOWED_PRICE_IMPACT_MEDIUM,
  ALLOWED_PRICE_IMPACT_LOW,
]

type WarningSeverity = 0 | 1 | 2 | 3 | 4

export function warningSeverity(priceImpact: number | undefined): WarningSeverity {
  if (!priceImpact) return 4
  let impact: WarningSeverity = IMPACT_TIERS.length as WarningSeverity
  for (const impactLevel of IMPACT_TIERS) {
    if (impactLevel < priceImpact) return impact
    impact--
  }
  return 0
}
