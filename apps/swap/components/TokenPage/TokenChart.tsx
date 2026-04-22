import { Pair, TokenChartPoint, toToken } from '@dozer/api'
import chains from '@dozer/chain'
import { hathorLib } from '@dozer/nanocontracts'
import {
  ArrowIcon,
  ChartControls,
  ChartHeader,
  chartTheme,
  ChartSkeleton,
  type ChartTimeRange,
  CopyHelper,
  Currency,
  IconButton,
  LightweightChart,
  Link,
  Typography,
} from '@dozer/ui'
import { ArrowTopRightOnSquareIcon, Square2StackIcon } from '@heroicons/react/24/outline'
import { AreaSeries, CandlestickSeries, HistogramSeries, type Time } from 'lightweight-charts'
import { FC, useCallback, useMemo, useState } from 'react'

import { api } from 'utils/api'

type TokenChartMode = 'price' | 'volume'
type PriceStyle = 'candles' | 'area'
type Denomination = 'USD' | 'HTR'

interface TokenChartProps {
  pair: Pair & {
    daySnapshots?: unknown[]
    weekSnapshots?: unknown[]
    hourSnapshots?: unknown[]
  }
  setIsDialogOpen?: (open: boolean) => void
  height?: number
}

const MODE_OPTIONS = [
  { id: 'price' as const, label: 'Price' },
  { id: 'volume' as const, label: 'Volume' },
]

const PRICE_STYLE_OPTIONS = [
  { id: 'candles' as const, label: 'Candles' },
  { id: 'area' as const, label: 'Area' },
]

const USD_HTR_OPTIONS = [
  { id: 'USD' as const, label: 'USD' },
  { id: 'HTR' as const, label: 'HTR' },
]

const formatCompact = (value: number, prefix = '', suffix = ''): string => {
  if (!Number.isFinite(value)) return `${prefix}0${suffix}`
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) return `${prefix}${(value / 1_000_000_000).toFixed(2)}B${suffix}`
  if (abs >= 1_000_000) return `${prefix}${(value / 1_000_000).toFixed(2)}M${suffix}`
  if (abs >= 1_000) return `${prefix}${(value / 1_000).toFixed(2)}K${suffix}`
  return `${prefix}${value.toFixed(2)}${suffix}`
}

const formatPriceValue = (value: number): string => {
  if (!Number.isFinite(value) || value === 0) return '0'
  const abs = Math.abs(value)
  if (abs < 0.0001) return value.toFixed(8)
  if (abs < 0.01) return value.toFixed(6)
  if (abs < 1) return value.toFixed(4)
  return value.toFixed(4)
}

