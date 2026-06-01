export type ChartTimeRange = '24h' | '3d' | '1w'

// Batch size for chart timestamp requests fed into the shared requestQueue.
// Keep at 5 (dev queue concurrency) — this lets other tRPC procedures'
// requests interleave between chart batches instead of being starved.
// Using Promise.all (all 97 at once) dumped them into a FIFO queue and
// blocked byUuidAny / getAllTransactionHistory for 40s.
export const CHART_MAX_STATE_REQUESTS_PER_BATCH = 5
export const CHART_BATCH_DELAY_MS = 0
export const INTRA_CANDLE_SAMPLES = 1  // 1 midpoint sample per candle → proper OHLC (open, mid, close)

export const CANDLE_INTERVAL_MS: Record<ChartTimeRange, number> = {
  '24h': 30 * 60 * 1000,   // 30 min → 48 candles → 97 timestamps  (was 15 min → 193)
  '3d':   2 * 60 * 60 * 1000,  // 2 h  → 36 candles → 73 timestamps  (was 1 h  → 145)
  '1w':   4 * 60 * 60 * 1000,  // 4 h  → 42 candles → 85 timestamps  (unchanged)
}

export const TIME_RANGE_MS: Record<ChartTimeRange, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '3d': 3 * 24 * 60 * 60 * 1000,
  '1w': 7 * 24 * 60 * 60 * 1000,
}
