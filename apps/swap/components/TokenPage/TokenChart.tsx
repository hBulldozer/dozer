import { formatHTR, formatPercentChange, formatUSD } from '@dozer/format'
import { Pair, PairHourSnapshot, toToken, useTokensFromPair } from '@dozer/api'
import {
  AppearOnMount,
  ArrowIcon,
  classNames,
  CopyHelper,
  Currency,
  IconButton,
  Link,
  Skeleton,
  Typography,
} from '@dozer/ui'
import { format } from 'date-fns'
import ReactECharts from 'echarts-for-react'
import { EChartsOption } from 'echarts-for-react/lib/types'
import { FC, useCallback, useMemo, useState } from 'react'
import resolveConfig from 'tailwindcss/resolveConfig'

import tailwindConfig from '../../tailwind.config.js'
import { hourSnapshot, Token } from '@dozer/database'
import { api } from '../../utils/api'
import { ArrowTopRightOnSquareIcon, Square2StackIcon } from '@heroicons/react/24/outline'
import chains from '@dozer/chain'
import { hathorLib } from '@dozer/nanocontracts'

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

function getFirstPerHour(snapshots: PairHourSnapshot[]): PairHourSnapshot[] {
  // Sort snapshots by date in ascending order
  snapshots.sort((a, b) => a.date.getTime() - b.date.getTime())

  const hourlySnapshots: PairHourSnapshot[] = []
  let currentHour = -1 // Initialize with an invalid hour

  for (const snap of snapshots) {
    const snapHour = snap.date.getHours()

    // Check if we moved to a new hour
    if (snapHour !== currentHour) {
      currentHour = snapHour
      hourlySnapshots.push(snap) // Add first snapshot of the new hour
    }
  }

  return hourlySnapshots
}
export const TokenChart: FC<TokenChartProps> = ({ pair }) => {
  const [chartCurrency, setChartCurrency] = useState<TokenChartCurrency>(
    pair.id.includes('native') ? TokenChartCurrency.USD : TokenChartCurrency.HTR
  )
  const [chartPeriod, setChartPeriod] = useState<TokenChartPeriod>(TokenChartPeriod.Day)
  const hourSnapshots = getFirstPerHour(pair.hourSnapshots)
  const { token0, token1 } = pair
  const token = pair.id.includes('native') ? token0 : token1
  const fifteenMinSnapshots = pair.hourSnapshots
  const tokenReserveNow: { reserve0: number; reserve1: number } = {
    reserve0: Number(pair.reserve0),
    reserve1: Number(pair.reserve1),
  }
  const priceInHTRNow = pair.id.includes('native')
    ? 1
    : Number(tokenReserveNow.reserve0) / Number(tokenReserveNow.reserve1)
  const { data: _priceHTRNow, isLoading } = api.getPrices.htr.useQuery()
  const data = useMemo(() => {
    return chartPeriod == TokenChartPeriod.Day
      ? fifteenMinSnapshots.filter((snap) => snap.date < new Date(Date.now()))
      : chartPeriod >= TokenChartPeriod.Year
      ? pair.daySnapshots.filter((snap) => snap.date < new Date(Date.now())).reverse()
      : hourSnapshots.filter((snap) => snap.date < new Date(Date.now()))
  }, [chartPeriod, fifteenMinSnapshots, hourSnapshots, pair.daySnapshots])
  const [xData, yData] = useMemo(() => {
    const currentDate = Math.round(Date.now())
    const [x, y] = data.reduce<[number[], number[]]>(
      (acc, cur, idx) => {
        const date = new Date(cur.date).getTime()
        if (date >= currentDate - chartTimespans[chartPeriod]) {
          const tokenReserve: { reserve0: number; reserve1: number } = {
            reserve0: Number(cur.reserve0),
            reserve1: Number(cur.reserve1),
          }
          const priceInHTR = pair.id.includes('native')
            ? 1
            : Number(tokenReserve.reserve0) / Number(tokenReserve.reserve1)
          const priceInUSD = pair.id.includes('usdt')
            ? 1
            : pair.id.includes('native')
            ? Number(tokenReserve.reserve1) / Number(tokenReserve.reserve0)
            : priceInHTR * cur.priceHTR
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
      x.push(Math.round(Date.now()) / 1000)
      if (chartCurrency === TokenChartCurrency.HTR) {
        y.push(priceInHTRNow)
      } else {
        y.push(priceInHTRNow * _priceHTRNow)
      }
    }

    return [x, y]
  }, [data, _priceHTRNow, pair.id, chartPeriod, chartCurrency, priceInHTRNow])
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
        valueNodes[0].innerHTML = formatUSD(value)
      } else {
        valueNodes[0].innerHTML = formatHTR(value)
      }

      nameNodes[0].innerHTML = format(new Date(name * 1000), 'dd MMM yyyy HH:mm')

      changeNodes[0].innerHTML = formatPercentChange(change)
      setPriceChange(change)
    },
    [chartCurrency]
  )

  const onMouseLeave = useCallback(() => {
    const valueNodes = document.getElementsByClassName('hoveredItemValue')
    const changeNodes = document.getElementsByClassName('hoveredItemChange')

    if (chartCurrency === TokenChartCurrency.USD) {
      valueNodes[0].innerHTML = formatUSD(yData[yData.length - 1])
    } else {
      valueNodes[0].innerHTML = formatHTR(yData[yData.length - 1])
    }

    const change = (yData[yData.length - 1] - yData[0]) / (yData[0] != 0 ? yData[0] : 1)
    changeNodes[0].innerHTML = formatPercentChange(change)
    setPriceChange(change)
  }, [chartCurrency])

  const DEFAULT_OPTION: EChartsOption = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis',
        extraCssText: 'z-index: 1000',
        responsive: true,
        // @ts-ignore
        backgroundColor: tailwind.theme.colors.stone['700'],
        textStyle: {
          // @ts-ignore
          color: tailwind.theme.colors.stone['50'],
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
              chartCurrency == TokenChartCurrency.USD ? formatUSD(params[0].value) : formatHTR(params[0].value)
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
        top: 40,
        left: 20,
        right: 20,
        bottom: 60,
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
          boundaryGap: true,
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
            interval: 'auto',
            showMinLabel: true, // Changed: Show the first label
            showMaxLabel: true, // Changed: Show the last label
            inside: false, // Changed: Place labels outside the chart area
            margin: 48, // Changed: Adjust margin for better positioning
            rotate: 0, // Added: Ensure labels are not rotated
            hideOverlap: true, // Added: Prevent hiding overlapping labels
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
          // max: 'dataMax',
          // min: Math.min(...yData) - 0.001,
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
      <div className="flex justify-between gap-5 mr-3">
        <div className="flex flex-col gap-1 ">
          <div className="flex items-center gap-2">
            <Currency.Icon currency={toToken(token)} width={32} height={32} />
            <Typography variant="lg" weight={600}>
              {token.name}
            </Typography>
            <Typography variant="lg" weight={600} className="text-stone-400">
              {token.symbol}
            </Typography>
            <div className="flex flex-row items-center gap-2 ml-2">
              <CopyHelper
                toCopy={
                  pair.id == 'native'
                    ? hathorLib.tokensUtils.getConfigurationString(
                        pair.token0.uuid,
                        pair.token0.name || '',
                        pair.token0.symbol || ''
                      )
                    : hathorLib.tokensUtils.getConfigurationString(
                        pair.token1.uuid,
                        pair.token1.name || '',
                        pair.token1.symbol || ''
                      )
                }
                hideIcon={true}
              >
                {(isCopied) => (
                  <IconButton
                    className="p-1 text-stone-400"
                    description={isCopied ? 'Copied!' : 'Configuration String'}
                  >
                    <Square2StackIcon width={20} height={20} color="stone-500" />
                  </IconButton>
                )}
              </CopyHelper>
              <Link.External href={chains[pair.chainId].getTokenUrl(pair.id == 'native' ? token0.uuid : token1.uuid)}>
                <IconButton className="p-1 text-stone-400" description={'View on explorer'}>
                  <ArrowTopRightOnSquareIcon width={20} height={20} color="stone-500" />
                </IconButton>
              </Link.External>
            </div>
          </div>
          <Typography variant="h2" weight={600} className="text-stone-50">
            <span className="hoveredItemValue">
              {chartCurrency === TokenChartCurrency.USD
                ? formatUSD(yData[yData.length - 1])
                : formatHTR(yData[yData.length - 1])}
            </span>
          </Typography>
          <div className="flex gap-1 ">
            <Typography variant="lg" weight={500} className="text-stone-400">
              <span className="hoveredItemChange">{formatPercentChange(priceChange)}</span>
            </Typography>
            <ArrowIcon
              type={priceChange < 0 ? 'down' : 'up'}
              className={priceChange < 0 ? 'text-red-500' : 'text-green-500'}
            />
          </div>

          {xData.length && (
            <Typography variant="sm" className="hidden text-stone-500 hoveredItemName">
              <AppearOnMount>{format(new Date(xData[xData.length - 1] * 1000), 'dd MMM yyyy HH:mm')}</AppearOnMount>
            </Typography>
          )}
        </div>
        <div className="flex gap-4">
          {!pair.id.includes('usdt') ? (
            <button
              onClick={() => setChartCurrency(TokenChartCurrency.USD)}
              className={classNames(
                'font-semibold text-xl',
                chartCurrency === TokenChartCurrency.USD ? 'text-yellow-500' : 'text-stone-500'
              )}
            >
              USD
            </button>
          ) : null}
          {!pair.id.includes('native') ? (
            <button
              onClick={() => setChartCurrency(TokenChartCurrency.HTR)}
              className={classNames(
                'font-semibold text-xl',
                chartCurrency === TokenChartCurrency.HTR ? 'text-yellow-500 ' : 'text-stone-500 '
              )}
            >
              HTR
            </button>
          ) : null}
        </div>
      </div>
      {!isLoading ? (
        <div onMouseLeave={onMouseLeave}>
          <ReactECharts option={DEFAULT_OPTION} style={{ height: 400 }} />
        </div>
      ) : (
        <Skeleton.Box className="h-96" />
      )}
      <div className="flex justify-between px-8 md:px-0 md:gap-4 md:justify-end">
        <button
          onClick={() => setChartPeriod(TokenChartPeriod.Day)}
          className={classNames(
            'font-semibold text-xl',
            chartPeriod === TokenChartPeriod.Day ? 'text-yellow' : 'text-stone-500'
          )}
        >
          1D
        </button>
        <button
          onClick={() => setChartPeriod(TokenChartPeriod.Week)}
          className={classNames(
            'font-semibold text-xl',
            chartPeriod === TokenChartPeriod.Week ? 'text-yellow' : 'text-stone-500'
          )}
        >
          1W
        </button>
        <button
          onClick={() => setChartPeriod(TokenChartPeriod.Month)}
          className={classNames(
            'font-semibold text-xl',
            chartPeriod === TokenChartPeriod.Month ? 'text-yellow' : 'text-stone-500'
          )}
        >
          1M
        </button>
        <button
          onClick={() => setChartPeriod(TokenChartPeriod.Year)}
          className={classNames(
            'font-semibold text-xl',
            chartPeriod === TokenChartPeriod.Year ? 'text-yellow' : 'text-stone-500'
          )}
        >
          1Y
        </button>
        <button
          onClick={() => setChartPeriod(TokenChartPeriod.All)}
          className={classNames(
            'font-semibold text-xl',
            chartPeriod === TokenChartPeriod.All ? 'text-yellow' : 'text-stone-500'
          )}
        >
          ALL
        </button>
      </div>
    </div>
  )
}