const formatHoverTime = (time: Time): string => {
  const unixSeconds = typeof time === 'number' ? time : 0
  if (!unixSeconds) return ''
  return new Date(unixSeconds * 1000).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const TokenChart: FC<TokenChartProps> = ({ pair, height = 400 }) => {
  const isNative = pair.id.includes('native')
  const token = isNative ? pair.token0 : pair.token1
  const tokenUuid = token.uuid

  const [mode, setMode] = useState<TokenChartMode>('price')
  const [priceStyle, setPriceStyle] = useState<PriceStyle>('candles')
  const [currency, setCurrency] = useState<Denomination>(isNative ? 'USD' : 'HTR')
  const [timeRange, setTimeRange] = useState<ChartTimeRange>('24h')
  const [hoverOHLC, setHoverOHLC] = useState<{ open: number; high: number; low: number; close: number } | null>(null)
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  const [hoverTime, setHoverTime] = useState<string | null>(null)

  const { data, isLoading, isFetching } = api.getTokens.getTokenChartData.useQuery(
    { tokenUuid, timeRange },
    {
      enabled: Boolean(tokenUuid),
    }
  )

  const pickOHLC = useCallback(
    (p: TokenChartPoint) => ({
      time: p.time as Time,
      open: currency === 'USD' ? p.openUSD : p.openHTR,
      high: currency === 'USD' ? p.highUSD : p.highHTR,
      low: currency === 'USD' ? p.lowUSD : p.lowHTR,
      close: currency === 'USD' ? p.closeUSD : p.closeHTR,
    }),
    [currency]
  )

  const candleData = useMemo(() => (data ? data.map(pickOHLC) : []), [data, pickOHLC])

  const areaData = useMemo(
    () => candleData.map((p) => ({ time: p.time, value: p.close })),
    [candleData]
  )

  const volumeData = useMemo(() => {
    if (!data) return []
    return data.map((p) => ({
      time: p.time as Time,
      value: currency === 'USD' ? p.volumeUSD : p.volumeHTR,
    }))
  }, [data, currency])

  const latestValue =
    mode === 'volume'
      ? volumeData[volumeData.length - 1]?.value ?? 0
      : candleData[candleData.length - 1]?.close ?? 0

  const priceChange = useMemo(() => {
    const first = candleData[0]?.open
    const last = candleData[candleData.length - 1]?.close
    if (first === undefined || last === undefined || first === 0) return 0
    return (last - first) / first
  }, [candleData])

  const hoverChange = useMemo(() => {
    if (hoverOHLC === null) return null
    const first = candleData[0]?.open
    if (first === undefined || first === 0) return null
    return (hoverOHLC.close - first) / first
  }, [candleData, hoverOHLC])

  const displayChange = hoverChange ?? priceChange

  const buildSeries = useCallback(
    ({ chart }: { chart: import('lightweight-charts').IChartApi }) => {
      const cleanups: Array<() => void> = []

      if (mode === 'volume') {
        if (volumeData.length === 0) return
        const s = chart.addSeries(HistogramSeries, {
          color: chartTheme.histogram,
          priceFormat: { type: 'volume' },
          priceLineVisible: false,
        })
        s.setData(volumeData)
        cleanups.push(() => {
          try {
            chart.removeSeries(s)
          } catch {
            // ignore
          }
        })
      } else if (priceStyle === 'candles') {
        if (candleData.length === 0) return
        const s = chart.addSeries(CandlestickSeries, {
          upColor: chartTheme.candleUp,
          downColor: chartTheme.candleDown,
          borderUpColor: chartTheme.candleUp,
          borderDownColor: chartTheme.candleDown,
          wickUpColor: chartTheme.candleUp,
          wickDownColor: chartTheme.candleDown,
          priceLineVisible: false,
        })
        s.setData(candleData)
        cleanups.push(() => {
          try {
            chart.removeSeries(s)
          } catch {
            // ignore
          }
        })
      } else {
        if (areaData.length === 0) return
        const s = chart.addSeries(AreaSeries, {
          lineColor: chartTheme.areaLine,
          topColor: chartTheme.areaTop,
          bottomColor: chartTheme.areaBottom,
          lineWidth: 2,
          priceLineVisible: false,
        })
        s.setData(areaData)
        cleanups.push(() => {
          try {
            chart.removeSeries(s)
          } catch {
            // ignore
          }
        })
      }

      return () => cleanups.forEach((fn) => fn())
    },
    [mode, priceStyle, candleData, areaData, volumeData]
  )

  const onCrosshairMove = useCallback(
    ({ time, seriesData }: { time: Time | undefined; seriesData: Map<unknown, unknown> }) => {
      if (!time || seriesData.size === 0) {
        setHoverOHLC(null)
        setHoverValue(null)
        setHoverTime(null)
        return
      }
      const first = Array.from(seriesData.values())[0] as
        | { open?: number; high?: number; low?: number; close?: number; value?: number }
        | undefined
      setHoverTime(formatHoverTime(time))
      if (!first) {
        setHoverOHLC(null)
        setHoverValue(null)
        return
      }
      if (first.open !== undefined && first.high !== undefined && first.low !== undefined && first.close !== undefined) {
        setHoverOHLC({ open: first.open, high: first.high, low: first.low, close: first.close })
        setHoverValue(null)
      } else if (first.value !== undefined) {
        setHoverOHLC(null)
        setHoverValue(first.value)
      }
    },
    []
  )

  const priceFormatter = useCallback(
    (v: number) => (mode === 'volume' ? formatCompact(v, currency === 'USD' ? '$' : '', currency === 'USD' ? '' : ' HTR') : formatPriceValue(v)),
    [mode, currency]
  )

  const currencySymbol = currency === 'USD' ? '$' : ''
  const currencySuffix = currency === 'USD' ? '' : ' HTR'
  const priceFormat: 'compact' | 'price' = mode === 'price' ? 'price' : 'compact'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Currency.Icon currency={toToken(token)} width={32} height={32} />
            <Typography variant="lg" weight={600}>
              {token.name}
            </Typography>
            <Typography variant="lg" weight={600} className="text-stone-400">
              {token.symbol}
            </Typography>
            <div className="flex flex-row items-center gap-2 ml-2">
              <CopyHelper
                toCopy={hathorLib.tokensUtils.getConfigurationString(
                  token.uuid,
                  token.name || '',
                  token.symbol || ''
                )}
                hideIcon={true}
              >
                {(isCopied) => (
                  <IconButton className="p-1 text-stone-400" description={isCopied ? 'Copied!' : 'Configuration String'}>
                    <Square2StackIcon width={20} height={20} color="stone-500" />
                  </IconButton>
                )}
              </CopyHelper>
              <Link.External href={chains[pair.chainId].getTokenUrl(token.uuid)}>
                <IconButton className="p-1 text-stone-400" description="View on explorer">
                  <ArrowTopRightOnSquareIcon width={20} height={20} color="stone-500" />
                </IconButton>
              </Link.External>
            </div>
          </div>
          <Typography variant="sm" className="flex items-center gap-1 text-stone-400">
            <span className={displayChange < 0 ? 'text-red-500' : 'text-green-500'}>
              {(displayChange * 100).toFixed(2)}%
            </span>
            <ArrowIcon type={displayChange < 0 ? 'down' : 'up'} className={displayChange < 0 ? 'text-red-500' : 'text-green-500'} />
            <span className="text-stone-500">over {timeRange}</span>
          </Typography>
        </div>
      </div>

      <div className="rounded-xl border border-stone-700/80 bg-stone-800/40 p-4">
        {isLoading && !data ? (
          <ChartSkeleton height={height} />
        ) : !data || data.length === 0 ? (
          <>
            <ChartHeader
              label={mode === 'price' ? 'Price' : 'Volume'}
              value={0}
              format={priceFormat}
              currencySymbol={currencySymbol}
              currencySuffix={currencySuffix}
            />
            <div
              className="flex items-center justify-center rounded-lg bg-stone-900/40 text-sm text-stone-400"
              style={{ height: `${height}px` }}
            >
              No chart data yet. Will appear once on-chain state history accumulates.
            </div>
          </>
        ) : (
          <>
            <ChartHeader
              label={mode === 'price' ? (priceStyle === 'candles' ? 'Price (OHLC)' : 'Price') : 'Volume'}
              value={latestValue}
              hoverData={
                hoverOHLC
                  ? {
                      time: hoverTime ?? '',
                      open: hoverOHLC.open,
                      high: hoverOHLC.high,
                      low: hoverOHLC.low,
                      close: hoverOHLC.close,
                    }
                  : hoverValue !== null
                  ? { time: hoverTime ?? '', value: hoverValue }
                  : null
              }
              format={priceFormat}
              currencySymbol={currencySymbol}
              currencySuffix={currencySuffix}
              showOHLC={mode === 'price' && priceStyle === 'candles'}
            />
            <div className="relative">
              <LightweightChart
                height={height}
                buildSeries={buildSeries}
                onCrosshairMove={onCrosshairMove}
                priceFormatter={priceFormatter}
                timeRange={timeRange}
                deps={[mode, priceStyle, currency, timeRange, candleData, areaData, volumeData]}
              />
              {isFetching && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded bg-stone-950/15 backdrop-blur-[1px]">
                  <span className="rounded-full bg-stone-900/80 px-3 py-1 text-xs font-medium text-stone-200">
                    Updating chart...
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        <ChartControls
          modes={MODE_OPTIONS}
          mode={mode}
          onModeChange={setMode}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          currencyOptions={USD_HTR_OPTIONS}
          currency={currency}
          onCurrencyChange={setCurrency}
          extraControls={
            mode === 'price' ? (
              <div className="flex gap-0.5 rounded-md bg-stone-800/60 p-0.5 backdrop-blur-sm">
                {PRICE_STYLE_OPTIONS.map((opt) => {
                  const active = opt.id === priceStyle
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPriceStyle(opt.id)}
                      className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                        active ? 'bg-yellow-500 text-stone-900 shadow-sm' : 'text-stone-300 hover:bg-stone-700/60'
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            ) : null
          }
        />
      </div>
    </div>
  )
}
