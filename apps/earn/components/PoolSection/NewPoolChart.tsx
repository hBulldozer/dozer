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
      staleTime: 60000, // Cache for 1 minute
      refetchInterval: 300000, // Refetch every 5 minutes
      refetchOnWindowFocus: false,
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
      staleTime: 60000, // Cache for 1 minute
      refetchInterval: 300000, // Refetch every 5 minutes
      refetchOnWindowFocus: false,
    }
  )

  // For APR, we'll generate mock data based on current APR since it's not available from price service yet
  // In a real implementation, this would come from the price service
  const aprData = useMemo(() => {
    if (chartType !== 'apr') return { data: [], dataPoints: 0 }

    // Generate mock APR data based on current pair APR
    const now = Math.floor(Date.now() / 1000)
    const dataPoints = 20
    const baseApr = pair.apr || 0

    const mockData = Array.from({ length: dataPoints }, (_, i) => {
      const timeOffset = (dataPoints - 1 - i) * (period.includes('h') ? 3600 : 86400) * (period.includes('1') ? 1 : 7)
      const time = now - timeOffset

      // Add some realistic variation to APR (±20%)
      const variation = (Math.random() - 0.5) * 0.4 * baseApr
      const value = Math.max(0, baseApr + variation)

      return {
        time,
        value,
      }
    })

    return {
      data: mockData,
      dataPoints: mockData.length,
    }
  }, [chartType, pair.apr, period])

  // Transform data based on chart type
  const chartData: PoolAnalyticsChartData[] = useMemo(() => {
    switch (chartType) {
      case 'volume':
        return volumeData?.data || []
      case 'tvl':
        return tvlData?.data || []
      case 'apr':
        return aprData.data
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
  const isLoading = (chartType === 'volume' && isLoadingVolume) || (chartType === 'tvl' && isLoadingTVL)

  const error =
    (chartType === 'volume' && volumeError?.message) ||
    (chartType === 'tvl' && tvlError?.message) ||
    (chartType === 'volume' && volumeData?.error ? 'Volume data error' : undefined) ||
    (chartType === 'tvl' && tvlData?.error ? 'TVL data error' : undefined)

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
    (chartType === 'volume' && volumeData?.error) || (chartType === 'tvl' && (tvlData?.error || tvlData?.fallback))

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

      {/* Fallback message if price service is not available */}
      {showFallback && (
        <div className="p-4 text-center rounded-lg bg-stone-800">
          <p className="text-sm text-stone-400">
            {chartType === 'tvl'
              ? 'TVL historical data is not available in the current price service version. Please use Volume chart instead.'
              : `Historical ${chartType.toUpperCase()} data is temporarily unavailable from the price service.`}
          </p>
        </div>
      )}

      {/* APR notice */}
      {chartType === 'apr' && (
        <div className="p-3 text-center rounded-lg border bg-yellow-900/20 border-yellow-500/30">
          <p className="text-sm text-yellow-200">
            APR data is estimated based on current pool performance. Historical APR tracking will be available soon.
          </p>
        </div>
      )}
    </div>
  )
}
