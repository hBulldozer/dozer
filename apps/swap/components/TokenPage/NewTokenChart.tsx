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
  onPriceDataChange?: (priceData: { price: number; change: number; currency: 'USD' | 'HTR' }) => void
}

type ChartPeriod = '1h' | '4h' | '1d' | '1w' | '1m' | '3m' | '6m' | '1y'
type ChartCurrency = 'USD' | 'HTR'

export const NewTokenChart: React.FC<NewTokenChartProps> = ({ pair, setIsDialogOpen, onPriceDataChange }) => {
  const [period, setPeriod] = useState<ChartPeriod>('1d')
  const [currency, setCurrency] = useState<ChartCurrency>(pair.id.includes('native') ? 'USD' : 'HTR')

  // Get token UID for the price service
  const tokenUid = pair.id.includes('native') ? '00' : pair.token1?.uuid || pair.token0?.uuid || '00'

  // Fetch chart data from new price service
  const {
    data: chartData,
    isLoading: isLoadingChart,
    error: chartError,
    refetch: refetchChart,
    isFetching: isFetchingChart,
  } = api.getCharts.tokenPriceHistory.useQuery(
    {
      tokenUid,
      period,
      currency,
    },
    {
      enabled: !!tokenUid,
      staleTime: 0, // Always consider data stale to ensure fresh fetch on interval change
      gcTime: 600000, // Keep in cache for 10 minutes for background refetches
      refetchInterval: 30000, // Refetch every 30 seconds to match backend update frequency
      refetchOnWindowFocus: false,
      // NOTE: We intentionally always fetch fresh data when period changes
      // This ensures users always see the most up-to-date data for each interval
      // The fetch is fast (~200ms) so UX impact is minimal
    }
  )

  // Fetch current price with change
  const { data: priceData, isLoading: isLoadingPrice, refetch: refetchPrice } = api.getCharts.tokenPriceWithChange.useQuery(
    {
      tokenUid,
      currency,
      changeTimeframe: '1d',
    },
    {
      enabled: !!tokenUid,
      staleTime: 30000, // Cache for 30s - price doesn't change as frequently
      gcTime: 60000, // Keep in cache for 1 minute
      refetchInterval: 30000, // Refetch every 30 seconds for real-time price updates
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        // Pass price data to parent for header display
        if (onPriceDataChange && data.price && data.change !== undefined) {
          onPriceDataChange({
            price: data.price,
            change: data.change,
            currency,
          })
        }
      },
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

  // Manual refresh handler for immediate updates
  const handleManualRefresh = useCallback(() => {
    refetchChart()
    refetchPrice()
  }, [refetchChart, refetchPrice])

  // Use isFetching to show loading state during refetches (not just initial load)
  // This ensures user sees feedback when switching intervals
  const isLoading = isFetchingChart || isLoadingPrice

  // Enhanced error handling with user-friendly messages
  const getErrorMessage = () => {
    if (chartError) {
      const errorMessage = (chartError as any)?.message || ''
      if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
        return 'Loading historical data, please wait...'
      }
      return 'Failed to load price data'
    }
    if (chartData?.error) {
      return chartData.error
    }
    return undefined
  }

  const error = getErrorMessage()

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
        onRefresh={handleManualRefresh}
        hidePriceDisplay={true}
        hideTradingViewAttribution={true}
        className="p-6 rounded-xl border bg-stone-900 border-stone-700"
      />

      {/* Fallback message with specific error states */}
      {chartData?.error && !isLoading && (
        <div className="p-4 text-center rounded-lg bg-stone-800">
          <p className="text-sm text-stone-400">
            {chartData.error.includes('timeout') || chartData.error.includes('Generating')
              ? 'Generating historical data, please wait...'
              : 'Chart data temporarily unavailable'}
          </p>
        </div>
      )}
    </div>
  )
}
