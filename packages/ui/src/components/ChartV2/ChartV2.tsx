/**
 * ChartV2 - Modern chart component with Uniswap-inspired design
 *
 * Features:
 * - Smooth line/area charts with gradients
 * - Interactive tooltips with crosshair
 * - Period selector
 * - Responsive design
 * - Optimized for performance
 */

import { FC, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { EChartsOption } from 'echarts-for-react/lib/types'
import { format } from 'date-fns'
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../../../../apps/swap/tailwind.config.js'
import { ChartProps, ChartType, ChartPeriod } from './types'
import { classNames } from '../../../index'
import { Skeleton } from '../../../skeleton'

const ReactECharts = dynamic(() => import('echarts-for-react'), {
  ssr: false,
  loading: () => <div className="h-96 bg-stone-800 animate-pulse rounded" />,
})

const tailwind = resolveConfig(tailwindConfig)

const DEFAULT_CONFIG = {
  type: ChartType.AREA,
  showGradient: true,
  color: '#EAB308', // yellow-500
  gradientColor: '#EAB30820', // yellow-500 with 12% opacity
  smooth: true,
  showGrid: false,
  height: 400,
  enableAnimations: true,
}

export const ChartV2: FC<ChartProps> = ({
  data,
  period,
  config = {},
  isLoading = false,
  showPeriodSelector = true,
  availablePeriods = [
    ChartPeriod.DAY,
    ChartPeriod.WEEK,
    ChartPeriod.MONTH,
    ChartPeriod.YEAR,
    ChartPeriod.ALL,
  ],
  onPeriodChange,
  className,
  showCurrentValue = true,
  valueFormatter = (value) => value.toFixed(2),
  showPercentageChange = true,
  onMouseOver,
  onMouseLeave,
}) => {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }

  // Extract x and y data
  const [xData, yData] = useMemo(() => {
    const x = data.map((d) => d.timestamp)
    const y = data.map((d) => d.value)
    return [x, y]
  }, [data])

  // Calculate percentage change
  const percentageChange = useMemo(() => {
    if (yData.length < 2 || yData[0] === 0) return 0
    return ((yData[yData.length - 1] - yData[0]) / yData[0]) * 100
  }, [yData])

  // Handle mouse over for transient updates
  const handleMouseOver = useCallback(
    (params: any) => {
      const dataPoint = data[params.dataIndex]
      if (dataPoint && onMouseOver) {
        onMouseOver(dataPoint)
      }
    },
    [data, onMouseOver]
  )

  // Get axis label format based on period
  const getAxisLabelFormat = useCallback(
    (value: number) => {
      if (config.axisLabelFormatter) {
        return config.axisLabelFormatter(value, period)
      }

      const date = new Date(value * 1000)

      switch (period) {
        case ChartPeriod.DAY:
          return format(date, 'HH:mm')
        case ChartPeriod.WEEK:
          return format(date, 'EEE')
        case ChartPeriod.MONTH:
          return format(date, 'MMM d')
        case ChartPeriod.YEAR:
        case ChartPeriod.ALL:
          return format(date, 'MMM yyyy')
        default:
          return format(date, 'MMM d')
      }
    },
    [period, config.axisLabelFormatter]
  )

  // ECharts configuration
  const chartOption: EChartsOption = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line',
          snap: true,
          label: {
            show: true,
            formatter: (params: any) => {
              if (params.axisDimension === 'x') {
                // Format timestamp for x-axis
                const date = new Date(Number(params.value) * 1000)
                return format(date, 'MMM dd, HH:mm')
              } else {
                // Format price for y-axis - show the actual data value
                return valueFormatter(params.value)
              }
            },
          },
          lineStyle: {
            // @ts-ignore
            color: tailwind.theme.colors.stone['600'],
            width: 1,
            type: 'solid',
          },
        },
        // @ts-ignore
        backgroundColor: tailwind.theme.colors.stone['800'],
        borderWidth: 1,
        // @ts-ignore
        borderColor: tailwind.theme.colors.stone['700'],
        textStyle: {
          // @ts-ignore
          color: tailwind.theme.colors.stone['50'],
          fontSize: 12,
          fontWeight: 600,
        },
        formatter: config.tooltipFormatter || ((params: any) => {
          if (!params || params.length === 0) return ''

          const date = new Date(Number(params[0].name) * 1000)
          const value = params[0].value

          return `<div class="flex flex-col gap-1">
            <span class="text-sm text-stone-50 font-semibold">${valueFormatter(value)}</span>
            <span class="text-xs text-stone-400 font-medium">${
              date instanceof Date && !isNaN(date?.getTime())
                ? format(date, 'MMM dd, yyyy HH:mm')
                : ''
            }</span>
          </div>`
        }),
        extraCssText: 'z-index: 1000; border-radius: 8px; padding: 12px;',
      },
      grid: {
        top: 40,
        left: 20,
        right: 20,
        bottom: 60,
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        boundaryGap: mergedConfig.type === ChartType.BAR,
        data: xData,
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          formatter: getAxisLabelFormat,
          // @ts-ignore
          color: tailwind.theme.colors.stone['400'],
          fontSize: 11,
          fontWeight: 500,
          interval: 'auto',
          showMinLabel: true,
          showMaxLabel: true,
          margin: 16,
          hideOverlap: true,
        },
        splitLine: {
          show: false,
        },
      },
      yAxis: {
        type: 'value',
        show: false,
        scale: true,
      },
      series: [
        {
          name: 'Value',
          type: mergedConfig.type === ChartType.BAR ? 'bar' : 'line',
          data: yData,
          symbol: 'none',
          smooth: mergedConfig.smooth,
          lineStyle: {
            color: mergedConfig.color,
            width: 2,
          },
          itemStyle: {
            color: mergedConfig.color,
            ...(mergedConfig.type === ChartType.BAR && {
              borderRadius: [4, 4, 0, 0],
            }),
          },
          areaStyle: mergedConfig.type === ChartType.AREA && mergedConfig.showGradient
            ? {
                color: {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    {
                      offset: 0,
                      color: mergedConfig.color + '40', // 25% opacity
                    },
                    {
                      offset: 1,
                      color: mergedConfig.gradientColor || mergedConfig.color + '00', // 0% opacity
                    },
                  ],
                },
              }
            : mergedConfig.type === ChartType.AREA
            ? { color: mergedConfig.color + '20' }
            : undefined,
          animation: mergedConfig.enableAnimations,
          animationDuration: 750,
          animationEasing: 'cubicOut',
        },
      ],
    }),
    [
      xData,
      yData,
      mergedConfig,
      config.tooltipFormatter,
      valueFormatter,
      getAxisLabelFormat,
    ]
  )

  return (
    <div className={classNames('flex flex-col gap-4', className)}>
      {/* Current value and percentage change */}
      {showCurrentValue && (
        <>
          {isLoading ? (
            <div className="flex flex-col gap-1">
              <Skeleton.Box className="h-9 w-32" />
              {showPercentageChange && <Skeleton.Box className="h-5 w-24" />}
            </div>
          ) : yData.length > 0 ? (
        <div className="flex flex-col gap-1">
          <div className="text-3xl font-semibold text-stone-50">
            {valueFormatter(yData[yData.length - 1])}
          </div>
          {showPercentageChange && (
            <div className="flex items-center gap-1">
              <span
                className={classNames(
                  'text-sm font-medium',
                  percentageChange >= 0 ? 'text-green-500' : 'text-red-500'
                )}
              >
                {percentageChange >= 0 ? '+' : ''}
                {percentageChange.toFixed(2)}%
              </span>
              <span className="text-xs text-stone-400">
                {period === ChartPeriod.DAY
                  ? 'Past 24h'
                  : period === ChartPeriod.WEEK
                  ? 'Past week'
                  : period === ChartPeriod.MONTH
                  ? 'Past month'
                  : period === ChartPeriod.YEAR
                  ? 'Past year'
                  : 'All time'}
              </span>
            </div>
          )}
        </div>
          ) : null}
        </>
      )}

      {/* Chart */}
      {isLoading ? (
        <div
          className="flex items-center justify-center bg-stone-800/50 rounded relative"
          style={{ height: mergedConfig.height }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-stone-400 font-medium">Loading chart data...</p>
          </div>
        </div>
      ) : !data || data.length === 0 ? (
        <div
          className="flex items-center justify-center bg-stone-800 rounded"
          style={{ height: mergedConfig.height }}
        >
          <p className="text-stone-400">No data available</p>
        </div>
      ) : (
        <div onMouseLeave={onMouseLeave}>
          <ReactECharts
            option={chartOption}
            style={{ height: mergedConfig.height }}
            opts={{ renderer: 'canvas' }}
            onEvents={{
              mouseover: handleMouseOver,
            }}
          />
        </div>
      )}

      {/* Period selector - always visible */}
      {showPeriodSelector && onPeriodChange && (
        <div className="flex justify-center md:justify-end gap-4 px-4">
          {availablePeriods.map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={classNames(
                'font-semibold text-sm transition-colors',
                period === p ? 'text-yellow-500' : 'text-stone-500 hover:text-stone-400'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ChartV2
