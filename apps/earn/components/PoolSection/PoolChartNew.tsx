import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Typography, classNames } from '@dozer/ui'
import { formatUSD, formatPercent } from '@dozer/format'
import { Pair } from '@dozer/api'
import { api } from '../../utils/api'
import { format } from 'date-fns'
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  LineData,
  UTCTimestamp,
  LineSeries,
  BarSeries,
  HistogramSeries,
  AreaSeries,
} from 'lightweight-charts'
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../tailwind.config.js'

const tailwind = resolveConfig(tailwindConfig)

// Time range options in seconds
export const TIME_RANGES = {
  '1H': 60 * 60,
  '24H': 24 * 60 * 60,
  '7D': 7 * 24 * 60 * 60,
  '30D': 30 * 24 * 60 * 60,
  '90D': 90 * 24 * 60 * 60,
  ALL: 365 * 24 * 60 * 60, // 1 year as fallback
} as const

export type TimeRangeOption = keyof typeof TIME_RANGES

// Pool chart metrics
enum PoolChartType {
  Volume = 'volume',
  TVL = 'tvl',
  APR = 'apr',
}

// Transform timestamp for chart - ensures proper formatting
const transformTimestamp = (timestamp: number): UTCTimestamp => {
  // If timestamp is too small (like in the screenshot), it's likely
  // not a proper Unix timestamp - we need to convert to actual current time
  if (timestamp < 100000000) {
    // Arbitrary small threshold
    // This is a special case, we need to use current date and apply offset
    const now = Math.floor(Date.now() / 1000)
    // Use current time but keep the relative offset between points
    return (now - (30 - (timestamp % 30))) as UTCTimestamp
  }

  // Regular Unix timestamp, just ensure it's in seconds not milliseconds
  if (timestamp > 10000000000) {
    // If in milliseconds
    return Math.floor(timestamp / 1000) as UTCTimestamp
  }

  // Already in seconds
  return timestamp as UTCTimestamp
}

// Calculate appropriate interval based on time range
const getIntervalForTimeRange = (rangeSecs: number): string => {
  if (rangeSecs <= 1 * 60 * 60) return '1m' // <= 1 hour: 1 minute intervals
  if (rangeSecs <= 24 * 60 * 60) return '5m' // <= 24 hours: 5 minute intervals
  if (rangeSecs <= 7 * 24 * 60 * 60) return '1h' // <= 7 days: 1 hour intervals
  if (rangeSecs <= 30 * 24 * 60 * 60) return '4h' // <= 30 days: 4 hour intervals
  if (rangeSecs <= 90 * 24 * 60 * 60) return '1d' // <= 90 days: 1 day intervals
  return '1d' // > 90 days: 1 day intervals
}

interface PoolChartProps {
  pair: Pair
}

