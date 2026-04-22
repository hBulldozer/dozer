import { z } from 'zod'

import { procedure } from '../../trpc'
import {
  CHART_BATCH_DELAY_MS,
  CHART_MAX_STATE_REQUESTS_PER_BATCH,
  generateCandleWindows,
  processBatched,
} from '../../utils/chart'
import { parsePoolApiInfo } from '../../utils/namedTupleParsers'
import { formatPrice } from '../constants'
import { fetchFromPoolManager } from './helpers'

export interface PoolChartPoint {
  time: number
  tvlUSD: number
  volumeDeltaUSD: number
  feesDeltaUSD: number
}

interface SamplePoolState {
  volumeToken0: number
  reserve0: number
  reserve1: number
  token0PriceUSD: number
  token1PriceUSD: number
}

async function fetchPoolSample(
  poolKey: string,
  tokenA: string,
  tokenB: string,
  tsSeconds: number | undefined
): Promise<SamplePoolState | null> {
  const poolCall = `front_end_api_pool("${poolKey}")`
  const priceACall = `get_token_price_in_usd("${tokenA}")`
  const priceBCall = `get_token_price_in_usd("${tokenB}")`
  try {
    const response = await fetchFromPoolManager([poolCall, priceACall, priceBCall], tsSeconds)
    const poolValue = response.calls[poolCall]?.value
    if (!poolValue) return null

    const pool = parsePoolApiInfo(poolValue)
    const token0PriceRaw = response.calls[priceACall]?.value ?? 0
    const token1PriceRaw = response.calls[priceBCall]?.value ?? 0

    return {
      volumeToken0: (pool.volume || 0) / 100,
      reserve0: (pool.reserve0 || 0) / 100,
      reserve1: (pool.reserve1 || 0) / 100,
      token0PriceUSD: formatPrice(token0PriceRaw),
      token1PriceUSD: formatPrice(token1PriceRaw),
    }
  } catch {
    return null
  }
}

export const chartProcedures = {
  getPoolChartData: procedure
    .input(
      z.object({
        poolKey: z.string(),
        timeRange: z.enum(['24h', '3d', '1w']).default('24h'),
      })
    )
    .query(async ({ input }): Promise<PoolChartPoint[]> => {
      const [tokenA, tokenB, feeStr] = input.poolKey.split('/')
      if (!tokenA || !tokenB || !feeStr) {
        throw new Error(`Invalid pool key: ${input.poolKey}`)
      }
      const feeRate = parseInt(feeStr) / 1000

      const windows = generateCandleWindows(input.timeRange)
      if (windows.length === 0) return []

      // Sample at each candle-close timestamp. Add the opening timestamp once at the very start
      // so the first candle has a "previous" cumulative-volume anchor.
      const nowMs = Date.now()
      const sampleTimestamps: number[] = [Math.floor(windows[0]!.openMs / 1000)]
      for (const w of windows) {
        sampleTimestamps.push(Math.floor(Math.min(w.closeMs, nowMs) / 1000))
      }

      const samples = await processBatched(
        sampleTimestamps,
        CHART_MAX_STATE_REQUESTS_PER_BATCH,
        CHART_BATCH_DELAY_MS,
        (tsSeconds) => {
          const isLive = tsSeconds >= Math.floor(nowMs / 1000)
          return fetchPoolSample(input.poolKey, tokenA, tokenB, isLive ? undefined : tsSeconds)
        }
      )

      // Forward-fill nulls so gaps (pre-contract-existence) carry a sensible value forward.
      let lastNonNull: SamplePoolState | null = null
      for (let i = 0; i < samples.length; i++) {
        const s = samples[i]
        if (s) {
          lastNonNull = s
        } else if (lastNonNull) {
          samples[i] = lastNonNull
        }
      }
      // Back-fill any leading nulls with the first known sample (will yield zero deltas anyway).
      if (!samples[0]) {
        const firstKnown = samples.find((s) => s !== null)
        if (!firstKnown) return []
        for (let i = 0; i < samples.length && !samples[i]; i++) {
          samples[i] = firstKnown
        }
      }

      const anchor = samples[0]!
      const points: PoolChartPoint[] = []
      let prevVolumeToken0 = anchor.volumeToken0

      for (let i = 0; i < windows.length; i++) {
        const w = windows[i]!
        const close = samples[i + 1] ?? anchor
        const volumeDeltaToken0 = Math.max(0, close.volumeToken0 - prevVolumeToken0)
        const volumeDeltaUSD = volumeDeltaToken0 * close.token0PriceUSD
        const tvlUSD = close.reserve0 * close.token0PriceUSD + close.reserve1 * close.token1PriceUSD
        const feesDeltaUSD = volumeDeltaUSD * feeRate

        points.push({
          time: Math.floor(w.closeMs / 1000),
          tvlUSD,
          volumeDeltaUSD,
          feesDeltaUSD,
        })

        prevVolumeToken0 = close.volumeToken0
      }

      return points
    }),
}
