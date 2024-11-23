import { TokenPrices, MultiCurrencyLiquidityCalculator, CalculationResult } from '../../utils/calculationOasis'
import ReactECharts from 'echarts-for-react'

interface ChartProps {
  liquidityValue: number
  initialPrices: TokenPrices
  bonusRate: number
  holdPeriod: number
}

export const OasisChart = ({ liquidityValue, initialPrices, bonusRate, holdPeriod }: ChartProps) => {
  const calculator = new MultiCurrencyLiquidityCalculator(initialPrices, {
    deposit: {
      amount: liquidityValue, // Depositing 0.102 BTC
      currency: 'USDT',
    },
    holdPeriod: holdPeriod,
    bonusValue: liquidityValue * bonusRate,
    dexFees: 25,
  })
  const chartData = calculator.generateAnalysis(-98, 5000, 10)

  const option = {
    backgroundColor: '#1c1917', // stone-900 background
    grid: {
      top: 40,
      right: 60, // Increased to make room for zoom slider
      bottom: 40,
      left: 60,
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999',
        },
      },
      formatter: function (params: any) {
        return `HTR Price Change: ${params[0].data[0].toFixed(1)}%<br/>
                  Hold Return: ${params[0].data[1].toFixed(1)}%<br/>
                  Sell Return: ${params[1].data[1].toFixed(1)}%`
      },
    },
    legend: {
      data: ['Hold Bonus + IL Protection', 'Sell Bonus Immediately'],
      textStyle: {
        color: '#999',
      },
    },
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: 0,
        filterMode: 'none',
        zoomOnMouseWheel: true,
        moveOnMouseMove: false,
      },
      {
        show: true,
        type: 'slider',
        xAxisIndex: 0,
        filterMode: 'none',
        height: 20,
        bottom: 0,
        borderColor: 'transparent',
        backgroundColor: '#292524', // stone-800
        fillerColor: '#44403c', // stone-700
        handleStyle: {
          color: '#eab308', // yellow-500
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
      min: -98,
      max: 5000,
      axisLabel: {
        color: '#999',
        formatter: '{value}%',
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#292524', // stone-800
          type: 'dashed',
        },
      },
    },
    yAxis: {
      type: 'value',
      name: 'Return (%)',
      axisLabel: {
        color: '#999',
        formatter: '{value}%',
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#292524', // stone-800
          type: 'dashed',
        },
      },
    },
    series: [
      {
        name: 'Hold Bonus + IL Protection',
        type: 'line',
        data: chartData.map((d) => [d.priceChange, d.percentageDelta.hodl]),
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
              label: {
                formatter: 'Current',
                color: '#999',
              },
            },
          ],
        },
      },
      {
        name: 'Sell Bonus Immediately',
        type: 'line',
        data: chartData.map((d) => [d.priceChange, d.percentageDelta.sell]),
        smooth: true,
        showSymbol: false,
        color: '#22c55e', // green color
      },
    ],
  }
  return (
    <ReactECharts
      option={option}
      style={{
        height: '100%',
        backgroundColor: '#1c1917', // stone-900 background
      }}
    />
  )
}
