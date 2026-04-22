import { CANDLE_INTERVAL_MS, TIME_RANGE_MS } from './constants'
import type { ChartTimeRange } from './types'

export function generateCandleTimestamps(timeRange: ChartTimeRange = '24h'): number[] {
  const now = Date.now()
  const timeRangeMs = TIME_RANGE_MS[timeRange]
  const candleIntervalMs = CANDLE_INTERVAL_MS[timeRange]

  const candleCount = Math.ceil(timeRangeMs / candleIntervalMs)
  const endAligned = Math.ceil(now / candleIntervalMs) * candleIntervalMs
  const startTime = endAligned - candleCount * candleIntervalMs

  const timestamps: number[] = []
  for (let i = 0; i < candleCount; i++) {
    timestamps.push(startTime + i * candleIntervalMs)
  }
  return timestamps
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
