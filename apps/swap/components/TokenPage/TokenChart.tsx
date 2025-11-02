import { formatHTR, formatUSD } from '@dozer/format'
import { toToken, useTokensFromPair } from '@dozer/api'
import {
  AppearOnMount,
  classNames,
  CopyHelper,
  Currency,
  IconButton,
  Link,
  Skeleton,
  Typography,
  ChartV2,
  ChartType,
  ChartPeriod,
  type ChartDataPoint,
} from '@dozer/ui'
import { FC, useState, useMemo } from 'react'
import { Square2StackIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import chains from '@dozer/chain'
import { hathorLib } from '@dozer/nanocontracts'
import { api } from 'utils/api'

interface TokenChartProps {
  pair: {
    id: string
    chainId: number
    token0: {
      uuid: string
      name: string | null
      symbol: string | null
      imageUrl?: string | null
    }
    token1: {
      uuid: string
      name: string | null
      symbol: string | null
      imageUrl?: string | null
    }
    reserve0: string | number
    reserve1: string | number
  }
}

enum TokenChartCurrency {
  HTR,
  USD,
}

export const TokenChart: FC<TokenChartProps> = ({ pair }) => {
  const [chartCurrency, setChartCurrency] = useState<TokenChartCurrency>(
    pair.id.includes('native') ? TokenChartCurrency.USD : TokenChartCurrency.HTR
  )
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>(ChartPeriod.DAY)

  const { token0, token1 } = pair
  const token = pair.id.includes('native') ? token0 : token1

  // Fetch historical data from new history API
  const { data: historicalData, isLoading: isHistoryLoading } = api.getHistory.getTokenHistory.useQuery({
    tokenId: token.uuid,
    poolId: pair.id,
    period: chartPeriod,
  })

  // Fetch current HTR price for USD conversions
  const { data: priceHTRNow, isLoading: isPriceLoading } = api.getPrices.htr.useQuery()

  // Transform data for chart
  const chartData: ChartDataPoint[] = useMemo(() => {
    if (!historicalData?.data) return []

    // Get current HTR price for USD conversion
    const htrPriceUSD = priceHTRNow || 0

    return historicalData.data.map((point) => ({
      timestamp: point.timestamp,
      // For USD, multiply HTR price by current HTR/USD rate
      value:
        chartCurrency === TokenChartCurrency.HTR ? point.priceHTR : point.priceHTR * htrPriceUSD,
      additionalValues: {
        volumeUSD: point.volumeUSD,
        liquidityUSD: point.liquidityUSD,
      },
    }))
  }, [historicalData, chartCurrency, priceHTRNow])

  // Get current price
  const currentPrice = useMemo(() => {
    if (chartData.length === 0) return 0
    return chartData[chartData.length - 1].value
  }, [chartData])

  // Value formatter based on currency
  const valueFormatter = (value: number) => {
    return chartCurrency === TokenChartCurrency.USD ? formatUSD(value) : formatHTR(value)
  }

  const isLoading = isHistoryLoading || isPriceLoading

  // Debug: log the data
  if (process.env.NODE_ENV === 'development') {
    console.log('TokenChart Debug:', {
      poolId: pair.id,
      period: chartPeriod,
      currency: chartCurrency,
      isLoading,
      historicalDataPoints: historicalData?.data?.length || 0,
      chartDataPoints: chartData.length,
      sampleData: chartData[0],
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Token Header with Currency Selector */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2 items-center">
          <Currency.Icon currency={toToken(token)} width={32} height={32} />
          <Typography variant="lg" weight={600}>
            {token.name}
          </Typography>
          <CopyHelper
            toCopy={hathorLib.tokensUtils.getConfigurationString(token.uuid, token.name || '', token.symbol || '')}
            hideIcon={true}
          >
            {(isCopied) => (
              <IconButton className="p-1 text-stone-400" description={isCopied ? 'Copied!' : 'Configuration String'}>
                <Square2StackIcon width={20} height={20} />
              </IconButton>
            )}
          </CopyHelper>
        </div>
        <div className="flex gap-4">
          {!pair.id.includes('husdc') && (
            <button
              onClick={() => setChartCurrency(TokenChartCurrency.USD)}
              className={classNames(
                'font-semibold text-sm transition-colors',
                chartCurrency === TokenChartCurrency.USD ? 'text-yellow-500' : 'text-stone-500 hover:text-stone-400'
              )}
            >
              USD
            </button>
          )}
          {!pair.id.includes('native') && (
            <button
              onClick={() => setChartCurrency(TokenChartCurrency.HTR)}
              className={classNames(
                'font-semibold text-sm transition-colors',
                chartCurrency === TokenChartCurrency.HTR ? 'text-yellow-500' : 'text-stone-500 hover:text-stone-400'
              )}
            >
              HTR
            </button>
          )}
        </div>
      </div>

      {/* Chart Component */}
      <ChartV2
        data={chartData}
        period={chartPeriod}
        onPeriodChange={(period) => setChartPeriod(period)}
        config={{
          type: ChartType.AREA,
          showGradient: true,
          color: '#EAB308', // yellow-500
          smooth: true,
          height: 400,
        }}
        showCurrentValue={true}
        showPercentageChange={true}
        valueFormatter={valueFormatter}
        showPeriodSelector={true}
        isLoading={isLoading}
        availablePeriods={[
          ChartPeriod.DAY,
          ChartPeriod.WEEK,
          ChartPeriod.MONTH,
          ChartPeriod.YEAR,
          ChartPeriod.ALL,
        ]}
      />
    </div>
  )
}
