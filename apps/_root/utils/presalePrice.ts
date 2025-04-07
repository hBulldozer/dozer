// Presale price configuration constants
export const PRESALE_CONFIG = {
  // Campaign start on April 7, 2025
  START_DATE: new Date('2025-04-07T14:00:00Z'), // 9:00 AM EST in UTC

  // First price increase: Wednesday, April 16, 2025 at 9:00 AM EST
  FIRST_INCREASE_DATE: new Date('2025-04-16T13:00:00Z'), // 9:00 AM EST in UTC

  // Second price increase: Wednesday, April 23, 2025 at 9:00 AM EST
  SECOND_INCREASE_DATE: new Date('2025-04-23T13:00:00Z'), // 9:00 AM EST in UTC

  // Final price increase: Wednesday, April 30, 2025 at 9:00 AM EST
  FINAL_INCREASE_DATE: new Date('2025-04-30T13:00:00Z'), // 9:00 AM EST in UTC

  // Pre-sale end: Monday, May 5, 2025 at 9:00 AM EST
  END_DATE: new Date('2025-05-05T13:00:00Z'), // 9:00 AM EST in UTC

  // Price tiers
  PRICES: {
    INITIAL: 1.0, // Initial price: 1 DZD = 1.00 USD
    TIER_1: 1.05, // First increase: 1 DZD = 1.05 USD
    TIER_2: 1.1, // Second increase: 1 DZD = 1.10 USD
    TIER_3: 1.15, // Final price: 1 DZD = 1.15 USD
  },
}

// Interface for countdown timer
export interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

/**
 * Calculate the current presale price based on the tiered pricing structure
 * @returns {Object} The current price, time until next price increase, and if presale is active
 */
export function calculatePresalePrice(): {
  currentPrice: number
  timeUntilNextStep: TimeLeft
  nextStepDate: Date
  isPresaleActive: boolean
} {
  const now = new Date()
  const currentTime = now.getTime()

  // Default values
  let currentPrice = PRESALE_CONFIG.PRICES.INITIAL
  let nextStepDate = new Date(PRESALE_CONFIG.FIRST_INCREASE_DATE)
  let isPresaleActive = true

  // Time left until next step default values
  let timeUntilNextStep: TimeLeft = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  }

  // Before presale starts
  if (currentTime < PRESALE_CONFIG.START_DATE.getTime()) {
    currentPrice = PRESALE_CONFIG.PRICES.INITIAL
    nextStepDate = new Date(PRESALE_CONFIG.START_DATE)
    isPresaleActive = false

    // Calculate time until start date (not first price increase)
    const timeToStart = PRESALE_CONFIG.START_DATE.getTime() - currentTime
    timeUntilNextStep = calculateTimeLeft(timeToStart)
  }
  // After presale ends
  else if (currentTime >= PRESALE_CONFIG.END_DATE.getTime()) {
    currentPrice = PRESALE_CONFIG.PRICES.TIER_3
    nextStepDate = new Date(PRESALE_CONFIG.END_DATE)
    isPresaleActive = false

    // No countdown needed after end
    timeUntilNextStep = { days: 0, hours: 0, minutes: 0, seconds: 0 }
  }
  // During the presale - determine which price tier applies
  else {
    // Before first price increase
    if (currentTime < PRESALE_CONFIG.FIRST_INCREASE_DATE.getTime()) {
      currentPrice = PRESALE_CONFIG.PRICES.INITIAL
      nextStepDate = new Date(PRESALE_CONFIG.FIRST_INCREASE_DATE)

      const timeToNextStep = PRESALE_CONFIG.FIRST_INCREASE_DATE.getTime() - currentTime
      timeUntilNextStep = calculateTimeLeft(timeToNextStep)
    }
    // Before second price increase
    else if (currentTime < PRESALE_CONFIG.SECOND_INCREASE_DATE.getTime()) {
      currentPrice = PRESALE_CONFIG.PRICES.TIER_1
      nextStepDate = new Date(PRESALE_CONFIG.SECOND_INCREASE_DATE)

      const timeToNextStep = PRESALE_CONFIG.SECOND_INCREASE_DATE.getTime() - currentTime
      timeUntilNextStep = calculateTimeLeft(timeToNextStep)
    }
    // Before final price increase
    else if (currentTime < PRESALE_CONFIG.FINAL_INCREASE_DATE.getTime()) {
      currentPrice = PRESALE_CONFIG.PRICES.TIER_2
      nextStepDate = new Date(PRESALE_CONFIG.FINAL_INCREASE_DATE)

      const timeToNextStep = PRESALE_CONFIG.FINAL_INCREASE_DATE.getTime() - currentTime
      timeUntilNextStep = calculateTimeLeft(timeToNextStep)
    }
    // After final price increase but before presale end
    else {
      currentPrice = PRESALE_CONFIG.PRICES.TIER_3
      nextStepDate = new Date(PRESALE_CONFIG.END_DATE)

      const timeToNextStep = PRESALE_CONFIG.END_DATE.getTime() - currentTime
      timeUntilNextStep = calculateTimeLeft(timeToNextStep)
    }
  }

  return { currentPrice, timeUntilNextStep, nextStepDate, isPresaleActive }
}

/**
 * Helper function to calculate time left components from milliseconds
 */
function calculateTimeLeft(timeInMilliseconds: number): TimeLeft {
  return {
    days: Math.floor(timeInMilliseconds / (1000 * 60 * 60 * 24)),
    hours: Math.floor((timeInMilliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((timeInMilliseconds % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((timeInMilliseconds % (1000 * 60)) / 1000),
  }
}

/**
 * Calculate the next price step after the current step
 * @returns {number} The next price step
 */
export function calculateNextPriceStep(currentPrice: number): number {
  // Return next price tier based on current price
  if (currentPrice === PRESALE_CONFIG.PRICES.INITIAL) {
    return PRESALE_CONFIG.PRICES.TIER_1
  } else if (currentPrice === PRESALE_CONFIG.PRICES.TIER_1) {
    return PRESALE_CONFIG.PRICES.TIER_2
  } else if (currentPrice === PRESALE_CONFIG.PRICES.TIER_2) {
    return PRESALE_CONFIG.PRICES.TIER_3
  } else {
    // If at final price or any other case, return the same price
    return currentPrice
  }
}

/**
 * Format the countdown timer as HH:MM:SS
 * @param {TimeLeft} timeLeft The time left object
 * @returns {string} Formatted countdown string
 */
export function formatCountdown(timeLeft: TimeLeft): string {
  const { days, hours, minutes, seconds } = timeLeft

  if (days > 0) {
    return `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`
  }

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`
}
