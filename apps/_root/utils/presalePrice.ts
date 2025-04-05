// Presale price configuration constants
export const PRESALE_CONFIG = {
  START_DATE: new Date('2025-04-07T00:00:00Z'),
  END_DATE: new Date('2025-05-05T23:59:59Z'),
  START_PRICE: 1.0,
  END_PRICE: 1.3,
  PRICE_STEP_HOURS: 8,
}

// Interface for countdown timer
export interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

/**
 * Calculate the current presale price based on time with 8-hour steps
 * @returns {Object} The current price and time until next price increase
 */
export function calculatePresalePrice(): {
  currentPrice: number
  timeUntilNextStep: TimeLeft
  nextStepDate: Date
} {
  const now = new Date()
  const startTime = PRESALE_CONFIG.START_DATE.getTime()
  const endTime = PRESALE_CONFIG.END_DATE.getTime()
  const currentTime = now.getTime()

  // Time left until next step default values
  let timeUntilNextStep: TimeLeft = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  }

  let currentPrice = PRESALE_CONFIG.START_PRICE
  let nextStepDate = new Date(PRESALE_CONFIG.END_DATE)

  // If before start date, use start price
  if (currentTime <= startTime) {
    currentPrice = PRESALE_CONFIG.START_PRICE
    nextStepDate = new Date(PRESALE_CONFIG.START_DATE)

    // Calculate time until start
    const timeToStart = startTime - currentTime
    timeUntilNextStep = {
      days: Math.floor(timeToStart / (1000 * 60 * 60 * 24)),
      hours: Math.floor((timeToStart % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((timeToStart % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((timeToStart % (1000 * 60)) / 1000),
    }
  }
  // If after end date, use end price
  else if (currentTime >= endTime) {
    currentPrice = PRESALE_CONFIG.END_PRICE
    nextStepDate = new Date(PRESALE_CONFIG.END_DATE)

    // No countdown needed
    timeUntilNextStep = { days: 0, hours: 0, minutes: 0, seconds: 0 }
  }
  // Calculate based on steps
  else {
    try {
      // Calculate how many 8-hour periods have passed
      const totalDuration = endTime - startTime
      const elapsedDuration = currentTime - startTime
      const totalSteps = Math.ceil(totalDuration / (PRESALE_CONFIG.PRICE_STEP_HOURS * 60 * 60 * 1000))
      const elapsedSteps = Math.floor(elapsedDuration / (PRESALE_CONFIG.PRICE_STEP_HOURS * 60 * 60 * 1000))

      // Ensure elapsedSteps is valid
      const safeElapsedSteps = Math.max(0, Math.min(elapsedSteps, totalSteps))

      // Calculate price based on completed steps (not linear but stepped)
      const priceDifference = PRESALE_CONFIG.END_PRICE - PRESALE_CONFIG.START_PRICE
      const pricePerStep = priceDifference / totalSteps
      currentPrice = PRESALE_CONFIG.START_PRICE + safeElapsedSteps * pricePerStep

      // Calculate next step date
      const currentStepEndTime = startTime + (safeElapsedSteps + 1) * PRESALE_CONFIG.PRICE_STEP_HOURS * 60 * 60 * 1000
      nextStepDate = new Date(currentStepEndTime)

      // If next step is after end date, use end date
      if (currentStepEndTime > endTime) {
        nextStepDate = new Date(endTime)
      }

      // Calculate time until next step
      const timeToNextStep = nextStepDate.getTime() - currentTime
      timeUntilNextStep = {
        days: Math.floor(timeToNextStep / (1000 * 60 * 60 * 24)),
        hours: Math.floor((timeToNextStep % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((timeToNextStep % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((timeToNextStep % (1000 * 60)) / 1000),
      }
    } catch (error) {
      console.error('Error calculating price:', error)
      // Fallback to safe values
      currentPrice = PRESALE_CONFIG.START_PRICE
      nextStepDate = new Date(PRESALE_CONFIG.START_DATE)
      timeUntilNextStep = { days: 0, hours: 0, minutes: 0, seconds: 0 }
    }
  }

  // Round price to 2 decimal places and ensure it's valid
  currentPrice = Math.round(currentPrice * 100) / 100

  // Final safety check - ensure price is within bounds
  if (isNaN(currentPrice) || currentPrice < PRESALE_CONFIG.START_PRICE) {
    currentPrice = PRESALE_CONFIG.START_PRICE
  } else if (currentPrice > PRESALE_CONFIG.END_PRICE) {
    currentPrice = PRESALE_CONFIG.END_PRICE
  }

  return { currentPrice, timeUntilNextStep, nextStepDate }
}

/**
 * Calculate the next price step after the current step
 * @returns {number} The next price step
 */
export function calculateNextPriceStep(currentPrice: number): number {
  // Calculate the price step based on config
  const totalDuration = PRESALE_CONFIG.END_DATE.getTime() - PRESALE_CONFIG.START_DATE.getTime()
  const totalSteps = Math.ceil(totalDuration / (PRESALE_CONFIG.PRICE_STEP_HOURS * 60 * 60 * 1000))
  const priceDifference = PRESALE_CONFIG.END_PRICE - PRESALE_CONFIG.START_PRICE
  const pricePerStep = priceDifference / totalSteps

  // Calculate next price
  const nextPrice = Math.min(Math.round((currentPrice + pricePerStep) * 100) / 100, PRESALE_CONFIG.END_PRICE)

  return nextPrice
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
