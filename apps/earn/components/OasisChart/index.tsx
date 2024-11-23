import { text } from 'stream/consumers'
import { ImprovedPairCalculator, TokenPrices, TradingPair } from '../../utils/calculationOasis'
import ReactECharts from 'echarts-for-react'

interface ChartProps {
  liquidityValue: number
  initialPrices: TokenPrices
  bonusRate: number
  holdPeriod: number
  currency: TradingPair
  tokenPriceChange?: number
}

const MIN_CHANGE = -100
const MAX_CHANGE = 100
const STEP = 10

export const OasisChart = ({
  liquidityValue,
  initialPrices,
  bonusRate,
  holdPeriod,
  currency,
  tokenPriceChange = 0,
}: ChartProps) => {
  const calculator = new ImprovedPairCalculator(initialPrices, {
    liquidityValue: liquidityValue,
    holdPeriod: holdPeriod,
    bonusRate: bonusRate,
    dexFees: 25,
    tradingPair: currency,
  })

  const htrChanges = Array.from({ length: (MAX_CHANGE - MIN_CHANGE) / STEP + 1 }, (_, i) => MIN_CHANGE + i * STEP)

  const chartData = calculator.generateAnalysis(htrChanges, Array(htrChanges.length).fill(tokenPriceChange))

  const option = {
    backgroundColor: '#1c1917', // stone-900 background
    grid: {
      top: 40,
      right: 60,
      bottom: 60, // Increased to accommodate both sliders
      left: 60,
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1c1917', // stone-900 background
      textStyle: {
        color: '#a3a3a3',
      },
      borderColor: '#57534e',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999',
        },
      },
      formatter: function (params: any) {
        return `HTR Price Change: ${params[0].data[0].toFixed(1)}%<br/>
                ${currency} Price Change: ${tokenPriceChange.toFixed(1)}%<br/>
                  Hold Return: ${params[0].data[1].toFixed(1)}%<br/>
                  Sell Return: ${params[1].data[1].toFixed(1)}%`
      },
    },
    legend: {
      itemGap: 200,
      data: ['Hold Bonus + IL Protection', 'Sell Bonus Immediately'],
      textStyle: {
        color: '#999',
      },
    },
    dataZoom: [
      {
        // Inside zoom for X axis
        type: 'inside',
        xAxisIndex: 0,
        filterMode: 'none',
        zoomOnMouseWheel: true,
        moveOnMouseMove: false,
      },
      {
        // Inside zoom for Y axis
        type: 'inside',
        yAxisIndex: 0,
        filterMode: 'none',
        zoomOnMouseWheel: true,
        moveOnMouseMove: false,
        // zoomOnMouseWheel: false, // Disable mouse wheel for Y (will use modifier key)
        moveOnMouseWheel: true, // Enable Y axis zoom with modifier key
      },
      {
        // Bottom slider for X axis
        show: true,
        type: 'slider',
        xAxisIndex: 0,
        filterMode: 'none',
        height: 20,
        bottom: 10,
        borderColor: 'transparent',
        backgroundColor: '#292524',
        fillerColor: '#44403c',
        handleStyle: {
          color: '#eab308',
        },
        textStyle: {
          color: '#999',
        },
        brushSelect: false,
      },
      {
        // Right slider for Y axis
        show: true,
        type: 'slider',
        yAxisIndex: 0,
        filterMode: 'none',
        width: 20,
        right: 10,
        borderColor: 'transparent',
        backgroundColor: '#292524',
        fillerColor: '#44403c',
        handleStyle: {
          color: '#eab308',
        },
        textStyle: {
          color: '#999',
        },
        brushSelect: false,
      },
    ],
    xAxis: {
      type: 'value',
      name: 'HTR Price Change (%)',
      nameLocation: 'middle',
      nameGap: 25,
      min: -100,
      max: 100,
      axisLabel: {
        color: '#999',
        formatter: '{value}%',
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#292524',
          type: 'dashed',
        },
      },
    },
    yAxis: {
      type: 'value',
      name: 'Return (%)',
      nameLocation: 'middle',
      axisLabel: {
        color: '#999',
        formatter: '{value}%',
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#292524',
          type: 'dashed',
        },
      },
    },
    series: [
      {
        name: 'Hold Bonus + IL Protection',
        type: 'line',
        data: chartData.map((d) => [d.priceChanges.htr, d.percentageDelta.hodl]),
        smooth: true,
        showSymbol: false,
        color: '#eab308', // yellow color
        markLine: {
          silent: true,
          lineStyle: {
            color: '#666',
          },
          data: [
            {
              xAxis: 0,
            },
          ],
        },
      },
      {
        name: 'Sell Bonus Immediately',
        type: 'line',
        data: chartData.map((d) => [d.priceChanges.htr, d.percentageDelta.sell]),
        smooth: true,
        showSymbol: false,
        color: '#22c55e', // green color
      },
    ],
    toolbox: {
      feature: {
        restore: {
          show: true,
          title: 'Reset Zoom',
          icon: 'path://M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z',
          iconStyle: {
            color: '#eab308',
          },
        },
      },
      right: 60,
    },
  }
  return (
    <ReactECharts
      option={option}
      style={{
        height: '100%', // Adjust height as needed
        backgroundColor: '#1c1917', // stone-900 background
      }}
    />
  )
}
