import { Pair, PoolChartPoint } from '@dozer/api'
import {
  ChartControls,
  ChartHeader,
  chartTheme,
  ChartSkeleton,
  type ChartTimeRange,
  LightweightChart,
} from '@dozer/ui'
import { AreaSeries, HistogramSeries, type Time } from 'lightweight-charts'
import { FC, useCallback, useMemo, useState } from 'react'

import { api } from '../../utils/api'

type PoolChartMode = 'volume' | 'tvl' | 'fees'

interface PoolChartProps {
  pair: Pair
  height?: number
}

const MODE_OPTIONS = [
  { id: 'volume' as const, label: 'Volume' },
  { id: 'tvl' as const, label: 'TVL' },
  { id: 'fees' as const, label: 'Fees' },
]

const modeToValue = (point: PoolChartPoint, mode: PoolChartMode): number => {
  switch (mode) {
    case 'volume':
      return point.volumeDeltaUSD
    case 'tvl':
      return point.tvlUSD
    case 'fees':
      return point.feesDeltaUSD
  }
}

const formatUSD = (value: number): string => {
  if (!Number.isFinite(value)) return '$0'
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(2)}K`
  return `$${value.toFixed(2)}`
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

export const PoolChart: FC<PoolChartProps> = ({ pair, height = 400 }) => {
  const [mode, setMode] = useState<PoolChartMode>('volume')
  const [timeRange, setTimeRange] = useState<ChartTimeRange>('24h')
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  const [hoverTime, setHoverTime] = useState<string | null>(null)

  const { data, isLoading, isFetching } = api.getPools.getPoolChartData.useQuery(
    { poolKey: pair.id, timeRange },
    {
      enabled: Boolean(pair.id),
    }
  )

  const seriesPoints = useMemo(() => {
    if (!data || data.length === 0) return []
    return data.map((p) => ({ time: p.time as Time, value: modeToValue(p, mode) }))
  }, [data, mode])

  const latestValue = seriesPoints.length > 0 ? (seriesPoints[seriesPoints.length - 1]?.value ?? 0) : 0

  const buildSeries = useCallback(
    ({ chart }: { chart: import('lightweight-charts').IChartApi }) => {
      if (seriesPoints.length === 0) return
      if (mode === 'volume') {
        const series = chart.addSeries(HistogramSeries, {
          color: chartTheme.histogram,
          priceFormat: { type: 'volume' },
          priceLineVisible: false,
        })
        series.setData(seriesPoints)
        return () => {
          try {
            chart.removeSeries(series)
          } catch {
            // ignore — chart already disposed
          }
        }
      }
      const series = chart.addSeries(AreaSeries, {
        lineColor: chartTheme.areaLine,
        topColor: chartTheme.areaTop,
        bottomColor: chartTheme.areaBottom,
        lineWidth: 2,
        priceLineVisible: false,
      })
      series.setData(seriesPoints)
      return () => {
        try {
          chart.removeSeries(series)
        } catch {
          // ignore — chart already disposed
        }
      }
    },
    [mode, seriesPoints]
  )

  const onCrosshairMove = useCallback(
    ({ time, seriesData }: { time: Time | undefined; seriesData: Map<unknown, unknown> }) => {
      if (!time || seriesData.size === 0) {
        setHoverValue(null)
        setHoverTime(null)
        return
      }
      const first = Array.from(seriesData.values())[0] as { value?: number } | undefined
      if (first?.value === undefined) {
        setHoverValue(null)
        setHoverTime(null)
        return
      }
      setHoverValue(first.value)
      setHoverTime(formatHoverTime(time))
    },
    []
  )

  const modeLabel = MODE_OPTIONS.find((m) => m.id === mode)?.label ?? ''

  return (
    <div className="rounded-xl border border-stone-700/80 bg-stone-800/40 p-4">
      {isLoading && !data ? (
        <ChartSkeleton height={height} />
      ) : !data || data.length === 0 ? (
        <>
          <ChartHeader label={modeLabel} value={0} format="compact" currencySymbol="$" />
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
            label={modeLabel}
            value={latestValue}
            hoverData={
              hoverValue !== null
                ? { time: hoverTime ?? '', value: hoverValue }
                : null
            }
            format="compact"
            currencySymbol="$"
          />
          <div className="relative">
            <LightweightChart
              height={height}
              buildSeries={buildSeries}
              onCrosshairMove={onCrosshairMove}
              priceFormatter={formatUSD}
              timeRange={timeRange}
              deps={[mode, timeRange, seriesPoints]}
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
      />
    </div>
  )
}
