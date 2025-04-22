import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Container, Typography, Badge, classNames, Skeleton, Link, Button } from '@dozer/ui'
import { api } from '../utils/api'
import { formatUSD, formatPercent, formatHTR } from '@dozer/format'
import { Layout } from '../components/Layout'
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, LineData, Time, UTCTimestamp } from 'lightweight-charts'

// Time range options in seconds
const TIME_RANGES = {
  '1H': 60 * 60,
  '24H': 24 * 60 * 60,
  '7D': 7 * 24 * 60 * 60,
  '30D': 30 * 24 * 60 * 60,
  '90D': 90 * 24 * 60 * 60,
  'ALL': 365 * 24 * 60 * 60, // 1 year
} as const

// Calculate appropriate interval based on time range
const getIntervalForTimeRange = (rangeSecs: number): string => {
  if (rangeSecs <= 24 * 60 * 60) return '5m'        // <= 24 hours: 5 minute intervals
  if (rangeSecs <= 7 * 24 * 60 * 60) return '1h'    // <= 7 days: 1 hour intervals
  if (rangeSecs <= 30 * 24 * 60 * 60) return '4h'   // <= 30 days: 4 hour intervals
  if (rangeSecs <= 90 * 24 * 60 * 60) return '1d'   // <= 90 days: 1 day intervals
  return '1d'                                        // > 90 days: 1 day intervals
}

