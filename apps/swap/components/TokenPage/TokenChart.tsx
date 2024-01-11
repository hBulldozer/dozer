import { formatHTR, formatPercentChange, formatUSD5Digit } from '@dozer/format'
import { Pair } from '@dozer/api'
import { AppearOnMount, ArrowIcon, classNames, Typography } from '@dozer/ui'
import { format } from 'date-fns'
import ReactECharts from 'echarts-for-react'
import { EChartsOption } from 'echarts-for-react/lib/types'
import { FC, useCallback, useMemo, useState } from 'react'
import resolveConfig from 'tailwindcss/resolveConfig'

import tailwindConfig from '../../tailwind.config.js'
import { Token } from '@dozer/database'

const tailwind = resolveConfig(tailwindConfig)

interface TokenChartProps {
  pair: Pair
  // token: Token
}

enum TokenChartCurrency {
  HTR,
  USD,
}

enum TokenChartPeriod {
  Day,
  Week,
  Month,
  Year,
  All,
}

const chartTimespans: Record<TokenChartPeriod, number> = {
  [TokenChartPeriod.Day]: 86400 * 1000,
  [TokenChartPeriod.Week]: 604800 * 1000,
  [TokenChartPeriod.Month]: 2629746 * 1000,
  [TokenChartPeriod.Year]: 31556952 * 1000,
  [TokenChartPeriod.All]: Infinity,
}

function generatePriceArray(numPrices: number, startPrice: number): number[] {
  const prices: number[] = []

  for (let i = 0; i < numPrices; i++) {
    // Generate a random variation between 0.005 (0.5%) and 0.1 (10%), weighted towards smaller variations
    let variation = Math.random() * 0.095 + 0.005

    // 70% chance of keeping the variation within 3%
    if (Math.random() < 0.7) {
      variation = Math.random() * 0.025 + 0.005 // Generate a smaller variation within 0.5%-3%
    }

    // Decide if the variation is positive or negative
    const isPositive = Math.random() < 0.5
    variation *= isPositive ? 1 : -1

    // Calculate the new price
    const newPrice = startPrice + startPrice * variation

    // Round the price to two decimal places
    prices.push(Math.round(newPrice * 100) / 100)
  }

  return prices
}

