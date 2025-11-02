import { formatPercent, formatUSD } from '@dozer/format'
import { Pair } from '@dozer/api'
import {
  classNames,
  Typography,
  ChartV2,
  ChartType,
  ChartPeriod,
  type ChartDataPoint,
} from '@dozer/ui'
import { FC, useState, useMemo } from 'react'
import { api } from 'utils/api'

interface PoolChartProps {
  pair: Pair
}

enum PoolChartType {
  Volume,
  TVL,
  APR,
}

export const PoolChart: FC<PoolChartProps> = ({ pair }) => {
  const [chartType, setChartType] = useState<PoolChartType>(PoolChartType.Volume)
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>(ChartPeriod.WEEK)

  // Fetch historical pool data
  const { data: historicalData, isLoading } = api.getHistory.getPoolHistory.useQuery({
    poolId: pair.id,
    period: chartPeriod,
  })

  // Transform data for chart based on selected type
  const chartData: ChartDataPoint[] = useMemo(() => {
    if (!historicalData?.data) return []

    return historicalData.data.map((point, idx, arr) => {
      let value = 0

      if (chartType === PoolChartType.Volume) {
        // For volume, show incremental volume (delta between points)
        if (idx === 0) {
          value = point.volumeUSD
        } else {
          value = point.volumeUSD - arr[idx - 1].volumeUSD
        }
      } else if (chartType === PoolChartType.TVL) {
        value = point.liquidityUSD
      } else if (chartType === PoolChartType.APR) {
        // Calculate APR from volume and liquidity
        // APR = (daily volume * 365 * fee rate) / liquidity * 100
        const dailyVolume = idx === 0 ? point.volumeUSD : point.volumeUSD - arr[idx - 1].volumeUSD
        const timeInterval = idx === 0 ? 86400 : point.timestamp - arr[idx - 1].timestamp // in seconds
        const dailyVolumeNormalized = (dailyVolume / timeInterval) * 86400 // normalize to 24h
        const feeRate = pair.swapFee / 10000 // convert from basis points to decimal
        value = point.liquidityUSD > 0 ? (dailyVolumeNormalized * 365 * feeRate * 100) / point.liquidityUSD : 0
      }

      return {
        timestamp: point.timestamp,
        value,
        additionalValues: {
          volumeUSD: point.volumeUSD,
          liquidityUSD: point.liquidityUSD,
          feeUSD: point.feeUSD,
          transactionCount: point.transactionCount,
        },
      }
    })
  }, [historicalData, chartType, pair.swapFee])

  // Value formatter based on chart type
  const valueFormatter = (value: number) => {
    if (chartType === PoolChartType.APR) {
      return formatPercent(value / 100) // convert back to decimal for formatter
    }
    return formatUSD(value)
  }

  // Chart configuration based on type
  const chartConfig = useMemo(() => {
    if (chartType === PoolChartType.Volume) {
      return {
        type: ChartType.BAR,
        color: '#EAB308', // yellow-500
        showGradient: false,
        height: 400,
      }
    }

    return {
      type: ChartType.AREA,
      showGradient: true,
      color: '#EAB308', // yellow-500
      smooth: true,
      height: 400,
    }
  }, [chartType])

  // Don't show 1D for APR (not enough data for meaningful APR calculation)
  const availablePeriods = chartType === PoolChartType.APR
    ? [ChartPeriod.WEEK, ChartPeriod.MONTH, ChartPeriod.YEAR, ChartPeriod.ALL]
    : [ChartPeriod.DAY, ChartPeriod.WEEK, ChartPeriod.MONTH, ChartPeriod.YEAR, ChartPeriod.ALL]

  return (
    <div className="flex flex-col gap-6">
      {/* Chart Type Selector */}
      <div className="flex flex-col justify-between gap-5 md:flex-row">
        <div className="flex gap-6">
          <button
            onClick={() => setChartType(PoolChartType.Volume)}
            className={classNames(
              'border-b-[3px] pb-2 font-semibold text-sm transition-colors',
              chartType === PoolChartType.Volume
                ? 'text-stone-50 border-yellow-500'
                : 'text-stone-500 border-transparent hover:text-stone-400'
            )}
          >
            Volume
          </button>
          <button
            onClick={() => setChartType(PoolChartType.TVL)}
            className={classNames(
              'border-b-[3px] pb-2 font-semibold text-sm transition-colors',
              chartType === PoolChartType.TVL
                ? 'text-stone-50 border-yellow-500'
                : 'text-stone-500 border-transparent hover:text-stone-400'
            )}
          >
            TVL
          </button>
          <button
            onClick={() => {
              setChartType(PoolChartType.APR)
              // Switch to week or longer if currently on day
              if (chartPeriod === ChartPeriod.DAY) {
                setChartPeriod(ChartPeriod.WEEK)
              }
            }}
            className={classNames(
              'border-b-[3px] pb-2 font-semibold text-sm transition-colors',
              chartType === PoolChartType.APR
                ? 'text-stone-50 border-yellow-500'
                : 'text-stone-500 border-transparent hover:text-stone-400'
            )}
          >
            APR
          </button>
        </div>
      </div>

      {/* Chart Component */}
      <ChartV2
        data={chartData}
        period={chartPeriod}
        onPeriodChange={(period) => setChartPeriod(period)}
        config={chartConfig}
        isLoading={isLoading}
        showCurrentValue={true}
        showPercentageChange={chartType !== PoolChartType.APR} // Don't show % change for APR
        valueFormatter={valueFormatter}
        showPeriodSelector={true}
        availablePeriods={availablePeriods}
      />

      {/* Additional Info for Volume chart */}
      {chartType === PoolChartType.Volume && chartData.length > 0 && (
        <div className="flex flex-col gap-1">
          <Typography variant="sm" className="text-stone-400">
            <span className="text-xs">•</span> Fees earned:{' '}
            {formatUSD((chartData[chartData.length - 1]?.additionalValues?.feeUSD as number) || 0)}
          </Typography>
        </div>
      )}
    </div>
  )
}
