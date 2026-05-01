import { CANDLE_INTERVAL_MS, INTRA_CANDLE_SAMPLES, TIME_RANGE_MS, type ChartTimeRange } from './constants'

export interface CandleWindow {
  /** Unix ms where the candle opens. */
  openMs: number
  /** Unix ms where the candle closes. */
  closeMs: number
  /** Intra-candle sample timestamps in ms (includes openMs, interior samples, closeMs). */
  sampleMs: number[]
}

/**
 * Produce aligned candle windows for a time range. Each window includes the opening timestamp,
 * INTRA_CANDLE_SAMPLES interior samples at evenly-spaced offsets, and the closing timestamp.
 */
export function generateCandleWindows(timeRange: ChartTimeRange = '24h'): CandleWindow[] {
  const now = Date.now()
  const intervalMs = CANDLE_INTERVAL_MS[timeRange]
  const candleCount = Math.ceil(TIME_RANGE_MS[timeRange] / intervalMs)
  const endAligned = Math.ceil(now / intervalMs) * intervalMs
  const startMs = endAligned - candleCount * intervalMs

  const windows: CandleWindow[] = []
  for (let i = 0; i < candleCount; i++) {
    const openMs = startMs + i * intervalMs
    const closeMs = openMs + intervalMs
    const sampleMs: number[] = [openMs]
    for (let s = 1; s <= INTRA_CANDLE_SAMPLES; s++) {
      sampleMs.push(openMs + Math.floor((intervalMs * s) / (INTRA_CANDLE_SAMPLES + 1)))
    }
    // Clamp the close sample to "now" for the live candle so the node doesn't see a future timestamp.
    sampleMs.push(Math.min(closeMs, now))
    windows.push({ openMs, closeMs, sampleMs })
  }
  return windows
}

/** Ordered unique set of timestamps in seconds produced by `generateCandleWindows`. */
export function uniqueSampleSecondsFromWindows(windows: CandleWindow[]): number[] {
  const seen = new Set<number>()
  const result: number[] = []
  for (const w of windows) {
    for (const ms of w.sampleMs) {
      const secs = Math.floor(ms / 1000)
      if (!seen.has(secs)) {
        seen.add(secs)
        result.push(secs)
      }
    }
  }
  return result
}

export async function processBatched<T, R>(
  items: T[],
  batchSize: number,
  delayMs: number,
  processor: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = []
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(processor))
    results.push(...batchResults)
    if (i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
  return results
}