export const TokenChart: FC<TokenChartProps> = ({ pair }) => {
  const [chartCurrency, setChartCurrency] = useState<TokenChartCurrency>(TokenChartCurrency.USD)
  const [chartPeriod, setChartPeriod] = useState<TokenChartPeriod>(TokenChartPeriod.Day)
  const hourSnapshots = pair.hourSnapshots.filter((snap) => Number(snap.date) % 3600 == 0)
  const tenMinSnapshots = pair.hourSnapshots
  const [xData, yData] = useMemo(() => {
    const data =
      chartTimespans[chartPeriod] == TokenChartPeriod.Day
        ? tenMinSnapshots
        : chartTimespans[chartPeriod] >= TokenChartPeriod.Year
        ? pair.daySnapshots
        : hourSnapshots
    const currentDate = Math.round(Date.now())
    const [x, y] = data.reduce<[number[], number[]]>(
      (acc, cur) => {
        const date = new Date(cur.date).getTime()
        const tokenReserve: { reserve0: number; reserve1: number } = {
          reserve0: Number(cur.reserve0),
          reserve1: Number(cur.reserve1),
        }
        const priceInHTR = pair.id === 'native' ? 1 : Number(tokenReserve.reserve0) / Number(tokenReserve.reserve1)
        const priceInUSD = priceInHTR * Number(cur.priceHTR)
        if (date >= currentDate - chartTimespans[chartPeriod]) {
          acc[0].push(date / 1000)
          if (chartCurrency === TokenChartCurrency.HTR) {
            acc[1].push(priceInHTR)
          } else {
            acc[1].push(priceInUSD)
          }
        }
        return acc
      },
      [[], []]
    )

    return [x.reverse(), y.reverse()]
  }, [chartPeriod, tenMinSnapshots, pair.daySnapshots, pair.id, hourSnapshots, chartCurrency])
  const [priceChange, setPriceChange] = useState<number>(
    (yData[yData.length - 1] - yData[0]) / (yData[0] != 0 ? yData[0] : 1)
  )
  // Transient update for performance
  const onMouseOver = useCallback(
    ({ name, value, change }: { name: number; value: number; change: number }) => {
      const valueNodes = document.getElementsByClassName('hoveredItemValue')
      const nameNodes = document.getElementsByClassName('hoveredItemName')
      const changeNodes = document.getElementsByClassName('hoveredItemChange')

      if (chartCurrency === TokenChartCurrency.USD) {
        valueNodes[0].innerHTML = formatUSD5Digit(value)
      } else {
        valueNodes[0].innerHTML = formatHTR(value)
      }

      nameNodes[0].innerHTML = format(new Date(name * 1000), 'dd MMM yyyy HH:mm')

      changeNodes[0].innerHTML = formatPercentChange(change)
      setPriceChange(change)
    },
    [chartCurrency]
  )

  const DEFAULT_OPTION: EChartsOption = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis',
        extraCssText: 'z-index: 1000',
        responsive: true,
        // @ts-ignore
        backgroundColor: tailwind.theme.colors.slate['700'],
        textStyle: {
          // @ts-ignore
          color: tailwind.theme.colors.slate['50'],
          fontSize: 12,
          fontWeight: 600,
        },
        formatter: (params: any) => {
          onMouseOver({
            name: params[0].name,
            value: params[0].value,
            change: (params[0].value - yData[0]) / (yData[0] != 0 ? yData[0] : 1),
          })

          const date = new Date(Number(params[0].name * 1000))
          return `<div class="flex flex-col gap-0.5">
            <span class="text-sm text-stone-50 font-semibold">${
              chartCurrency == TokenChartCurrency.USD ? formatUSD5Digit(params[0].value) : formatHTR(params[0].value)
            }</span>
            <span class="text-xs text-stone-400 font-medium">${
              date instanceof Date && !isNaN(date?.getTime()) ? format(date, 'dd MMM yyyy HH:mm') : ''
            }</span>
          </div>`
        },
        borderWidth: 0,
      },
      toolbox: {
        show: false,
      },
      grid: {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      },
      dataZoom: {
        show: false,
        start: 0,
        end: 100,
      },
      visualMap: {
        show: false,
        // @ts-ignore
        color: [tailwind.theme.colors.yellow['500']],
      },
      xAxis: [
        {
          show: false,
          type: 'category',
          boundaryGap: true,
          data: xData,
        },
      ],
      yAxis: [
        {
          show: false,
          type: 'value',
          scale: true,
          name: 'Price',
          max: 'dataMax',
          min: 'dataMin',
        },
      ],
      series: [
        {
          name: 'Price',
          symbol: 'none',
          type: 'line',
          xAxisIndex: 0,
          yAxisIndex: 0,
          animationEasing: 'circularInOut',
          animationDelayUpdate: function (idx: number) {
            return idx * 2
          },
          data: yData,
        },
      ],
    }),
    [onMouseOver, xData, yData, chartCurrency]
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-5 md:flex-row">
        <div className="flex gap-6">
          <button
            onClick={() => setChartCurrency(TokenChartCurrency.USD)}
            className={classNames(
              'border-b-[3px] pb-2 font-semibold text-sm',
              chartCurrency === TokenChartCurrency.USD
                ? 'text-stone-50 border-yellow'
                : 'text-stone-500 border-transparent'
            )}
          >
            USD
          </button>
          {pair.id != 'native' ? (
            <button
              onClick={() => setChartCurrency(TokenChartCurrency.HTR)}
              className={classNames(
                'border-b-[3px] pb-2 font-semibold text-sm',
                chartCurrency === TokenChartCurrency.HTR
                  ? 'text-stone-50 border-yellow'
                  : 'text-stone-500 border-transparent'
              )}
            >
              HTR
            </button>
          ) : null}
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setChartPeriod(TokenChartPeriod.Day)}
            className={classNames(
              'font-semibold text-sm',
              chartPeriod === TokenChartPeriod.Day ? 'text-yellow' : 'text-stone-500'
            )}
          >
            1D
          </button>
          <button
            onClick={() => setChartPeriod(TokenChartPeriod.Week)}
            className={classNames(
              'font-semibold text-sm',
              chartPeriod === TokenChartPeriod.Week ? 'text-yellow' : 'text-stone-500'
            )}
          >
            1W
          </button>
          <button
            onClick={() => setChartPeriod(TokenChartPeriod.Month)}
            className={classNames(
              'font-semibold text-sm',
              chartPeriod === TokenChartPeriod.Month ? 'text-yellow' : 'text-stone-500'
            )}
          >
            1M
          </button>
          <button
            onClick={() => setChartPeriod(TokenChartPeriod.Year)}
            className={classNames(
              'font-semibold text-sm',
              chartPeriod === TokenChartPeriod.Year ? 'text-yellow' : 'text-stone-500'
            )}
          >
            1Y
          </button>
          <button
            onClick={() => setChartPeriod(TokenChartPeriod.All)}
            className={classNames(
              'font-semibold text-sm',
              chartPeriod === TokenChartPeriod.All ? 'text-yellow' : 'text-stone-500'
            )}
          >
            ALL
          </button>
        </div>
      </div>
      <div className="flex flex-col">
        <Typography variant="xl" weight={500} className="text-stone-50">
          <span className="hoveredItemValue">
            {chartCurrency === TokenChartCurrency.USD
              ? formatUSD5Digit(yData[yData.length - 1])
              : formatHTR(yData[yData.length - 1])}
          </span>
        </Typography>
        <div className="flex gap-1 ">
          <ArrowIcon
            type={priceChange < 0 ? 'down' : 'up'}
            className={priceChange < 0 ? 'text-red-400' : 'text-green-400'}
          />
          <Typography variant="sm" weight={600} className={priceChange < 0 ? 'text-red-400' : 'text-green-400'}>
            <span className="hoveredItemChange">{formatPercentChange(priceChange)}</span>
          </Typography>
        </div>

        {xData.length && (
          <Typography variant="sm" className="text-stone-500 hoveredItemName">
            <AppearOnMount>{format(new Date(xData[xData.length - 1] * 1000), 'dd MMM yyyy HH:mm')}</AppearOnMount>
          </Typography>
        )}
      </div>
      <ReactECharts option={DEFAULT_OPTION} style={{ height: 400 }} />
    </div>
  )
}
