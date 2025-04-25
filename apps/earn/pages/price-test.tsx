import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Container, Typography, Badge, classNames, Skeleton, Link, Button, Select } from '@dozer/ui'
import { api } from '../utils/api'
import { formatUSD, formatPercent, formatHTR } from '@dozer/format'
import { Layout } from '../components/Layout'
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  LineData,
  Time,
  UTCTimestamp,
} from 'lightweight-charts'

// Time range options in seconds
const TIME_RANGES = {
  '1H': 60 * 60,
  '24H': 24 * 60 * 60,
  '7D': 7 * 24 * 60 * 60,
  '30D': 30 * 24 * 60 * 60,
  '90D': 90 * 24 * 60 * 60,
  ALL: 365 * 24 * 60 * 60, // 1 year
} as const

// Calculate appropriate interval based on time range
const getIntervalForTimeRange = (rangeSecs: number): string => {
  if (rangeSecs <= 1 * 60 * 60) return '1m' // <= 1 hour: 1 minute intervals
  if (rangeSecs <= 24 * 60 * 60) return '5m' // <= 24 hours: 5 minute intervals
  if (rangeSecs <= 7 * 24 * 60 * 60) return '1h' // <= 7 days: 1 hour intervals
  if (rangeSecs <= 30 * 24 * 60 * 60) return '4h' // <= 30 days: 4 hour intervals
  if (rangeSecs <= 90 * 24 * 60 * 60) return '1d' // <= 90 days: 1 day intervals
  return '1d' // > 90 days: 1 day intervals
}

