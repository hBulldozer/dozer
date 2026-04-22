export type ChartTimeRange = '24h' | '3d' | '1w'

export const CHART_MAX_STATE_REQUESTS_PER_BATCH = 10
export const CHART_BATCH_DELAY_MS = 100
export const INTRA_CANDLE_SAMPLES = 3

export const CANDLE_INTERVAL_MS: Record<ChartTimeRange, number> = {
  '24h': 15 * 60 * 1000,
  '3d': 30 * 60 * 1000,
  '1w': 2 * 60 * 60 * 1000,
}

export const TIME_RANGE_MS: Record<ChartTimeRange, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '3d': 3 * 24 * 60 * 60 * 1000,
  '1w': 7 * 24 * 60 * 60 * 1000,
}
