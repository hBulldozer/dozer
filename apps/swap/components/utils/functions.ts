// Re-export price impact utilities from shared math package
export {
  calculateUSDPriceImpact,
  warningSeverity,
  ALLOWED_PRICE_IMPACT_LOW,
  ALLOWED_PRICE_IMPACT_MEDIUM,
  ALLOWED_PRICE_IMPACT_HIGH,
  PRICE_IMPACT_WITHOUT_FEE_CONFIRM_MIN,
  BLOCKED_PRICE_IMPACT_NON_EXPERT,
  type WarningSeverity,
} from '@dozer/math'
