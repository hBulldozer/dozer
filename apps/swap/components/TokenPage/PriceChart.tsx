import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Typography, classNames, Button } from '@dozer/ui'
import { formatUSD, formatHTR } from '@dozer/format'
import { api } from '../../utils/api'
import { format } from 'date-fns'
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  LineData,
  UTCTimestamp,
  LineSeries,
  CandlestickSeries,
} from 'lightweight-charts'
import { ArrowIcon } from '@dozer/ui'
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

// Calculate appropriate interval based on time range
const getIntervalForTimeRange = (rangeSecs: number): string => {
  if (rangeSecs <= 1 * 60 * 60) return '1m' // <= 1 hour: 1 minute intervals
  if (rangeSecs <= 24 * 60 * 60) return '5m' // <= 24 hours: 5 minute intervals
  if (rangeSecs <= 7 * 24 * 60 * 60) return '1h' // <= 7 days: 1 hour intervals
  if (rangeSecs <= 30 * 24 * 60 * 60) return '4h' // <= 30 days: 4 hour intervals
  if (rangeSecs <= 90 * 24 * 60 * 60) return '1d' // <= 90 days: 1 day intervals
  return '1d' // > 90 days: 1 day intervals
}

export interface PriceChartProps {
  tokenId: string // Token UUID
  initialChartType?: 'line' | 'candlestick' // Default chart type
  initialTimeRange?: TimeRangeOption // Default time range
  initialCurrency?: 'USD' | 'HTR' // Default currency
  onPriceChange?: (price: number, change: number) => void // Callback for price changes
  height?: number // Chart height
  showControls?: boolean // Show/hide chart controls
  showCurrencyToggle?: boolean // Show/hide currency toggle
  className?: string // Custom styling
  symbol?: string // Token symbol for display
  name?: string // Token name for display
}

