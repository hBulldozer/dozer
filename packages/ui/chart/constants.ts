import type { ChartTimeRange } from './types'

export const CHART_MAX_STATE_REQUESTS_PER_BATCH = 25
export const CHART_BATCH_DELAY_MS = 0
export const INTRA_CANDLE_SAMPLES = 1

export const CANDLE_INTERVAL_MS: Record<ChartTimeRange, number> = {
  '24h': 15 * 60 * 1000,
  '3d': 60 * 60 * 1000,
  '1w': 4 * 60 * 60 * 1000,
}

export const TIME_RANGE_MS: Record<ChartTimeRange, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '3d': 3 * 24 * 60 * 60 * 1000,
  '1w': 7 * 24 * 60 * 60 * 1000,
}
