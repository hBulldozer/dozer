import React, { useState, useEffect } from 'react'
import { Container, Typography, Badge, classNames, Skeleton, Link } from '@dozer/ui'
import { api } from '../utils/api'
import { formatUSD, formatPercent, formatHTR } from '@dozer/format'
import { Layout } from '../components/Layout'
import ReactECharts from 'echarts-for-react'
import { EChartsOption } from 'echarts-for-react/lib/types'
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../tailwind.config.js'

const tailwind = resolveConfig(tailwindConfig)

const PriceTestPage: React.FC = () => {
  const [chartOption, setChartOption] = useState<EChartsOption | null>(null)

  // Check if the new price service is available
  const { data: isServiceAvailable, isLoading: checkingService } = api.getNewPrices.isAvailable.useQuery(undefined, {
    refetchInterval: 30000, // Check availability every 30 seconds
  })

  // Get token info to map UUIDs to symbols
  const { data: tokenInfo, isLoading: loadingTokenInfo } = api.getNewPrices.tokenInfo.useQuery(undefined, {
    enabled: !!isServiceAvailable,
    retry: false,
  })

  // Get current prices from both services for comparison
  const { data: oldPrices, isLoading: loadingOldPrices } = api.getPrices.all.useQuery(undefined, {
    refetchInterval: 5000, // Refetch every 5 seconds to get latest prices
  })
  const { data: newPrices, isLoading: loadingNewPrices } = api.getNewPrices.all.useQuery(undefined, {
    enabled: !!isServiceAvailable,
    refetchInterval: 5000, // Refetch every 5 seconds to get latest prices
    retry: false,
  })

  // Get HTR price from both services
  const { data: oldHtrPrice, isLoading: loadingOldHtr } = api.getPrices.htr.useQuery()
  const { data: newHtrPrice, isLoading: loadingNewHtr } = api.getNewPrices.htr.useQuery(undefined, {
    enabled: !!isServiceAvailable,
    retry: false,
  })

  // Get historical price data for chart
  const { data: htrKlineData, isLoading: loadingKline } = api.getNewPrices.htrKline.useQuery(
    { size: 24, period: 1 }, // 24 hours with 1-hour intervals
    {
      enabled: !!isServiceAvailable,
      retry: false,
    }
  )

  // Set up chart when data is available
  useEffect(() => {
    if (htrKlineData && htrKlineData.length > 0) {
      const timestamps = htrKlineData.map((point) => new Date(point.date * 1000).toLocaleTimeString())
      const prices = htrKlineData.map((point) => point.price)

      setChartOption({
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            const valueIndex = params[0].dataIndex
            return `${timestamps[valueIndex]}<br/>${formatUSD(prices[valueIndex])}`
          },
          axisPointer: {
            type: 'cross',
            label: {
              backgroundColor: '#6a7985',
            },
          },
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          data: timestamps,
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: (value: number) => formatUSD(value),
          },
        },
        series: [
          {
            name: 'HTR Price',
            type: 'line',
            smooth: true,
            data: prices,
            itemStyle: {
              color: tailwind.theme.colors.yellow['500'],
            },
            lineStyle: {
              color: tailwind.theme.colors.yellow['500'],
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: tailwind.theme.colors.yellow['500'],
                  },
                  {
                    offset: 1,
                    color: 'rgba(253, 224, 71, 0.1)',
                  },
                ],
              },
            },
          },
        ],
      })
    }
  }, [htrKlineData])

  return (
    <Layout>
      <Container maxWidth="4xl" className="py-8">
        <Typography variant="h1" className="mb-6">
          Price Service Test Page
        </Typography>

        <div className="mb-8">
          <div className="flex items-center mb-2">
            <Typography variant="h2" className="mr-2">
              Service Status
            </Typography>
            {checkingService ? (
              <Skeleton.Circle size={24} radius={12} />
            ) : (
              <Badge size="md" type={isServiceAvailable ? 'success' : 'error'}>
                {isServiceAvailable ? 'Available' : 'Unavailable'}
              </Badge>
            )}
          </div>
          <Typography variant="sm" className="text-stone-400">
            This page demonstrates the new price service integration. It compares prices from the current system with
            the new service.
          </Typography>
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
            ) : (
              <Typography>
                {oldHtrPrice === newHtrPrice ? (
                  'No difference'
                ) : (
                  <>
                    {Math.abs((((newHtrPrice || 0) - (oldHtrPrice || 0)) / (oldHtrPrice || 1)) * 100).toFixed(2)}%
                    {(newHtrPrice || 0) > (oldHtrPrice || 0) ? ' higher' : ' lower'}
                  </>
                )}
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

        <div className="p-6 mb-8 rounded-lg bg-stone-900">
          <Typography variant="h3" className="mb-4">
            HTR Price Chart (Last 24 Hours)
          </Typography>
          {loadingKline || !isServiceAvailable ? (
            <div className="h-80">
              <Skeleton.Box className="w-full h-full" />
            </div>
          ) : !htrKlineData || htrKlineData.length === 0 ? (
            <Typography className="py-8 text-center text-stone-400">No historical data available</Typography>
          ) : (
            <div className="h-80">
              {chartOption && <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} />}
            </div>
          )}
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
      </Container>
    </Layout>
  )
}

export default PriceTestPage