export const PoolChartNew: React.FC<PoolChartProps> = ({ pair }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const [chartType, setChartType] = useState<PoolChartType>(PoolChartType.Volume)
  const [chart, setChart] = useState<IChartApi | null>(null)
  const [series, setSeries] = useState<ISeriesApi<any> | null>(null)
  const [selectedRange, setSelectedRange] = useState<TimeRangeOption>('7D')
  const [currentValue, setCurrentValue] = useState<number>(0)
  const [formattedTime, setFormattedTime] = useState<string>('')
  const [earnedValue, setEarnedValue] = useState<number>(0)

  // Check if the price service is available
  const { data: isServiceAvailable, isLoading: checkingService } = api.getNewPrices.isAvailable.useQuery(undefined, {
    refetchInterval: 60000, // Check availability every minute
  })

  // Check if the selected pool is available in the price service
  const { data: isPoolAvailable, isLoading: checkingPoolAvailability } = api.getNewPool.isPoolAvailable.useQuery(
    { poolId: pair.id },
    {
      enabled: !!isServiceAvailable && !!pair.id,
      retry: false,
      refetchOnWindowFocus: false,
    }
  )

  // Calculate dynamic time range directly on each render
  const now = Math.floor(Date.now() / 1000)
  const rangeSecs = TIME_RANGES[selectedRange]
  const timeRange = {
    from: now - rangeSecs,
    to: now,
  }

  // Calculate appropriate interval based on selected range and chart type
  const interval = useMemo(() => getIntervalForTimeRange(TIME_RANGES[selectedRange]), [selectedRange])

  // Get chart data from the price service
  const { data: poolChartData, isLoading: loadingChartData } = api.getNewPool.poolChart.useQuery(
    {
      poolId: pair.id,
      from: timeRange.from,
      to: timeRange.to,
      interval,
      metric: chartType,
    },
    {
      enabled: !!isServiceAvailable && isPoolAvailable === true,
      refetchInterval: chartType === PoolChartType.Volume ? 30000 : 15000, // Longer interval for volume data
      staleTime: chartType === PoolChartType.Volume ? 20000 : 0, // Add staleTime for volume to prevent unnecessary refetches
      retry: false,
      refetchOnWindowFocus: false, // Prevent refetching on window focus
      keepPreviousData: true, // Keep previous data while fetching new data
    }
  )

  // Memoize chart options to prevent unnecessary re-renders
  const chartOptions = useMemo(
    () => ({
      layout: {
        background: { type: ColorType.Solid, color: '#1c1917' },
        textColor: '#e7e5e4',
      },
      grid: {
        vertLines: { color: '#292524' },
        horzLines: { color: '#292524' },
      },
      height: 400,
    }),
    []
  )

  // Memoize chart data to prevent unnecessary updates
  const chartData = useMemo(() => {
    if (!poolChartData?.data?.length) {
      return null
    }

    // For volume data, use a more efficient approach
    if (chartType === PoolChartType.Volume) {
      return poolChartData.data
        .map((point) => ({
          time: transformTimestamp(Number(point.time)),
          value: Number(point.value),
        }))
        .sort((a, b) => a.time - b.time)
    }

    // For TVL and APR, ensure unique timestamps
    const uniquePoints = new Map<number, any>()
    poolChartData.data.forEach((point) => {
      const rawTimestamp = Number(point.time)
      const timestamp = transformTimestamp(rawTimestamp)
      uniquePoints.set(Number(timestamp), Number(point.value))
    })

    return Array.from(uniquePoints.entries())
      .sort(([timeA], [timeB]) => Number(timeA) - Number(timeB))
      .map(([time, value]) => ({
        time: Number(time) as UTCTimestamp,
        value: Number(value),
      }))
  }, [poolChartData?.data, chartType])

  // Update current values when chart data changes
  useEffect(() => {
    if (chartData && chartData.length > 0) {
      const firstValue = chartData[0].value
      const lastValue = chartData[chartData.length - 1].value

      setCurrentValue(lastValue)

      if (chartType === PoolChartType.Volume) {
        setEarnedValue(lastValue * (pair.swapFee / 100))
      }

      // Set formatted time for the last data point
      const lastTime = (chartData[chartData.length - 1].time as number) * 1000
      // time is already in seconds in the chart data, so multiply by 1000 for Date
      setFormattedTime(format(new Date(lastTime), 'dd MMM yyyy HH:mm'))
    }
  }, [chartData, chartType, pair.swapFee])

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return

    // Remove old chart if exists
    if (chart) {
      chart.remove()
    }

    // Create chart instance directly
    const chartInstance = createChart(chartContainerRef.current, {
      ...chartOptions,
      width: chartContainerRef.current.clientWidth,
      handleScroll: false,
      handleScale: false,
    })

    // Add price scale formatting
    chartInstance.priceScale('right').applyOptions({
      borderColor: '#292524',
      scaleMargins: {
        top: 0.2,
        bottom: 0.2,
      },
      mode: 0, // Normal mode, not percentage
      entireTextOnly: false,
      autoScale: true,
    })

    // Add time scale formatting
    chartInstance.timeScale().applyOptions({
      borderColor: '#292524',
      timeVisible: true,
      secondsVisible: false,
    })

    setChart(chartInstance)

    // Handle window resize
    const handleResize = () => {
      if (chartContainerRef.current && chartInstance) {
        chartInstance.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chartInstance.remove()
    }
  }, [chartOptions])

  // Keep track of whether the component is mounted
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  // Effect for creating/removing the chart series when chart instance or type changes
  useEffect(() => {
    if (!chart || !isMounted.current) {
      return
    }

    // Store current series to safely remove it
    const currentSeries = series

    // Remove previous series if it exists
    if (currentSeries) {
      try {
        chart.removeSeries(currentSeries)
        setSeries(null)
      } catch (e) {
        // Only log if component is still mounted
        if (isMounted.current) {
          console.error('Error removing previous series:', e)
        }
      }
    }

    // Create new series based on chartType
    try {
      let newSeries

      if (chartType === PoolChartType.Volume) {
        // Create bar series for volume
        newSeries = chart.addSeries(HistogramSeries, {
          color: '#eab308',
          priceFormat: {
            type: 'custom',
            formatter: (price: number) => formatUSD(price),
          },
        })
      } else {
        // Create line series for TVL and APR
        newSeries = chart.addSeries(AreaSeries, {
          lineColor: '#eab308',
          topColor: '#eab308',
          bottomColor: 'rgba(234, 179, 8, 0.1)',
          lineWidth: 2,
          crosshairMarkerVisible: true,
          lastValueVisible: true,
          priceLineVisible: true,
          priceFormat: {
            type: 'custom',
            formatter: (price: number) => (chartType === PoolChartType.APR ? formatPercent(price) : formatUSD(price)),
          },
          // Add area under the line for TVL
          ...(chartType === PoolChartType.TVL
            ? {
                lineType: 0, // 0 = solid
                priceLineVisible: true,
                lastValueVisible: true,
                area: {
                  topColor: 'rgba(234, 179, 8, 0.4)',
                  bottomColor: 'rgba(234, 179, 8, 0.1)',
                  lineColor: 'rgba(234, 179, 8, 1)',
                },
              }
            : {}),
        })
      }

      setSeries(newSeries)

      // Don't recreate series - just update data to prevent flickering
      if (chartData && chartData.length > 0) {
        try {
          // Set the data to the new series
          newSeries.setData(chartData)

          // Always fit content to make sure chart fills the container properly
          chart.timeScale().fitContent()

          // Update current value display
          if (chartType === PoolChartType.Volume) {
            // For bar charts, use the most recent bar
            const lastPoint = chartData[chartData.length - 1]
            setCurrentValue(lastPoint.value)

            if (chartType === PoolChartType.Volume) {
              setEarnedValue(lastPoint.value * (pair.swapFee / 100))
            }

            // Set formatted time
            const timestamp = lastPoint.time as number
            setFormattedTime(format(new Date(timestamp * 1000), 'dd MMM yyyy HH:mm'))
          }
        } catch (error) {
          console.error('Error updating chart data:', error)
        }
      }
    } catch (error) {
      console.error('Error creating or updating chart series:', error)
    }

    // Return cleanup function
    return () => {
      // Only run cleanup if component is still mounted and chart exists
      if (!isMounted.current) return

      // Safely capture current value of series ref to avoid closure issues
      const currentSeries = series
      if (chart && currentSeries) {
        try {
          chart.removeSeries(currentSeries)
          // Don't call setSeries here to avoid state updates on unmounted component
        } catch (e) {
          // Silently ignore errors during unmount
        }
      }
    }
  }, [chart, chartType, chartData, pair.swapFee])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Typography variant="xl" weight={500} className="text-stone-50">
          {chartType === PoolChartType.APR ? formatPercent(currentValue) : formatUSD(currentValue)}
          {chartType === PoolChartType.Volume && (
            <span className="text-sm font-medium text-stone-300">
              <span className="text-xs top-[-2px] relative">•</span> {formatUSD(earnedValue)} earned
            </span>
          )}
        </Typography>
        <Typography variant="sm" className="text-stone-500">
          {formattedTime}
        </Typography>
      </div>

      <div className="flex flex-col justify-between gap-5 md:flex-row">
        {/* Chart type selector */}
        <div className="flex gap-6">
          <button
            onClick={() => {
              // Prevent unnecessary re-renders when already on Volume
              if (chartType !== PoolChartType.Volume) {
                setChartType(PoolChartType.Volume)
              }
            }}
            className={classNames(
              'border-b-[3px] pb-2 font-semibold text-sm',
              chartType === PoolChartType.Volume ? 'text-stone-50 border-yellow' : 'text-stone-500 border-transparent'
            )}
          >
            Volume
          </button>
          <button
            onClick={() => {
              // Prevent unnecessary re-renders when already on TVL
              if (chartType !== PoolChartType.TVL) {
                setChartType(PoolChartType.TVL)
              }
            }}
            className={classNames(
              'border-b-[3px] pb-2 font-semibold text-sm',
              chartType === PoolChartType.TVL ? 'text-stone-50 border-yellow' : 'text-stone-500 border-transparent'
            )}
          >
            TVL
          </button>
          <button
            onClick={() => {
              setChartType(PoolChartType.APR)
              if (selectedRange === '1H' || selectedRange === '24H') setSelectedRange('7D')
            }}
            className={classNames(
              'border-b-[3px] pb-2 font-semibold text-sm',
              chartType === PoolChartType.APR ? 'text-stone-50 border-yellow' : 'text-stone-500 border-transparent'
            )}
          >
            APR
          </button>
        </div>

        {/* Time range selector */}
        <div className="flex gap-4">
          {Object.keys(TIME_RANGES).map((range) => (
            <button
              key={range}
              onClick={() => setSelectedRange(range as TimeRangeOption)}
              disabled={chartType === PoolChartType.APR && (range === '1H' || range === '24H') || 
                       // Disable changing to the current selection to prevent unnecessary re-fetches
                       selectedRange === range}
              className={classNames(
                'font-semibold text-sm',
                selectedRange === range ? 'text-yellow' : 'text-stone-500',
                chartType === PoolChartType.APR && (range === '1H' || range === '24H') ? 'hidden' : ''
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Chart container */}
      <div className="overflow-hidden">
        <div ref={chartContainerRef} style={{ height: '400px' }}>
          {/* Chart will be rendered here */}
          {/* Loading state */}
          {(loadingChartData || !isServiceAvailable || !chart) && (!chartData || chartData.length === 0) && (
            <div className="h-[400px] flex items-center justify-center">
              <Typography>Loading chart data...</Typography>
            </div>
          )}
        </div>

        {/* No data state */}
        {isServiceAvailable &&
          isPoolAvailable === true &&
          !loadingChartData &&
          (!chartData || chartData.length === 0) && (
            <div className="h-[400px] flex items-center justify-center">
              <Typography variant="lg" className="text-amber-500">
                No data available for the selected period.
              </Typography>
            </div>
          )}

        {/* Service unavailable state */}
        {isServiceAvailable === false && (
          <div className="h-[400px] flex items-center justify-center">
            <Typography variant="lg" className="text-amber-500">
              Price service is currently unavailable.
            </Typography>
          </div>
        )}
      </div>
    </div>
  )
}
