import { useCallback, useMemo, useState } from 'react'
import { EChartsOption } from 'echarts-for-react/lib/types'
import dynamic from 'next/dynamic'
import { format } from 'date-fns'
import { classNames } from '../../../index'
import { Typography } from '@dozer/ui'

// Dynamic import for ECharts to avoid SSR issues
const ReactECharts = dynamic(() => import('echarts-for-react'), {
  ssr: false,
  loading: () => <div className="h-96 rounded-lg animate-pulse bg-stone-800" />,
})

export interface PoolAnalyticsChartData {
  time: number
  value: number
  volume_token_a?: number
  volume_token_b?: number
  reserve_a?: number
  reserve_b?: number
  transactions?: number
}

export interface PoolAnalyticsChartProps {
  data: PoolAnalyticsChartData[]
  chartType: 'volume' | 'tvl' | 'apr'
  period?: '1h' | '4h' | '1d' | '1w' | '1m' | '3m' | '6m' | '1y'
  loading?: boolean
  error?: string
  className?: string
  height?: number
  onTypeChange?: (type: 'volume' | 'tvl' | 'apr') => void
  onPeriodChange?: (period: string) => void
  currentValue?: number
  swapFee?: number
}

const CHART_TYPES = [
  { value: 'volume', label: 'Volume' },
  { value: 'tvl', label: 'TVL' },
  { value: 'apr', label: 'APR' },
] as const

const CHART_PERIODS = [
  { value: '1d', label: '1D' },
  { value: '1w', label: '1W' },
  { value: '1m', label: '1M' },
  { value: '3m', label: '3M' },
  { value: '6m', label: '6M' },
  { value: '1y', label: '1Y' },
]

