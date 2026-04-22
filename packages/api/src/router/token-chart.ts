import { z } from 'zod'

import { procedure } from '../trpc'
import {
  CHART_BATCH_DELAY_MS,
  CHART_MAX_STATE_REQUESTS_PER_BATCH,
  generateCandleWindows,
  processBatched,
} from '../utils/chart'
import { parsePoolApiInfo } from '../utils/namedTupleParsers'
import { formatPrice } from './constants'
import { fetchFromPoolManager } from './pool/helpers'

export interface TokenChartPoint {
  time: number
  openUSD: number
  highUSD: number
  lowUSD: number
  closeUSD: number
  openHTR: number
  highHTR: number
  lowHTR: number
  closeHTR: number
  volumeUSD: number
  volumeHTR: number
}

interface PoolVolumeSample {
  volumeToken0: number
  token0PriceUSD: number
  token0PriceHTR: number
}

interface TokenSample {
  priceUSD: number
  priceHTR: number
  pools: Record<string, PoolVolumeSample>
}

async function fetchTokenSample(
  tokenUuid: string,
  poolKeys: string[],
  tsSeconds: number | undefined
): Promise<TokenSample | null> {
  const priceUSDCall = `get_token_price_in_usd("${tokenUuid}")`
  const priceHTRCall = `get_token_price_in_htr("${tokenUuid}")`

  const poolCalls: string[] = []
  const token0PriceUSDCalls: string[] = []
  const token0PriceHTRCalls: string[] = []
  for (const poolKey of poolKeys) {
    const [token0] = poolKey.split('/')
    if (!token0) continue
    poolCalls.push(`front_end_api_pool("${poolKey}")`)
    token0PriceUSDCalls.push(`get_token_price_in_usd("${token0}")`)
    token0PriceHTRCalls.push(`get_token_price_in_htr("${token0}")`)
  }

  try {
    const response = await fetchFromPoolManager(
      [priceUSDCall, priceHTRCall, ...poolCalls, ...token0PriceUSDCalls, ...token0PriceHTRCalls],
      tsSeconds
    )

    const priceUSD = formatPrice(response.calls[priceUSDCall]?.value ?? 0)
    const priceHTR = formatPrice(response.calls[priceHTRCall]?.value ?? 0)

    const pools: Record<string, PoolVolumeSample> = {}
    for (const poolKey of poolKeys) {
      const [token0] = poolKey.split('/')
      if (!token0) continue
      const poolValue = response.calls[`front_end_api_pool("${poolKey}")`]?.value
      if (!poolValue) continue
      const pool = parsePoolApiInfo(poolValue)
      pools[poolKey] = {
        volumeToken0: (pool.volume || 0) / 100,
        token0PriceUSD: formatPrice(response.calls[`get_token_price_in_usd("${token0}")`]?.value ?? 0),
        token0PriceHTR: formatPrice(response.calls[`get_token_price_in_htr("${token0}")`]?.value ?? 0),
      }
    }

    return { priceUSD, priceHTR, pools }
  } catch {
    return null
  }
}

export const tokenChartProcedures = {
  getTokenChartData: procedure
    .input(
      z.object({
        tokenUuid: z.string(),
        timeRange: z.enum(['24h', '3d', '1w']).default('24h'),
      })
    )
    .query(async ({ input }): Promise<TokenChartPoint[]> => {
      const signedResponse = await fetchFromPoolManager(['get_signed_pools()'])
      const allPoolKeys: string[] = signedResponse.calls['get_signed_pools()']?.value || []
      const tokenPoolKeys = allPoolKeys.filter((k) => {
        const [a, b] = k.split('/')
        return a === input.tokenUuid || b === input.tokenUuid
      })
      if (tokenPoolKeys.length === 0) return []

      const windows = generateCandleWindows(input.timeRange)
      if (windows.length === 0) return []

      // Each window has open + intra samples + close. Consecutive windows share a boundary,
      // so we dedupe into a monotonic list of unique second-level timestamps.
      const nowMs = Date.now()
      const sampleSecondsOrdered: number[] = []
      const seen = new Set<number>()
      for (let i = 0; i < windows.length; i++) {
        const w = windows[i]!
        const start = i === 0 ? 0 : 1
        for (let j = start; j < w.sampleMs.length; j++) {
          const s = Math.floor(Math.min(w.sampleMs[j]!, nowMs) / 1000)
          if (!seen.has(s)) {
            seen.add(s)
            sampleSecondsOrdered.push(s)
          }
        }
      }

      const samples = await processBatched(
        sampleSecondsOrdered,
        CHART_MAX_STATE_REQUESTS_PER_BATCH,
        CHART_BATCH_DELAY_MS,
        (tsSeconds) => {
          const isLive = tsSeconds >= Math.floor(nowMs / 1000)
          return fetchTokenSample(input.tokenUuid, tokenPoolKeys, isLive ? undefined : tsSeconds)
        }
      )

      const sampleByTs = new Map<number, TokenSample | null>()
      for (let i = 0; i < sampleSecondsOrdered.length; i++) {
        sampleByTs.set(sampleSecondsOrdered[i]!, samples[i] ?? null)
      }

      // Forward-fill nulls so pre-contract-existence gaps carry a sensible value forward.
      let lastNonNull: TokenSample | null = null
      for (const ts of sampleSecondsOrdered) {
        const s = sampleByTs.get(ts)
        if (s) lastNonNull = s
        else if (lastNonNull) sampleByTs.set(ts, lastNonNull)
      }
      // Back-fill any leading nulls with the first known sample.
      const firstKnown = sampleSecondsOrdered.map((ts) => sampleByTs.get(ts)).find((s) => !!s) ?? null
      if (!firstKnown) return []
      for (const ts of sampleSecondsOrdered) {
        if (!sampleByTs.get(ts)) sampleByTs.set(ts, firstKnown)
      }

      const points: TokenChartPoint[] = []
      for (const w of windows) {
        const windowSamples: TokenSample[] = []
        for (const ms of w.sampleMs) {
          const ts = Math.floor(Math.min(ms, nowMs) / 1000)
          const s = sampleByTs.get(ts)
          if (s) windowSamples.push(s)
        }
        if (windowSamples.length === 0) continue

        const opens = windowSamples[0]!
        const closes = windowSamples[windowSamples.length - 1]!

        let highUSD = opens.priceUSD
        let lowUSD = opens.priceUSD
        let highHTR = opens.priceHTR
        let lowHTR = opens.priceHTR
        for (const s of windowSamples) {
          if (s.priceUSD > highUSD) highUSD = s.priceUSD
          if (s.priceUSD < lowUSD) lowUSD = s.priceUSD
          if (s.priceHTR > highHTR) highHTR = s.priceHTR
          if (s.priceHTR < lowHTR) lowHTR = s.priceHTR
        }

        let volumeUSD = 0
        let volumeHTR = 0
        for (const poolKey of tokenPoolKeys) {
          const open = opens.pools[poolKey]
          const close = closes.pools[poolKey]
          if (!open || !close) continue
          const volDelta = Math.max(0, close.volumeToken0 - open.volumeToken0)
          volumeUSD += volDelta * close.token0PriceUSD
          volumeHTR += volDelta * close.token0PriceHTR
        }

        points.push({
          time: Math.floor(w.closeMs / 1000),
          openUSD: opens.priceUSD,
          highUSD,
          lowUSD,
          closeUSD: closes.priceUSD,
          openHTR: opens.priceHTR,
          highHTR,
          lowHTR,
          closeHTR: closes.priceHTR,
          volumeUSD,
          volumeHTR,
        })
      }

      return points
    }),
}