const PriceTestPage: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const [chartType, setChartType] = useState<'line' | 'candlestick'>('line')
  const [chart, setChart] = useState<IChartApi | null>(null)
  const [series, setSeries] = useState<ISeriesApi<'Line'> | ISeriesApi<'Candlestick'> | null>(null)
  const [selectedRange, setSelectedRange] = useState<keyof typeof TIME_RANGES>('24H')

  // Calculate time range based on selection
  const timeRange = useMemo(() => {
    const now = Math.floor(Date.now() / 1000)
    const rangeSecs = TIME_RANGES[selectedRange]
    return {
      from: now - rangeSecs,
      to: now
    }
  }, [selectedRange])

  // Calculate appropriate interval based on selected range
  const interval = useMemo(() => 
    getIntervalForTimeRange(TIME_RANGES[selectedRange]), 
    [selectedRange]
  )

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

  // Get current prices from both services for comparison
  const { data: oldPrices, isLoading: loadingOldPrices } = api.getPrices.all.useQuery(undefined, {
    refetchInterval: 15000, // Refetch every 15 seconds
  })
  const { data: newPrices, isLoading: loadingNewPrices } = api.getNewPrices.all.useQuery(undefined, {
    enabled: !!isServiceAvailable,
    refetchInterval: 15000, // Refetch every 15 seconds
    retry: false,
  })

  // Get HTR price from both services
  const { data: oldHtrPrice, isLoading: loadingOldHtr } = api.getPrices.htr.useQuery(undefined, {
    refetchInterval: 15000,
  })
  const { data: newHtrPrice, isLoading: loadingNewHtr } = api.getNewPrices.htr.useQuery(undefined, {
    enabled: !!isServiceAvailable,
    refetchInterval: 15000,
    retry: false,
  })

  // Get chart data based on selected type
  const { data: lineChartData, isLoading: loadingLineData } = api.getNewPrices.lineChart.useQuery(
    {
      token: '00', // HTR token
      from: timeRange.from,
      to: timeRange.to,
      interval,
      currency: 'USD',
    },
    {
      enabled: !!isServiceAvailable && chartType === 'line',
      refetchInterval: 15000,
      staleTime: 10000,
      retry: false,
    }
  )

  const { data: candlestickData, isLoading: loadingCandlestickData } = api.getNewPrices.candlestickChart.useQuery(
    {
      token: '00', // HTR token
      from: timeRange.from,
      to: timeRange.to,
      interval,
      currency: 'USD',
    },
    {
      enabled: !!isServiceAvailable && chartType === 'candlestick',
      refetchInterval: 15000,
      staleTime: 10000,
      retry: false,
    }
  )

  // Memoize chart options to prevent unnecessary re-renders
  const chartOptions = useMemo(() => ({
    layout: {
      background: { type: ColorType.Solid, color: '#1c1917' },
      textColor: '#e7e5e4',
    },
    grid: {
      vertLines: { color: '#292524' },
      horzLines: { color: '#292524' },
    },
    height: 400,
  }), [])

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return

    const chartInstance = createChart(chartContainerRef.current, {
      ...chartOptions,
      width: chartContainerRef.current.clientWidth,
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
    if (chartType === 'line' && lineChartData?.data?.length) {
      // Convert, deduplicate and sort data points
      const uniquePoints = new Map<number, number>()
      lineChartData.data.forEach(point => {
        // The timestamp is already in seconds, no need to divide by 1000
        const timestamp = point.time
        // Store full precision value
        uniquePoints.set(timestamp, Number(point.value))
      })

      const sortedData = Array.from(uniquePoints.entries())
        .sort(([timeA], [timeB]) => timeA - timeB)
        .map(([time, value]) => ({
          time: time as UTCTimestamp,
          value: value,
        }))

      return sortedData
    } else if (chartType === 'candlestick' && candlestickData?.data?.length) {
      // Convert, deduplicate and sort candlestick data
      const uniquePoints = new Map<number, CandlestickData<UTCTimestamp>>()
      candlestickData.data.forEach(point => {
        // The timestamp is already in seconds, no need to divide by 1000
        const timestamp = point.time
        uniquePoints.set(timestamp, {
          time: timestamp as UTCTimestamp,
          open: Number(point.open),
          high: Number(point.high),
          low: Number(point.low),
          close: Number(point.close),
        })
      })

      const sortedData = Array.from(uniquePoints.values())
        .sort((a, b) => (a.time as number) - (b.time as number))

      return sortedData
    }
    return null
  }, [chartType, lineChartData?.data, candlestickData?.data])

  // Update chart data when it changes
  useEffect(() => {
    if (!chart || !chartData) return

    // Remove existing series if it exists
    if (series) {
      chart.removeSeries(series)
      setSeries(null)
    }

    try {
      // Create new series based on chart type
      if (chartType === 'line') {
        const lineSeries = chart.addLineSeries({
          color: '#eab308',
          lineWidth: 2,
          crosshairMarkerVisible: true,
          lastValueVisible: true,
          priceLineVisible: true,
          priceFormat: {
            type: 'custom',
            formatter: (price: number) => formatUSD(price)
          },
        })
        lineSeries.setData(chartData as LineData<UTCTimestamp>[])
        setSeries(lineSeries)
      } else {
        const candleSeries = chart.addCandlestickSeries({
          upColor: '#22c55e',
          downColor: '#ef4444',
          borderVisible: false,
          wickUpColor: '#22c55e',
          wickDownColor: '#ef4444',
          priceFormat: {
            type: 'custom',
            formatter: (price: number) => formatUSD(price)
          },
        })
        candleSeries.setData(chartData as CandlestickData<UTCTimestamp>[])
        setSeries(candleSeries)
      }

      // Fit content after a small delay to ensure data is properly loaded
      setTimeout(() => {
        chart.timeScale().fitContent()
      }, 100)
    } catch (error) {
      console.error('Error updating chart:', error)
    }
  }, [chart, chartType, chartData])

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
          
          <div className="flex items-center space-x-2 mb-4">
            <Button
              variant={chartType === 'line' ? 'filled' : 'outlined'}
              onClick={() => setChartType('line')}
            >
              Line
            </Button>
            <Button
              variant={chartType === 'candlestick' ? 'filled' : 'outlined'}
              onClick={() => setChartType('candlestick')}
            >
              Candlestick
            </Button>
          </div>

          <div className="bg-stone-900 p-4 rounded-lg">
            <div ref={chartContainerRef} />
            {(loadingLineData || loadingCandlestickData) && (
              <div className="flex justify-center items-center h-[400px]">
                <Typography>Loading chart data...</Typography>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2">
            <div className="p-6 rounded-lg bg-stone-900">
              <Typography variant="h3" className="mb-4">
                HTR Price Comparison
              </Typography>
              <div className="flex justify-between mb-4">
                <div>
                  <Typography variant="sm" className="text-stone-400">
                    Current System
                  </Typography>
                  {loadingOldHtr ? (
                    <Skeleton.Box className="w-24 h-8 mt-1" />
                  ) : (
                    <Typography variant="lg" weight={600}>
                      {formatUSD(oldHtrPrice || 0)}
                    </Typography>
                  )}
                </div>
                <div>
                  <Typography variant="sm" className="text-stone-400">
                    New Price Service
                  </Typography>
                  {loadingNewHtr || !isServiceAvailable ? (
                    <Skeleton.Box className="w-24 h-8 mt-1" />
                  ) : (
                    <Typography
                      variant="lg"
                      weight={600}
                      className={classNames(
                        (newHtrPrice || 0) === (oldHtrPrice || 0)
                          ? 'text-stone-100'
                          : (newHtrPrice || 0) > (oldHtrPrice || 0)
                          ? 'text-green-400'
                          : 'text-red-400'
                      )}
                    >
                      {formatUSD(newHtrPrice || 0)}
                    </Typography>
                  )}
                </div>
              </div>

              <Typography variant="base" className="mt-4 mb-2 font-semibold">
                Price Difference
              </Typography>
              {loadingOldHtr || loadingNewHtr || !isServiceAvailable ? (
                <Skeleton.Box className="w-40 h-6" />
              ) : oldHtrPrice === newHtrPrice ? (
                <Typography variant="sm">No difference</Typography>
              ) : (
                <Typography variant="sm">
                  {Math.abs((((newHtrPrice || 0) - (oldHtrPrice || 0)) / (oldHtrPrice || 1)) * 100).toFixed(2)}%
                  {(newHtrPrice || 0) > (oldHtrPrice || 0) ? ' higher' : ' lower'}
                </Typography>
              )}
            </div>

            <div className="p-6 rounded-lg bg-stone-900">
              <Typography variant="h3" className="mb-4">
                Token Prices
              </Typography>
              <div className="overflow-hidden overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="py-2 text-left">Token</th>
                      <th className="py-2 text-right">Current System</th>
                      <th className="py-2 text-right">New Service</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingOldPrices || loadingNewPrices || loadingTokenInfo
                      ? [...Array(3)].map((_, i) => (
                          <tr key={i}>
                            <td className="py-2">
                              <Skeleton.Box className="w-20 h-6" />
                            </td>
                            <td className="py-2 text-right">
                              <Skeleton.Box className="w-24 h-6 ml-auto" />
                            </td>
                            <td className="py-2 text-right">
                              <Skeleton.Box className="w-24 h-6 ml-auto" />
                            </td>
                          </tr>
                        ))
                      : Object.keys(oldPrices || {}).map((token) => {
                          const oldPrice = oldPrices?.[token] || 0
                          const newPrice = newPrices?.[token] || 0
                          const tokenData = tokenInfo?.[token]
                          const tokenSymbol = tokenData?.symbol || token

                          return (
                            <tr key={token}>
                              <td className="py-2">
                                {tokenSymbol} {tokenData?.name ? `(${tokenData.name})` : ''}
                              </td>
                              <td className="py-2 text-right">{formatUSD(oldPrice)}</td>
                              <td className="py-2 text-right">
                                <span
                                  className={classNames(
                                    oldPrice === newPrice
                                      ? 'text-stone-100'
                                      : newPrice > oldPrice
                                      ? 'text-green-400'
                                      : 'text-red-400'
                                  )}
                                >
                                  {!isServiceAvailable ? 'N/A' : formatUSD(newPrice)}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-lg bg-stone-900">
            <Typography variant="h3" className="mb-4">
              About the New Price Service
            </Typography>
            <Typography className="mb-2">
              The new price service is designed to improve performance and reduce load on Hathor nodes by:
            </Typography>
            <ul className="pl-6 mb-4 space-y-1 list-disc">
              <li>Using a memory-first approach for price calculation and storage</li>
              <li>Integrating with Hathor Event Queue for real-time updates</li>
              <li>Leveraging block_height parameter for historical data retrieval</li>
              <li>Providing standardized APIs for both current and historical price data</li>
            </ul>
            <Typography>
              This test page helps validate that the new service is functioning correctly and providing comparable data to
              the existing price system.
            </Typography>
          </div>
        </div>
      </Container>
    </Layout>
  )
}

export default PriceTestPage
