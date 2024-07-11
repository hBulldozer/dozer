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
