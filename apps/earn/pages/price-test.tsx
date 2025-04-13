import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Badge,
  classNames,
  Skeleton,
  Box,
  Link
} from '@dozer/ui'
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
  
  // Get current prices from both services for comparison
  const { data: oldPrices, isLoading: loadingOldPrices } = api.getPrices.all.useQuery(undefined, {
    refetchInterval: 5000, // Refetch every 5 seconds to get latest prices
  })
  const { data: newPrices, isLoading: loadingNewPrices } = api.getNewPrices.all.useQuery(undefined, {
    enabled: !!isServiceAvailable,
    refetchInterval: 5000, // Refetch every 5 seconds to get latest prices
    retry: false
  })
  
  // Get HTR price from both services
  const { data: oldHtrPrice, isLoading: loadingOldHtr } = api.getPrices.htr.useQuery()
  const { data: newHtrPrice, isLoading: loadingNewHtr } = api.getNewPrices.htr.useQuery(undefined, {
    enabled: !!isServiceAvailable,
    retry: false
  })
  
  // Get historical price data for chart
  const { data: htrKlineData, isLoading: loadingKline } = api.getNewPrices.htrKline.useQuery(
    { size: 24, period: 1 }, // 24 hours with 1-hour intervals
    {
      enabled: !!isServiceAvailable,
      retry: false
    }
  )
  
  // Set up chart when data is available
  useEffect(() => {
    if (htrKlineData && htrKlineData.length > 0) {
      const timestamps = htrKlineData.map(point => new Date(point.date * 1000).toLocaleTimeString())
      const prices = htrKlineData.map(point => point.price)
      
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
              backgroundColor: '#6a7985'
            }
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: timestamps
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: (value: number) => formatUSD(value)
          }
        },
        series: [
          {
            name: 'HTR Price',
            type: 'line',
            smooth: true,
            data: prices,
            itemStyle: {
              color: tailwind.theme.colors.yellow['500']
            },
            lineStyle: {
              color: tailwind.theme.colors.yellow['500']
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
                    color: tailwind.theme.colors.yellow['500']
                  },
                  {
                    offset: 1,
                    color: 'rgba(253, 224, 71, 0.1)'
                  }
                ]
              }
            }
          }
        ]
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
            <Typography variant="h2" className="mr-2">Service Status</Typography>
            {checkingService ? (
              <Skeleton.Circle size={24} />
            ) : (
              <Badge
                size="md"
                type={isServiceAvailable ? 'success' : 'error'}
              >
                {isServiceAvailable ? 'Available' : 'Unavailable'}
              </Badge>
            )}
          </div>
          <Typography variant="sm" className="text-stone-400">
            This page demonstrates the new price service integration. It compares prices from the current system with the new service.
          </Typography>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-stone-900 rounded-lg p-6">
            <Typography variant="h3" className="mb-4">HTR Price Comparison</Typography>
            <div className="flex justify-between mb-4">
              <div>
                <Typography variant="sm" className="text-stone-400">Current System</Typography>
                {loadingOldHtr ? (
                  <Skeleton.Box className="h-8 w-24 mt-1" />
                ) : (
                  <Typography variant="lg" weight={600}>
                    {formatUSD(oldHtrPrice || 0)}
                  </Typography>
                )}
              </div>
              <div>
                <Typography variant="sm" className="text-stone-400">New Price Service</Typography>
                {loadingNewHtr || !isServiceAvailable ? (
                  <Skeleton.Box className="h-8 w-24 mt-1" />
                ) : (
                  <Typography 
                    variant="lg" 
                    weight={600}
                    className={classNames(
                      newHtrPrice === oldHtrPrice ? 'text-stone-100' :
                      newHtrPrice > oldHtrPrice ? 'text-green-400' : 'text-red-400'
                    )}
                  >
                    {formatUSD(newHtrPrice || 0)}
                  </Typography>
                )}
              </div>
            </div>
            
            <Typography variant="h4" className="mb-2 mt-4">Price Difference</Typography>
            {(loadingOldHtr || loadingNewHtr || !isServiceAvailable) ? (
              <Skeleton.Box className="h-6 w-40" />
            ) : (
              <Typography>
                {oldHtrPrice === newHtrPrice ? (
                  'No difference'
                ) : (
                  <>
                    {Math.abs(((newHtrPrice || 0) - (oldHtrPrice || 0)) / (oldHtrPrice || 1) * 100).toFixed(2)}% 
                    {(newHtrPrice || 0) > (oldHtrPrice || 0) ? ' higher' : ' lower'}
                  </>
                )}
              </Typography>
            )}
          </div>
          
          <div className="bg-stone-900 rounded-lg p-6">
            <Typography variant="h3" className="mb-4">Token Prices</Typography>
            <div className="overflow-hidden overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="text-left py-2">Token</th>
                    <th className="text-right py-2">Current System</th>
                    <th className="text-right py-2">New Service</th>
                  </tr>
                </thead>
                <tbody>
                  {(loadingOldPrices || loadingNewPrices) ? (
                    [...Array(3)].map((_, i) => (
                      <tr key={i}>
                        <td className="py-2"><Skeleton.Box className="h-6 w-20" /></td>
                        <td className="py-2 text-right"><Skeleton.Box className="h-6 w-24 ml-auto" /></td>
                        <td className="py-2 text-right"><Skeleton.Box className="h-6 w-24 ml-auto" /></td>
                      </tr>
                    ))
                  ) : (
                    Object.keys(oldPrices || {}).filter(token => ['00', '01'].includes(token)).map(token => {
                      const oldPrice = oldPrices?.[token] || 0
                      const newPrice = newPrices?.[token] || 0
                      const tokenName = token === '00' ? 'HTR' : token === '01' ? 'hUSDC' : token
                      
                      return (
                        <tr key={token}>
                          <td className="py-2">{tokenName}</td>
                          <td className="py-2 text-right">{formatUSD(oldPrice)}</td>
                          <td className="py-2 text-right">
                            <span className={classNames(
                              oldPrice === newPrice ? 'text-stone-100' :
                              newPrice > oldPrice ? 'text-green-400' : 'text-red-400'
                            )}>
                              {!isServiceAvailable ? 'N/A' : formatUSD(newPrice)}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div className="bg-stone-900 rounded-lg p-6 mb-8">
          <Typography variant="h3" className="mb-4">HTR Price Chart (Last 24 Hours)</Typography>
          {loadingKline || !isServiceAvailable ? (
            <div className="h-80">
              <Skeleton.Box className="h-full w-full" />
            </div>
          ) : !htrKlineData || htrKlineData.length === 0 ? (
            <Typography className="py-8 text-center text-stone-400">
              No historical data available
            </Typography>
          ) : (
            <div className="h-80">
              {chartOption && (
                <ReactECharts 
                  option={chartOption} 
                  style={{ height: '100%', width: '100%' }} 
                />
              )}
            </div>
          )}
        </div>
        
        <div className="bg-stone-900 rounded-lg p-6">
          <Typography variant="h3" className="mb-4">About the New Price Service</Typography>
          <Typography className="mb-2">
            The new price service is designed to improve performance and reduce load on Hathor nodes by:
          </Typography>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>Using a memory-first approach for price calculation and storage</li>
            <li>Integrating with Hathor Event Queue for real-time updates</li>
            <li>Leveraging block_height parameter for historical data retrieval</li>
            <li>Providing standardized APIs for both current and historical price data</li>
          </ul>
          <Typography>
            This test page helps validate that the new service is functioning correctly and providing comparable data to the existing price system.
          </Typography>
        </div>
      </Container>
    </Layout>
  )
}

export default PriceTestPage