export const PoolAnalyticsChart: React.FC<PoolAnalyticsChartProps> = ({
  data,
  chartType,
  period = '1w',
  loading = false,
  error,
  className,
  height = 400,
  onTypeChange,
  onPeriodChange,
  currentValue,
  swapFee = 0,
}) => {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null)
  const [hoveredTime, setHoveredTime] = useState<number | null>(null)

  // Handle mouse events for updating displayed values
  const onMouseOver = useCallback(({ name, value }: { name: number; value: number }) => {
    setHoveredValue(value)
    setHoveredTime(name)
  }, [])

  const onMouseLeave = useCallback(() => {
    setHoveredValue(null)
    setHoveredTime(null)
  }, [])

  // Format values based on chart type
  const formatValue = useCallback(
    (value: number) => {
      if (chartType === 'apr') {
        return `${(value * 100).toFixed(2)}%`
      } else {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          notation: 'compact',
          maximumFractionDigits: 2,
        }).format(value)
      }
    },
    [chartType]
  )

  const formatTime = useCallback((timestamp: number) => {
    return format(new Date(timestamp * 1000), 'MMM dd, yyyy HH:mm')
  }, [])

  // ECharts configuration
  const chartOptions: EChartsOption = useMemo(() => {
    const xData = data.map((point) => point.time)
    const yData = data.map((point) => point.value)

    return {
      tooltip: {
        trigger: 'axis',
        extraCssText: 'z-index: 1000',
        responsive: true,
        backgroundColor: '#57534e', // stone-600
        textStyle: {
          color: '#f5f5f4', // stone-100
          fontSize: 12,
          fontWeight: 600,
        },
        formatter: (params: any) => {
          const param = params[0]
          if (param) {
            onMouseOver({
              name: param.name,
              value: param.value,
            })

            const date = new Date(Number(param.name * 1000))
            return `<div class="flex flex-col gap-0.5">
              <span class="text-sm font-semibold text-stone-50">${formatValue(param.value)}</span>
              <span class="text-xs font-medium text-stone-400">${
                date instanceof Date && !isNaN(date.getTime()) ? format(date, 'dd MMM yyyy HH:mm') : ''
              }</span>
            </div>`
          }
          return ''
        },
        borderWidth: 0,
      },
      grid: {
        top: 40,
        left: 20,
        right: 20,
        bottom: 60,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: chartType === 'volume', // Use boundary gap for bar charts
        data: xData,
        axisLabel: {
          formatter: (value: number) => {
            return format(
              new Date(value * 1000),
              period === '1d' ? 'HH:mm' : period === '1w' ? 'MMM dd' : period === '1m' ? 'MMM dd' : 'MMM yyyy'
            )
          },
          color: '#a8a29e', // stone-400
        },
        axisLine: {
          lineStyle: {
            color: '#57534e', // stone-600
          },
        },
        axisTick: {
          show: false,
        },
      },
      yAxis: {
        type: 'value',
        scale: true,
        axisLabel: {
          formatter: (value: number) => {
            if (chartType === 'apr') {
              return `${(value * 100).toFixed(1)}%`
            }
            return new Intl.NumberFormat('en-US', {
              notation: 'compact',
              maximumFractionDigits: 1,
            }).format(value)
          },
          color: '#a8a29e', // stone-400
        },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        splitLine: {
          lineStyle: {
            color: '#44403c', // stone-600
            type: 'dashed',
          },
        },
      },
      series: [
        {
          name: chartType.toUpperCase(),
          type: chartType === 'volume' ? 'bar' : 'line',
          data: yData,
          itemStyle: {
            color: chartType === 'volume' ? '#eab308' : '#eab308', // yellow-500
            borderRadius: chartType === 'volume' ? [2, 2, 0, 0] : undefined,
          },
          lineStyle:
            chartType !== 'volume'
              ? {
                  color: '#eab308', // yellow-500
                  width: 2,
                }
              : undefined,
          areaStyle:
            chartType === 'tvl'
              ? {
                  color: {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                      { offset: 0, color: 'rgba(234, 179, 8, 0.4)' },
                      { offset: 1, color: 'rgba(234, 179, 8, 0.05)' },
                    ],
                  },
                }
              : undefined,
          symbol: 'none',
          animationEasing: 'circularInOut',
          animationDurationUpdate: 300,
        },
      ],
    }
  }, [data, chartType, period, formatValue, onMouseOver])

  const displayValue = hoveredValue ?? currentValue ?? (data.length > 0 ? data[data.length - 1]?.value : 0)
  const displayTime = hoveredTime ?? (data.length > 0 ? data[data.length - 1]?.time : Date.now() / 1000)

  if (error) {
    return (
      <div
        className={classNames('flex justify-center items-center rounded-lg bg-stone-900', className)}
        style={{ height }}
      >
        <div className="text-center">
          <Typography variant="lg" className="mb-2 text-red-400">
            Chart Error
          </Typography>
          <Typography variant="sm" className="text-stone-400">
            {error}
          </Typography>
        </div>
      </div>
    )
  }

  return (
    <div className={classNames('flex flex-col space-y-4', className)}>
      {/* Header with controls */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        {/* Chart type selector */}
        <div className="flex space-x-1">
          {CHART_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => onTypeChange?.(type.value)}
              disabled={!onTypeChange}
              className={classNames(
                'px-4 py-2 text-sm font-medium rounded-lg border-b-2 transition-colors',
                chartType === type.value
                  ? 'text-yellow-400 border-yellow-500 bg-stone-800'
                  : 'text-stone-400 border-transparent hover:text-stone-200 hover:bg-stone-800'
              )}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Period selector */}
        {onPeriodChange && (
          <div className="flex space-x-1">
            {CHART_PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => onPeriodChange(p.value)}
                className={classNames(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  period === p.value ? 'bg-yellow-500 text-stone-900' : 'text-stone-400 hover:text-stone-200'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Value display */}
      <div className="flex flex-col space-y-1">
        <Typography variant="xl" weight={600} className="text-stone-50">
          {formatValue(displayValue)}
          {chartType === 'volume' && swapFee > 0 && (
            <span className="ml-3 text-sm font-medium text-stone-300">
              <span className="text-xs relative top-[-2px]">•</span> {formatValue(displayValue * (swapFee / 100))}{' '}
              earned
            </span>
          )}
        </Typography>
        <Typography variant="sm" className="text-stone-500">
          {formatTime(displayTime)}
        </Typography>
      </div>

      {/* Chart container */}
      <div className="relative" onMouseLeave={onMouseLeave}>
        {loading && (
          <div className="flex absolute inset-0 z-10 justify-center items-center rounded-lg backdrop-blur-sm bg-stone-900/50">
            <div className="flex items-center space-x-2 text-stone-400">
              <div className="w-5 h-5 rounded-full border-2 border-yellow-500 animate-spin border-t-transparent" />
              <span>Loading chart data...</span>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-lg border bg-stone-900 border-stone-700">
          <ReactECharts option={chartOptions} style={{ height }} />
        </div>
      </div>
    </div>
  )
}