const PriceChart: React.FC<PriceChartProps> = ({
  tokenId,
  initialChartType = 'line',
  initialTimeRange = '24H',
  initialCurrency = 'USD',
  onPriceChange,
  height = 400,
  showControls = true,
  showCurrencyToggle = true,
  className = '',
  symbol,
  name,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const [chartType, setChartType] = useState<'line' | 'candlestick'>(initialChartType)
  const [chart, setChart] = useState<IChartApi | null>(null)
  const [series, setSeries] = useState<ISeriesApi<any> | null>(null)
  const [selectedRange, setSelectedRange] = useState<TimeRangeOption>(initialTimeRange)
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'HTR'>(initialCurrency)
  const [priceChange, setPriceChange] = useState<number>(0)
  const [currentPrice, setCurrentPrice] = useState<number>(0)
  const [formattedTime, setFormattedTime] = useState<string>('')

  // Check if the price service is available
  const { data: isServiceAvailable, isLoading: checkingService } = api.getNewPrices.isAvailable.useQuery(undefined, {
    refetchInterval: 60000, // Check availability every minute
  })

  // Check if the selected token is available in the price service
  const { data: isTokenAvailable, isLoading: checkingTokenAvailability } = api.getNewPrices.isTokenAvailable.useQuery(
    { token: tokenId },
    {
      enabled: !!isServiceAvailable && !!tokenId,
      retry: false,
      refetchOnWindowFocus: false,
    }
  )

  // Get token info to display symbol and name
  const { data: tokenInfo, isLoading: loadingTokenInfo } = api.getNewPrices.tokenInfo.useQuery(undefined, {
    enabled: !!isServiceAvailable,
    retry: false,
    refetchInterval: 300000, // Refetch token info every 5 minutes
  })

  // Calculate dynamic time range directly on each render
  const now = Math.floor(Date.now() / 1000)
  const rangeSecs = TIME_RANGES[selectedRange]
  const timeRange = {
    from: now - rangeSecs,
    to: now,
  }

  // Calculate appropriate interval based on selected range
  const interval = useMemo(() => getIntervalForTimeRange(TIME_RANGES[selectedRange]), [selectedRange])

  // Get current price for selected token
  const {
    data: selectedTokenPrice,
    isLoading: loadingSelectedToken,
    error: tokenPriceError,
  } = api.getNewPrices.tokenPrice.useQuery(
    { token: tokenId, currency: selectedCurrency },
    {
      enabled: !!isServiceAvailable && !!tokenId && (isTokenAvailable === true || tokenId === '00'),
      refetchInterval: 15000,
      retry: false,
    }
  )

  // Get chart data based on selected type
  const { data: lineChartData, isLoading: loadingLineData } = api.getNewPrices.lineChart.useQuery(
    {
      token: tokenId,
      from: timeRange.from,
      to: timeRange.to,
      interval,
      currency: selectedCurrency,
    },
    {
      enabled: !!isServiceAvailable && chartType === 'line' && (isTokenAvailable === true || tokenId === '00'),
      refetchInterval: 15000,
      staleTime: 0,
      retry: false,
    }
  )

  const { data: candlestickData, isLoading: loadingCandlestickData } = api.getNewPrices.candlestickChart.useQuery(
    {
      token: tokenId,
      from: timeRange.from,
      to: timeRange.to,
      interval,
      currency: selectedCurrency,
    },
    {
      enabled: !!isServiceAvailable && chartType === 'candlestick' && (isTokenAvailable === true || tokenId === '00'),
      refetchInterval: 15000,
      staleTime: 0,
      retry: false,
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
      height,
    }),
    [height]
  )

  // Memoize chart data to prevent unnecessary updates
  const chartData = useMemo(() => {
    let sortedData: (LineData<UTCTimestamp> | CandlestickData<UTCTimestamp>)[] | null = null

    if (chartType === 'line' && lineChartData?.data?.length) {
      const uniquePoints = new Map<number, number>()
      lineChartData.data.forEach((point) => {
        const timestamp = point.time
        uniquePoints.set(timestamp, Number(point.value))
      })
      sortedData = Array.from(uniquePoints.entries())
        .sort(([timeA], [timeB]) => timeA - timeB)
        .map(([time, value]) => ({ time: time as UTCTimestamp, value: value }))
    } else if (chartType === 'candlestick' && candlestickData?.data?.length) {
      const uniquePoints = new Map<number, CandlestickData<UTCTimestamp>>()
      candlestickData.data.forEach((point) => {
        const timestamp = point.time
        uniquePoints.set(timestamp, {
          time: timestamp as UTCTimestamp,
          open: Number(point.open),
          high: Number(point.high),
          low: Number(point.low),
          close: Number(point.close),
        })
      })
      sortedData = Array.from(uniquePoints.values()).sort((a, b) => (a.time as number) - (b.time as number))
    }
    return sortedData
  }, [chartType, lineChartData?.data, candlestickData?.data])

  // Update current price and change when chart data changes
  useEffect(() => {
    if (chartData && chartData.length > 0) {
      const firstValue =
        chartType === 'line'
          ? (chartData[0] as LineData<UTCTimestamp>).value
          : (chartData[0] as CandlestickData<UTCTimestamp>).open

      const lastValue =
        chartType === 'line'
          ? (chartData[chartData.length - 1] as LineData<UTCTimestamp>).value
          : (chartData[chartData.length - 1] as CandlestickData<UTCTimestamp>).close

      const change = (lastValue - firstValue) / (firstValue !== 0 ? firstValue : 1)

      setCurrentPrice(lastValue)
      setPriceChange(change)

      if (onPriceChange) {
        onPriceChange(lastValue, change)
      }

      // Set the formatted time for the last data point
      const lastTime = (chartData[chartData.length - 1].time as number) * 1000
      setFormattedTime(format(new Date(lastTime), 'dd MMM yyyy HH:mm'))
    } else if (selectedTokenPrice !== null && selectedTokenPrice !== undefined) {
      setCurrentPrice(selectedTokenPrice)
    }
  }, [chartData, chartType, selectedTokenPrice, onPriceChange])

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return

    console.log('Creating chart...')

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

    console.log('Chart created successfully')

    // Add price scale formatting
    chartInstance.priceScale('right').applyOptions({
      borderColor: '#292524',
      scaleMargins: {
        top: 0.2,
        bottom: 0.2,
      },
      mode: 0, // Price scale mode: 0 = Normal (not percentage)
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

  // Effect for creating/removing the chart series when chart instance, type, currency or token changes
  useEffect(() => {
    if (!chart) {
      console.log('No chart instance available for creating series')
      return
    }

    console.log('Creating series, chart instance available:', !!chart)

    // Remove previous series if it exists
    if (series) {
      console.log('Removing previous series')
      try {
        chart.removeSeries(series)
      } catch (e) {
        console.error('Error removing previous series:', e)
      }
    }

    // Create new series based on chartType - USING NEW API
    console.log(`Creating new ${chartType} series using new API`)
    try {
      let newSeries

      if (chartType === 'line') {
        // Create line series with options
        newSeries = chart.addSeries(LineSeries, {
          color: '#eab308',
          lineWidth: 2,
          crosshairMarkerVisible: true,
          lastValueVisible: true,
          priceLineVisible: true,
          priceFormat: {
            type: 'custom',
            formatter: (price: number) => (selectedCurrency === 'USD' ? formatUSD(price) : formatHTR(price)),
          },
        })
        console.log('Line series created')
      } else {
        // Create candlestick series
        newSeries = chart.addSeries(CandlestickSeries, {
          upColor: '#22c55e',
          downColor: '#ef4444',
          borderVisible: false,
          wickUpColor: '#22c55e',
          wickDownColor: '#ef4444',
          priceFormat: {
            type: 'custom',
            formatter: (price: number) => (selectedCurrency === 'USD' ? formatUSD(price) : formatHTR(price)),
          },
        })
        console.log('Candlestick series created')
      }

      setSeries(newSeries)

      // Update data if available
      if (chartData && chartData.length > 0) {
        console.log(`Setting data with ${chartData.length} points`)
        newSeries.setData(chartData)
        chart.timeScale().fitContent()
        console.log('Data set and fitted to content')
      } else {
        console.log('No chart data available to set')
      }
    } catch (error) {
      console.error('Error creating or updating chart series:', error)
    }

    return () => {
      if (chart && series) {
        try {
          chart.removeSeries(series)
          console.log('Series removed in cleanup')
        } catch (e) {
          console.error('Error removing series during cleanup:', e)
        }
      }
    }
  }, [chart, chartType, selectedCurrency, tokenId, chartData])

  // Callback for hover events
  const onMouseOver = useCallback(
    ({ name, value, change }: { name: number; value: number; change: number }) => {
      setCurrentPrice(value)
      setPriceChange(change)
      setFormattedTime(format(new Date(name * 1000), 'dd MMM yyyy HH:mm'))

      if (onPriceChange) {
        onPriceChange(value, change)
      }
    },
    [onPriceChange]
  )

  // Callback for mouse leave events
  const onMouseLeave = useCallback(() => {
    if (chartData && chartData.length > 0) {
      const firstValue =
        chartType === 'line'
          ? (chartData[0] as LineData<UTCTimestamp>).value
          : (chartData[0] as CandlestickData<UTCTimestamp>).open

      const lastValue =
        chartType === 'line'
          ? (chartData[chartData.length - 1] as LineData<UTCTimestamp>).value
          : (chartData[chartData.length - 1] as CandlestickData<UTCTimestamp>).close

      const change = (lastValue - firstValue) / (firstValue !== 0 ? firstValue : 1)

      setCurrentPrice(lastValue)
      setPriceChange(change)

      const lastTime = (chartData[chartData.length - 1].time as number) * 1000
      setFormattedTime(format(new Date(lastTime), 'dd MMM yyyy HH:mm'))

      if (onPriceChange) {
        onPriceChange(lastValue, change)
      }
    }
  }, [chartData, chartType, onPriceChange])

  // Get the token symbol and name for display
  const displaySymbol = useMemo(() => {
    if (symbol) return symbol
    if (tokenInfo && tokenId in tokenInfo) return tokenInfo[tokenId].symbol
    return tokenId === '00' ? 'HTR' : tokenId
  }, [symbol, tokenInfo, tokenId])

  const displayName = useMemo(() => {
    if (name) return name
    if (tokenInfo && tokenId in tokenInfo) return tokenInfo[tokenId].name || ''
    return tokenId === '00' ? 'Hathor' : ''
  }, [name, tokenInfo, tokenId])

  // Determine if we can display HTR or USD based on token
  const canShowHTR = tokenId !== '00' // Can't show HTR price for HTR token
  const canShowUSD = tokenId !== 'hUSDC' // Assuming hUSDC is the USD-pegged token

  return (
    <div className={classNames('flex flex-col gap-6', className)}>
      <div className="flex flex-col gap-1">
        {/* Display current price and change */}
        <div className="flex items-center gap-2">
          <Typography variant="lg" weight={600}>
            {displayName}
          </Typography>
          <Typography variant="lg" weight={600} className="text-stone-400">
            {displaySymbol}
          </Typography>
        </div>
        <Typography variant="h2" weight={600} className="text-stone-50">
          {selectedCurrency === 'USD' ? formatUSD(currentPrice) : formatHTR(currentPrice)}
        </Typography>
        <div className="flex gap-1">
          <Typography variant="lg" weight={500} className="text-stone-400">
            {(priceChange * 100).toFixed(2)}%
          </Typography>
          <ArrowIcon
            type={priceChange < 0 ? 'down' : 'up'}
            className={priceChange < 0 ? 'text-red-500' : 'text-green-500'}
          />
        </div>
        <Typography variant="sm" className="text-stone-500">
          {formattedTime}
        </Typography>
      </div>

      {/* Currency toggle */}
      {showCurrencyToggle && (
        <div className="flex justify-end gap-4 text-right">
          {canShowUSD && (
            <button
              onClick={() => setSelectedCurrency('USD')}
              className={classNames(
                'font-semibold text-xl',
                selectedCurrency === 'USD' ? 'text-yellow-500' : 'text-stone-500'
              )}
            >
              USD
            </button>
          )}
          {canShowHTR && (
            <button
              onClick={() => setSelectedCurrency('HTR')}
              className={classNames(
                'font-semibold text-xl',
                selectedCurrency === 'HTR' ? 'text-yellow-500' : 'text-stone-500'
              )}
            >
              HTR
            </button>
          )}
        </div>
      )}

      {/* Chart display */}
      <div className="p-4 rounded-lg bg-stone-900">
        <div ref={chartContainerRef} style={{ height: `${height}px` }}>
          {/* Chart will be rendered here */}
        </div>

        {/* Loading state */}
        {(loadingLineData || loadingCandlestickData || !isServiceAvailable || !chart) && (
          <div className="mt-4 text-center">
            <Typography>Loading chart data...</Typography>
          </div>
        )}

        {/* Error states */}
        {isServiceAvailable && isTokenAvailable === false && tokenId !== '00' && (
          <div className="mt-4 text-center">
            <Typography variant="lg" weight={600} className="mb-2 text-amber-500">
              No Chart Data Available
            </Typography>
            <Typography className="max-w-md mx-auto">
              Historical chart data for {displaySymbol} in {selectedCurrency}
              is not currently available.
            </Typography>
          </div>
        )}

        {isServiceAvailable &&
          isTokenAvailable === true &&
          ((chartType === 'line' && lineChartData?.data?.length === 0) ||
            (chartType === 'candlestick' && candlestickData?.data?.length === 0)) && (
            <div className="mt-4 text-center">
              <Typography variant="lg" weight={600} className="mb-2 text-amber-500">
                No Data For Selected Period
              </Typography>
              <Typography className="max-w-md mx-auto">Try selecting a different time period.</Typography>
            </div>
          )}
      </div>

      {/* Chart controls */}
      {showControls && (
        <div className="flex flex-col gap-4">
          {/* Chart type toggle */}
          <div className="flex items-center mb-4 space-x-2">
            <Button variant={chartType === 'line' ? 'filled' : 'outlined'} onClick={() => setChartType('line')}>
              Line
            </Button>
            <Button
              variant={chartType === 'candlestick' ? 'filled' : 'outlined'}
              onClick={() => setChartType('candlestick')}
            >
              Candlestick
            </Button>
          </div>

          {/* Time range selector */}
          <div className="flex justify-between px-8 md:px-0 md:gap-4 md:justify-end">
            {Object.keys(TIME_RANGES).map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range as TimeRangeOption)}
                className={classNames(
                  'font-semibold text-xl',
                  selectedRange === range ? 'text-yellow-500' : 'text-stone-500'
                )}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PriceChart
