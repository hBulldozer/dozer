import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  LineData,
  ColorType,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
} from 'lightweight-charts'
import { classNames } from '../../../index'
import { Typography } from '@dozer/ui'

export interface TokenPriceChartData {
  time: number
  open: number
  high: number
  low: number
  close: number
  value?: number
}

export interface TokenPriceChartProps {
  data: TokenPriceChartData[]
  currency: 'USD' | 'HTR'
  chartType?: 'candlestick' | 'line' | 'area'
  period?: '1h' | '4h' | '1d' | '1w' | '1m' | '3m' | '6m' | '1y'
  loading?: boolean
  error?: string
  className?: string
  height?: number
  onPeriodChange?: (period: string) => void
  onCurrencyChange?: (currency: 'USD' | 'HTR') => void
  currentPrice?: number
  priceChange?: number
}

const CHART_PERIODS = [
  { value: '1h', label: '1H' },
  { value: '4h', label: '4H' },
  { value: '1d', label: '1D' },
  { value: '1w', label: '1W' },
  { value: '1m', label: '1M' },
  { value: '3m', label: '3M' },
  { value: '6m', label: '6M' },
  { value: '1y', label: '1Y' },
]

export const TokenPriceChart: React.FC<TokenPriceChartProps> = ({
  data,
  currency,
  chartType = 'candlestick',
  period = '1d',
  loading = false,
  error,
  className,
  height = 400,
  onPeriodChange,
  onCurrencyChange,
  currentPrice,
  priceChange,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick' | 'Line' | 'Area'> | null>(null)
  const [isLoading, setIsLoading] = useState(loading)

  // Chart configuration
  const chartOptions = useMemo(
    () => ({
      layout: {
        background: { type: ColorType.Solid, color: '#1c1917' }, // stone-900
        textColor: '#f5f5f4', // stone-100
      },
      grid: {
        vertLines: { color: '#44403c' }, // stone-600
        horzLines: { color: '#44403c' }, // stone-600
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#eab308', // yellow-500
          width: 1 as const,
          style: 2 as const,
          visible: true,
          labelVisible: true,
        },
        horzLine: {
          color: '#eab308', // yellow-500
          width: 1 as const,
          style: 2 as const,
          visible: true,
          labelVisible: true,
        },
      },
      rightPriceScale: {
        borderColor: '#57534e', // stone-600
        textColor: '#d6d3d1', // stone-300
      },
      timeScale: {
        borderColor: '#57534e', // stone-600
        textColor: '#d6d3d1', // stone-300
        timeVisible: true,
        secondsVisible: false,
      },
      watermark: {
        visible: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    }),
    []
  )

  // Initialize chart and create series
  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      ...chartOptions,
      width: chartContainerRef.current.clientWidth,
      height,
    })

    chartRef.current = chart

    // Create series immediately after chart creation with a small delay
    const createSeries = () => {
      if (!chartRef.current) return

      try {
        let series: ISeriesApi<'Candlestick' | 'Line' | 'Area'>

        if (chartType === 'candlestick') {
          series = chartRef.current.addSeries(CandlestickSeries, {
            upColor: '#22c55e', // green-500
            downColor: '#ef4444', // red-500
            borderDownColor: '#dc2626', // red-600
            borderUpColor: '#16a34a', // green-600
            wickDownColor: '#dc2626', // red-600
            wickUpColor: '#16a34a', // green-600
          })
        } else if (chartType === 'area') {
          series = chartRef.current.addSeries(AreaSeries, {
            lineColor: '#eab308', // yellow-500
            topColor: 'rgba(234, 179, 8, 0.4)', // yellow-500 with opacity
            bottomColor: 'rgba(234, 179, 8, 0.05)', // yellow-500 with low opacity
            lineWidth: 2,
          })
        } else {
          series = chartRef.current.addSeries(LineSeries, {
            color: '#eab308', // yellow-500
            lineWidth: 2,
          })
        }

        seriesRef.current = series
      } catch (error) {
        console.error('Error creating chart series:', error)
      }
    }

    // Use requestAnimationFrame to ensure chart is fully ready
    requestAnimationFrame(createSeries)

    return () => {
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [chartOptions, height, chartType])

  // Update data
  useEffect(() => {
    if (!seriesRef.current || !data.length) return

    setIsLoading(false)

    try {
      if (chartType === 'candlestick') {
        const candlestickData: CandlestickData[] = data.map((point) => ({
          time: point.time as any, // Convert to Time type
          open: point.open,
          high: point.high,
          low: point.low,
          close: point.close,
        }))
        ;(seriesRef.current as ISeriesApi<'Candlestick'>).setData(candlestickData)
      } else {
        const lineData: LineData[] = data.map((point) => ({
          time: point.time as any, // Convert to Time type
          value: point.close, // Use close price for line/area charts
        }))
        ;(seriesRef.current as ISeriesApi<'Line' | 'Area'>).setData(lineData)
      }

      // Fit content to show all data
      chartRef.current?.timeScale().fitContent()
    } catch (error) {
      console.error('Error updating chart data:', error)
    }
  }, [data, chartType])

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Loading state
  useEffect(() => {
    setIsLoading(loading)
  }, [loading])

  const formatPrice = useCallback(
    (value: number) => {
      if (currency === 'USD') {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        }).format(value)
      } else {
        return `${value.toFixed(8)} HTR`
      }
    },
    [currency]
  )

  const formatPriceChange = useCallback((change: number) => {
    const percentage = (change * 100).toFixed(2)
    return `${change >= 0 ? '+' : ''}${percentage}%`
  }, [])

  if (error) {
    return (
      <div
        className={classNames('flex items-center justify-center bg-stone-900 rounded-lg', className)}
        style={{ height }}
      >
        <div className="text-center">
          <Typography variant="lg" className="text-red-400 mb-2">
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
    <div className={classNames('flex flex-col', className)}>
      {/* Header with price info and controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          {/* Current price and change */}
          {currentPrice !== undefined && (
            <div className="flex items-center space-x-3">
              <Typography variant="xl" weight={600} className="text-stone-50">
                {formatPrice(currentPrice)}
              </Typography>
              {priceChange !== undefined && (
                <div
                  className={classNames(
                    'flex items-center space-x-1 px-2 py-1 rounded-md text-sm font-medium',
                    priceChange >= 0 ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                  )}
                >
                  <span>{formatPriceChange(priceChange)}</span>
                  <svg
                    className={classNames('w-3 h-3', priceChange >= 0 ? 'rotate-0' : 'rotate-180')}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 6.414 6.707 9.707a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          )}

          {/* Currency switcher */}
          {onCurrencyChange && (
            <div className="flex rounded-lg bg-stone-800 p-1">
              {(['USD', 'HTR'] as const).map((curr) => (
                <button
                  key={curr}
                  onClick={() => onCurrencyChange(curr)}
                  className={classNames(
                    'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                    currency === curr ? 'bg-yellow-500 text-stone-900' : 'text-stone-400 hover:text-stone-200'
                  )}
                >
                  {curr}
                </button>
              ))}
            </div>
          )}
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

      {/* Chart container */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm rounded-lg z-10">
            <div className="flex items-center space-x-2 text-stone-400">
              <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
              <span>Loading chart data...</span>
            </div>
          </div>
        )}

        <div
          ref={chartContainerRef}
          className="w-full rounded-lg overflow-hidden border border-stone-700"
          style={{ height }}
        />

        {/* TradingView attribution */}
        <div className="mt-2 text-xs text-stone-500 text-right">
          <span>Powered by </span>
          <a
            href="https://www.tradingview.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-yellow-500 hover:text-yellow-400 underline"
          >
            TradingView
          </a>
        </div>
      </div>
    </div>
  )
}
