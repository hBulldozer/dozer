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
import { api } from '../../utils/api'

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

export const TokenChart: FC<TokenChartProps> = ({ pair }) => {
  const [chartCurrency, setChartCurrency] = useState<TokenChartCurrency>(TokenChartCurrency.USD)
  const [chartPeriod, setChartPeriod] = useState<TokenChartPeriod>(TokenChartPeriod.Day)
  const hourSnapshots = pair.hourSnapshots.filter((snap) => new Date(snap.date).getMinutes() === 0)
  const tenMinSnapshots = pair.hourSnapshots
  const tokenReserveNow: { reserve0: number; reserve1: number } = {
    reserve0: Number(pair.reserve0),
    reserve1: Number(pair.reserve1),
  }
  const priceInHTRNow = pair.id === 'native' ? 1 : Number(tokenReserveNow.reserve0) / Number(tokenReserveNow.reserve1)
  const { data: _priceHTRNow } = api.getPrices.htr.useQuery()
  const [xData, yData] = useMemo(() => {
    const data =
      chartPeriod == TokenChartPeriod.Day
        ? tenMinSnapshots
        : chartPeriod >= TokenChartPeriod.Year
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
    if (_priceHTRNow) {
      x.unshift(Math.round(Date.now()) / 1000)
      if (chartCurrency === TokenChartCurrency.HTR) {
        y.unshift(priceInHTRNow)
      } else {
        y.unshift(priceInHTRNow * _priceHTRNow)
      }
    }

    return [x.reverse(), y.reverse()]
  }, [
    chartPeriod,
    tenMinSnapshots,
    pair.daySnapshots,
    pair.id,
    hourSnapshots,
    chartCurrency,
    priceInHTRNow,
    _priceHTRNow,
  ])
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
        containLabel: false,
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
          // show: false,
          type: 'category',
          boundaryGap: false,
          data: xData,
          axisLabel: {
            formatter: function (value: number) {
              return format(
                new Date(value * 1000),
                chartPeriod == TokenChartPeriod.Day
                  ? 'HH:mm aaa'
                  : chartPeriod == TokenChartPeriod.Week
                  ? 'eeee'
                  : chartPeriod === TokenChartPeriod.Month
                  ? 'LLLL d'
                  : 'LLLL'
              )
            },
            interval: chartPeriod == TokenChartPeriod.Day ? '2' : '1',
            inside: true,
            margin: 5,
          },
          axisTick: {
            show: false,
          },
        },
      ],
      yAxis: [
        {
          show: false,
          type: 'value',
          scale: true,
          name: 'Price',
          max: 'dataMax',
          min: Math.min(...yData) - 0.001,
        },
      ],
      series: [
        {
          name: 'Price',
          symbol: 'none',
          type: 'line',
          xAxisIndex: 0,
          yAxisIndex: 0,
          animationEasingUpdate: 'circularInOut',
          animationDurationUpdate: 0,
          animationDelay: function (idx: number) {
            return idx * 2
          },
          animationEasing: 'circularInOut',
          data: yData,
        },
      ],
    }),
    [xData, chartPeriod, yData, onMouseOver, chartCurrency]
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
