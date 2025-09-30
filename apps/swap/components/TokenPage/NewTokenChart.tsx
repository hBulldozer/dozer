import { useState, useMemo, useCallback } from 'react'
import { TokenPriceChart, type TokenPriceChartData } from '@dozer/ui'
import { api } from '../../utils/api'
import { Pair } from '@dozer/api'

interface NewTokenChartProps {
  pair: Pair & {
    daySnapshots?: any[]
    hourSnapshots?: any[]
  }
  setIsDialogOpen?: (open: boolean) => void
}

type ChartPeriod = '1h' | '4h' | '1d' | '1w' | '1m' | '3m' | '6m' | '1y'
type ChartCurrency = 'USD' | 'HTR'

export const NewTokenChart: React.FC<NewTokenChartProps> = ({ pair, setIsDialogOpen }) => {
  const [period, setPeriod] = useState<ChartPeriod>('1d')
  const [currency, setCurrency] = useState<ChartCurrency>(pair.id.includes('native') ? 'USD' : 'HTR')

  // Get token UID for the price service
  const tokenUid = pair.id.includes('native') ? '00' : pair.token1?.uuid || pair.token0?.uuid || '00'

  // Fetch chart data from new price service
  const {
    data: chartData,
    isLoading: isLoadingChart,
    error: chartError,
  } = api.getCharts.tokenPriceHistory.useQuery(
    {
      tokenUid,
      period,
      currency,
    },
    {
      enabled: !!tokenUid,
      staleTime: 60000, // Cache for 1 minute (increased from 30s)
      refetchInterval: 120000, // Refetch every 2 minutes (increased from 1 minute)
      refetchOnWindowFocus: false,
    }
  )

  // Fetch current price with change
  const { data: priceData, isLoading: isLoadingPrice } = api.getCharts.tokenPriceWithChange.useQuery(
    {
      tokenUid,
      currency,
      changeTimeframe: '1d',
    },
    {
      enabled: !!tokenUid,
      staleTime: 60000, // Cache for 1 minute (increased from 30s)
      refetchInterval: 120000, // Refetch every 2 minutes (increased from 30s)
      refetchOnWindowFocus: false,
    }
  )

  // Transform chart data for TradingView format
  const transformedChartData: TokenPriceChartData[] = useMemo(() => {
    if (!chartData?.data || chartData.data.length === 0) {
      return []
    }

    return chartData.data.map((point) => ({
      time: point.time,
      open: point.open,
      high: point.high,
      low: point.low,
      close: point.close,
      value: point.value || point.close,
    }))
  }, [chartData])

  // Handle period change
  const handlePeriodChange = useCallback((newPeriod: string) => {
    setPeriod(newPeriod as ChartPeriod)
  }, [])

  // Handle currency change
  const handleCurrencyChange = useCallback((newCurrency: 'USD' | 'HTR') => {
    setCurrency(newCurrency)
  }, [])

  const isLoading = isLoadingChart || isLoadingPrice
  const error = chartError ? 'Failed to load price data' : chartData?.error

  // Don't show HTR option for native HTR token, and don't show USD for non-hUSDC pairs
  const showCurrencyToggle = !pair.id.includes('native') && !pair.id.includes('husdc')

  return (
    <div className="flex flex-col space-y-4">
      <TokenPriceChart
        data={transformedChartData}
        currency={currency}
        chartType="candlestick"
        period={period}
        loading={isLoading}
        error={error}
        height={400}
        currentPrice={priceData?.price}
        priceChange={priceData?.change}
        onPeriodChange={handlePeriodChange}
        onCurrencyChange={showCurrencyToggle ? handleCurrencyChange : undefined}
        className="p-6 rounded-xl border bg-stone-900 border-stone-700"
      />

      {/* Fallback message if price service is not available */}
      {chartData?.error && (
        <div className="p-4 text-center rounded-lg bg-stone-800">
          <p className="text-sm text-stone-400">Chart data is temporarily unavailable. Please try again later.</p>
        </div>
      )}
    </div>
  )
}
