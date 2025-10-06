import { useState, useMemo, useCallback } from 'react'
import { PoolAnalyticsChart, type PoolAnalyticsChartData } from '@dozer/ui'
import { Pair } from '@dozer/api'
import { api } from '../../utils/api'

interface NewPoolChartProps {
  pair: Pair
}

type ChartType = 'volume' | 'tvl' | 'apr'
type ChartPeriod = '1h' | '4h' | '1d' | '1w' | '1m' | '3m' | '6m' | '1y'

export const NewPoolChart: React.FC<NewPoolChartProps> = ({ pair }) => {
  const [chartType, setChartType] = useState<ChartType>('volume')
  const [period, setPeriod] = useState<ChartPeriod>('1w')

  // Construct pool key for the price service
  const poolKey = pair.id

  // Fetch volume data
  const {
    data: volumeData,
    isLoading: isLoadingVolume,
    error: volumeError,
  } = api.getCharts.poolVolumeHistory.useQuery(
    {
      poolKey,
      period,
    },
    {
      enabled: chartType === 'volume' && !!poolKey,
      staleTime: 30000, // Consider data stale after 30s to match backend real-time updates
      refetchInterval: 30000, // Refetch every 30 seconds to match backend update frequency
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Don't refetch on mount if data is cached
    }
  )

  // Fetch TVL data
  const {
    data: tvlData,
    isLoading: isLoadingTVL,
    error: tvlError,
  } = api.getCharts.poolTVLHistory.useQuery(
    {
      poolKey,
      period,
    },
    {
      enabled: chartType === 'tvl' && !!poolKey,
      staleTime: 30000, // Consider data stale after 30s to match backend real-time updates
      refetchInterval: 30000, // Refetch every 30 seconds to match backend update frequency
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Don't refetch on mount if data is cached
    }
  )

  // Fetch APR data
  const {
    data: aprData,
    isLoading: isLoadingAPR,
    error: aprError,
  } = api.getCharts.poolAPRHistory.useQuery(
    {
      poolKey,
      period,
    },
    {
      enabled: chartType === 'apr' && !!poolKey,
      staleTime: 30000, // Consider data stale after 30s to match backend real-time updates
      refetchInterval: 30000, // Refetch every 30 seconds to match backend update frequency
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Don't refetch on mount if data is cached
    }
  )

  // Transform data based on chart type
  const chartData: PoolAnalyticsChartData[] = useMemo(() => {
    switch (chartType) {
      case 'volume':
        return volumeData?.data || []
      case 'tvl':
        return tvlData?.data || []
      case 'apr':
        return aprData?.data || []
      default:
        return []
    }
  }, [chartType, volumeData, tvlData, aprData])

  // Handle chart type change
  const handleTypeChange = useCallback((newType: ChartType) => {
    setChartType(newType)
  }, [])

  // Handle period change
  const handlePeriodChange = useCallback((newPeriod: string) => {
    setPeriod(newPeriod as ChartPeriod)
  }, [])

  // Determine loading state and errors
  const isLoading =
    (chartType === 'volume' && isLoadingVolume) ||
    (chartType === 'tvl' && isLoadingTVL) ||
    (chartType === 'apr' && isLoadingAPR)

  // Enhanced error handling with user-friendly messages
  const getErrorMessage = () => {
    if (chartType === 'volume') {
      if (volumeError) {
        const errorMessage = (volumeError as any)?.message || ''
        if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
          return 'Loading historical data, please wait...'
        }
        return 'Failed to load volume data'
      }
      if (volumeData?.error) {
        return volumeData.error
      }
    }
    if (chartType === 'tvl') {
      if (tvlError) {
        const errorMessage = (tvlError as any)?.message || ''
        if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
          return 'Loading historical data, please wait...'
        }
        return 'Failed to load TVL data'
      }
      if (tvlData?.error) {
        return tvlData.error
      }
    }
    if (chartType === 'apr') {
      if (aprError) {
        const errorMessage = (aprError as any)?.message || ''
        if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
          return 'Loading historical data, please wait...'
        }
        return 'Failed to load APR data'
      }
      if (aprData?.error) {
        return aprData.error
      }
    }
    return undefined
  }

  const error = getErrorMessage()

  // Get current value for display
  const getCurrentValue = () => {
    switch (chartType) {
      case 'volume':
        return pair.volumeUSD || 0
      case 'tvl':
        return pair.liquidityUSD || 0
      case 'apr':
        return pair.apr || 0
      default:
        return 0
    }
  }

  const currentValue = getCurrentValue()

  // Show fallback message for price service unavailability
  const showFallback =
    (chartType === 'volume' && volumeData?.error) ||
    (chartType === 'tvl' && (tvlData?.error || tvlData?.fallback)) ||
    (chartType === 'apr' && (aprData?.error || aprData?.fallback))

  return (
    <div className="flex flex-col space-y-4">
      <PoolAnalyticsChart
        data={chartData}
        chartType={chartType}
        period={period}
        loading={isLoading}
        error={error}
        height={400}
        currentValue={currentValue}
        swapFee={pair.swapFee}
        onTypeChange={handleTypeChange}
        onPeriodChange={handlePeriodChange}
        className="p-6 rounded-xl border bg-stone-900 border-stone-700"
      />

      {/* Fallback message with specific error states */}
      {showFallback && !isLoading && (
        <div className="p-4 text-center rounded-lg bg-stone-800">
          <p className="text-sm text-stone-400">
            {chartType === 'tvl'
              ? 'TVL historical data is not available yet. Please check back later.'
              : chartType === 'apr'
              ? 'APR historical data is not available yet. Please check back later.'
              : error?.includes('timeout') || error?.includes('Generating')
              ? 'Generating historical data, please wait...'
              : 'Chart data temporarily unavailable'}
          </p>
        </div>
      )}
    </div>
  )
}