const PriceTestPage: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const [chartType, setChartType] = useState<'line' | 'candlestick'>('line')
  const [chart, setChart] = useState<IChartApi | null>(null)
  const [series, setSeries] = useState<ISeriesApi<'Line'> | ISeriesApi<'Candlestick'> | null>(null)
  const [selectedRange, setSelectedRange] = useState<keyof typeof TIME_RANGES>('24H')
  const [selectedToken, setSelectedToken] = useState<string>('00')
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD')

  // Calculate dynamic time range directly on each render
  const now = Math.floor(Date.now() / 1000)
  const rangeSecs = TIME_RANGES[selectedRange]
  const timeRange = {
    from: now - rangeSecs,
    to: now,
  }

  // Calculate appropriate interval based on selected range
  const interval = useMemo(() => getIntervalForTimeRange(TIME_RANGES[selectedRange]), [selectedRange])

  // Check if the new price service is available
  const { data: isServiceAvailable, isLoading: checkingService } = api.getNewPrices.isAvailable.useQuery(undefined, {
    refetchInterval: 60000, // Check availability every minute
  })

  // Get token info to map UUIDs to symbols
  const { data: tokenInfo, isLoading: loadingTokenInfo } = api.getNewPrices.tokenInfo.useQuery(undefined, {
    enabled: !!isServiceAvailable,
    retry: false,
    refetchInterval: 300000, // Refetch token info every 5 minutes
  })

  // Get HTR price from both services
  const { data: oldHtrPrice, isLoading: loadingOldHtr } = api.getPrices.htr.useQuery(undefined, {
    refetchInterval: 15000,
  })
  // Check if the selected token is available in the price service
  const { data: isTokenAvailable, isLoading: checkingTokenAvailability } = api.getNewPrices.isTokenAvailable.useQuery(
    { token: selectedToken },
    {
      enabled: !!isServiceAvailable && !!selectedToken,
      retry: false,
      refetchOnWindowFocus: false,
    }
  )

  // Get current price for selected token
  const {
    data: selectedTokenPrice,
    isLoading: loadingSelectedToken,
    error: tokenPriceError,
  } = api.getNewPrices.tokenPrice.useQuery(
    { token: selectedToken, currency: selectedCurrency },
    {
      enabled: !!isServiceAvailable && !!selectedToken && (isTokenAvailable === true || selectedToken === '00'),
      refetchInterval: 15000,
      retry: false,
    }
  )

  const { data: newHtrPrice, isLoading: loadingNewHtr } = api.getNewPrices.htr.useQuery(undefined, {
    enabled: !!isServiceAvailable,
    refetchInterval: 15000,
    retry: false,
  })

  // Get chart data based on selected type
  const { data: lineChartData, isLoading: loadingLineData } = api.getNewPrices.lineChart.useQuery(
    {
      token: selectedToken,
      from: timeRange.from, // Use dynamically calculated range
      to: timeRange.to, // Use dynamically calculated range
      interval,
      currency: selectedCurrency,
    },
    {
      enabled: !!isServiceAvailable && chartType === 'line' && (isTokenAvailable === true || selectedToken === '00'),
      refetchInterval: 15000,
      staleTime: 0, // Treat data as stale immediately
      retry: false,
    }
  )

  const { data: candlestickData, isLoading: loadingCandlestickData } = api.getNewPrices.candlestickChart.useQuery(
    {
      token: selectedToken,
      from: timeRange.from, // Use dynamically calculated range
      to: timeRange.to, // Use dynamically calculated range
      interval,
      currency: selectedCurrency,
    },
    {
      enabled:
        !!isServiceAvailable && chartType === 'candlestick' && (isTokenAvailable === true || selectedToken === '00'),
      refetchInterval: 15000,
      staleTime: 0, // Treat data as stale immediately
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
      height: 400,
    }),
    []
  )

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return

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

    return () => {
      if (chartInstance) {
        chartInstance.remove()
      }
    }
  }, [chartOptions])

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

  // Effect for creating/removing the chart series when chart instance, type, currency or token changes
  useEffect(() => {
    if (!chart) return

    // Remove previous series if it exists (use state variable 'series')
    if (series && chart.removeSeries) {
      try {
        chart.removeSeries(series)
        console.log('Removed previous series.')
      } catch (e) {
        console.error('Error removing previous series:', e)
      }
    }

    let newSeries: ISeriesApi<'Line'> | ISeriesApi<'Candlestick'> | null = null

    // Create new series based on chartType
    if (chartType === 'line') {
      newSeries = chart.addLineSeries({
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
      console.log('Created new Line series.')
    } else {
      // Candlestick
      newSeries = chart.addCandlestickSeries({
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
      console.log('Created new Candlestick series.')
    }
    setSeries(newSeries) // Update state

    // Cleanup function for *this specific effect instance*
    return () => {
      // Remove the 'newSeries' instance when effect re-runs or component unmounts
      if (chart && newSeries && chart.removeSeries) {
        try {
          chart.removeSeries(newSeries)
          console.log('Cleaned up series instance from effect.')
        } catch (e) {
          console.error('Error removing series during cleanup:', e)
        }
      }
    }
  }, [chart, chartType, selectedCurrency, selectedToken]) // Dependencies: chart instance and chart type

  // Effect for updating the series data when the series instance or chartData changes
  // Effect for debugging API responses
  useEffect(() => {
    if (tokenPriceError) {
      console.error('Token price error:', tokenPriceError)
    }

    if (lineChartData) {
      console.log('Line chart data received:', {
        token: lineChartData.token,
        symbol: lineChartData.symbol,
        data: lineChartData.data
          ? `${lineChartData.data.length} points (first: ${JSON.stringify(
              lineChartData.data[0]
            )}, last: ${JSON.stringify(lineChartData.data[lineChartData.data.length - 1])})`
          : 'No data',
      })
    }

    if (candlestickData) {
      console.log('Candlestick data received:', {
        token: candlestickData.token,
        symbol: candlestickData.symbol,
        data: candlestickData.data
          ? `${candlestickData.data.length} points (first: ${JSON.stringify(
              candlestickData.data[0]
            )}, last: ${JSON.stringify(candlestickData.data[candlestickData.data.length - 1])})`
          : 'No data',
      })
    }
  }, [tokenPriceError, lineChartData, candlestickData])

  // Log errors for debugging
  useEffect(() => {
    if (tokenPriceError) {
      console.error('Token price error:', tokenPriceError)
    }
  }, [tokenPriceError])

  useEffect(() => {
    if (!series || !chartData) {
      console.log(`Data update skipped: series=${!!series}, chartData=${!!chartData}`)
      // Optionally clear data if chartData is null/empty
      if (series && !chartData) {
        console.log('Clearing series data as chartData is empty.')
        if (series.seriesType() === 'Line') {
          ;(series as ISeriesApi<'Line'>).setData([])
        } else {
          ;(series as ISeriesApi<'Candlestick'>).setData([])
        }
      }
      return
    }

    try {
      console.log(`Attempting to set chart data (${series.seriesType()}) with ${chartData.length} points...`)
      if (chartData.length > 0) {
        console.log('First point time:', chartData[0].time)
        console.log('Last point time:', chartData[chartData.length - 1].time)
        const lastValue =
          (chartData[chartData.length - 1] as any).value ?? (chartData[chartData.length - 1] as any).close
        console.log('Last point value/close:', lastValue)
      }

      // Use setData with the full dataset
      if (series.seriesType() === 'Line') {
        ;(series as ISeriesApi<'Line'>).setData(chartData as LineData<UTCTimestamp>[])
      } else {
        // Candlestick
        ;(series as ISeriesApi<'Candlestick'>).setData(chartData as CandlestickData<UTCTimestamp>[])
      }

      // Fit content after setting data
      chart?.timeScale().fitContent() // Use optional chaining for safety
      console.log('Applied setData and fitContent.')
    } catch (error) {
      console.error('Error setting chart data:', error)
    }
  }, [series, chartData]) // Dependencies: series instance and processed chart data

  return (
    <Layout>
      <Container className="py-8">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <Typography variant="h1">Price Test</Typography>
            <div className="flex items-center space-x-2">
              {Object.keys(TIME_RANGES).map((range) => (
                <Button
                  key={range}
                  variant={selectedRange === range ? 'filled' : 'outlined'}
                  onClick={() => setSelectedRange(range as keyof typeof TIME_RANGES)}
                  className="px-3 py-1"
                >
                  {range}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center mb-4 space-x-4">
            <div className="w-1/2">
              <Typography variant="sm" className="mb-1">
                Select Token
              </Typography>
              <Select
                value={selectedToken}
                onChange={(value) => setSelectedToken(value)}
                className="w-full"
                button={
                  <Select.Button>
                    {!loadingTokenInfo && tokenInfo && tokenInfo[selectedToken]
                      ? `${tokenInfo[selectedToken].symbol || selectedToken}`
                      : selectedToken === '00'
                      ? 'HTR'
                      : selectedToken}
                  </Select.Button>
                }
              >
                <Select.Options>
                  {!loadingTokenInfo &&
                    tokenInfo &&
                    Object.entries(tokenInfo).map(([uuid, data]) => (
                      <Select.Option key={uuid} value={uuid}>
                        {data.symbol || uuid} {data.name ? `(${data.name})` : ''}
                      </Select.Option>
                    ))}
                  {(loadingTokenInfo || !tokenInfo) && <Select.Option value="00">HTR</Select.Option>}
                </Select.Options>
              </Select>
            </div>
            <div className="w-1/2">
              <Typography variant="sm" className="mb-1">
                Select Currency
              </Typography>
              <Select
                value={selectedCurrency}
                onChange={(value) => setSelectedCurrency(value)}
                className="w-full"
                button={<Select.Button>{selectedCurrency}</Select.Button>}
              >
                <Select.Options>
                  <Select.Option value="USD">USD</Select.Option>
                  <Select.Option value="HTR">HTR</Select.Option>
                </Select.Options>
              </Select>
            </div>
          </div>

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

          <div className="p-4 rounded-lg bg-stone-900">
            <div ref={chartContainerRef} className="relative">
              {/* Show loading only if hooks are loading AND we don't have any chart data yet */}
              {(loadingLineData || loadingCandlestickData) && !chartData && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/90">
                  <Typography>Loading chart data...</Typography>
                </div>
              )}
              {/* Show error message if there's data loading error */}
              {selectedToken !== '00' && (lineChartData?.data?.length === 0 || candlestickData?.data?.length === 0) && (
                <div className="absolute inset-0 z-10 flex justify-center items-center h-[400px] bg-stone-900/80">
                  <div className="text-center">
                    <Typography variant="lg" weight={600} className="mb-2 text-amber-500">
                      No Chart Data Available
                    </Typography>
                    <Typography className="max-w-md">
                      Historical chart data for {tokenInfo?.[selectedToken]?.symbol || selectedToken} in{' '}
                      {selectedCurrency}
                      is not currently available. This feature is fully implemented for HTR token and in development for
                      other tokens.
                    </Typography>
                    <Button variant="filled" className="mt-4" onClick={() => setSelectedToken('00')}>
                      Switch to HTR
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </Layout>
  )
}

export default PriceTestPage
