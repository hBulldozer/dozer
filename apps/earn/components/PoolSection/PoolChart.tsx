import { formatPercent, formatUSD } from '@dozer/format'
import { Pair } from '../../utils/Pair.jsx'
import { AppearOnMount, classNames, Typography } from '@dozer/ui'
import { format } from 'date-fns'
import ReactECharts from 'echarts-for-react'
import { EChartsOption } from 'echarts-for-react/lib/types'
import { FC, useCallback, useMemo, useState } from 'react'
import resolveConfig from 'tailwindcss/resolveConfig'

import tailwindConfig from '../../tailwind.config.js'

const tailwind = resolveConfig(tailwindConfig)

interface PoolChartProps {
  pair: Pair
}

enum PoolChartType {
  Volume,
  TVL,
  Fees,
  APR,
}

enum PoolChartPeriod {
  Day,
  Week,
  Month,
  Year,
  All,
}

const chartTimespans: Record<PoolChartPeriod, number> = {
  [PoolChartPeriod.Day]: 86400 * 1000,
  [PoolChartPeriod.Week]: 604800 * 1000,
  [PoolChartPeriod.Month]: 2629746 * 1000,
  [PoolChartPeriod.Year]: 31556952 * 1000,
  [PoolChartPeriod.All]: Infinity,
}

export const PoolChart: FC<PoolChartProps> = ({ pair }) => {
  const [chartType, setChartType] = useState<PoolChartType>(PoolChartType.Volume)
  const [chartPeriod, setChartPeriod] = useState<PoolChartPeriod>(PoolChartPeriod.Week)
  const [xData, yData] = useMemo(() => {
    const data =
      chartTimespans[chartPeriod] <= chartTimespans[PoolChartPeriod.Week] ? pair.hourSnapshots : pair.daySnapshots
    const currentDate = Math.round(Date.now())
    const [x, y] = data.reduce<[number[], number[]]>(
      (acc, cur) => {
        if (cur.date.getTime() * 1000 >= currentDate - chartTimespans[chartPeriod]) {
          acc[0].push(cur.date.getTime())
          if (chartType === PoolChartType.Fees) {
            acc[1].push(Number(cur.volumeUSD * (pair.swapFee / 10000)))
          } else if (chartType === PoolChartType.Volume) {
            acc[1].push(Number(cur.volumeUSD))
          } else if (chartType === PoolChartType.TVL) {
            acc[1].push(Number(cur.liquidityUSD))
          } else if (chartType === PoolChartType.APR) {
            acc[1].push(Number(cur.apr))
          }
        }
        return acc
      },
      [[], []]
    )

    return [x.reverse(), y.reverse()]
  }, [chartPeriod, pair.hourSnapshots, pair.daySnapshots, pair.swapFee, chartType])

  // Transient update for performance
  const onMouseOver = useCallback(
    ({ name, value }: { name: number; value: number }) => {
      const valueNodes = document.getElementsByClassName('hoveredItemValue')
      const nameNodes = document.getElementsByClassName('hoveredItemName')

      if (chartType === PoolChartType.APR) {
        valueNodes[0].innerHTML = formatPercent(value)
      } else {
        valueNodes[0].innerHTML = formatUSD(value)
      }

      if (chartType === PoolChartType.Volume) {
        valueNodes[1].innerHTML = formatUSD(value * (pair.swapFee / 10000))
      }
      nameNodes[0].innerHTML = format(new Date(name * 1000), 'dd MMM yyyy HH:mm')
    },
    [chartType, pair.swapFee]
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
          onMouseOver({ name: params[0].name, value: params[0].value })

          const date = new Date(Number(params[0].name * 1000))
          return `<div class="flex flex-col gap-0.5">
            <span class="text-sm text-slate-50 font-semibold">${
              chartType === PoolChartType.APR ? formatPercent(params[0].value) : formatUSD(params[0].value)
            }</span>
            <span class="text-xs text-slate-400 font-medium">${
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
        color: [tailwind.theme.colors.blue['500']],
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
          name: 'Volume',
          max: 'dataMax',
          min: 'dataMin',
        },
      ],
      series: [
        {
          name: 'Volume',
          type: chartType === PoolChartType.TVL || chartType === PoolChartType.APR ? 'line' : 'bar',
          xAxisIndex: 0,
          yAxisIndex: 0,
          itemStyle: {
            color: 'blue',
            normal: {
              barBorderRadius: 2,
            },
          },
          areaStyle: {
            // @ts-ignore
            color: tailwind.theme.colors.blue['500'],
          },
          animationEasing: 'elasticOut',
          animationDelayUpdate: function (idx: number) {
            return idx * 2
          },
          data: yData,
        },
      ],
    }),
    [onMouseOver, chartType, xData, yData]
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-5 md:flex-row">
        <div className="flex gap-6">
          <button
            onClick={() => setChartType(PoolChartType.Volume)}
            className={classNames(
              'border-b-[3px] pb-2 font-semibold text-sm',
              chartType === PoolChartType.Volume ? 'text-slate-50 border-blue' : 'text-slate-500 border-transparent'
            )}
          >
            Volume
          </button>
          <button
            onClick={() => setChartType(PoolChartType.TVL)}
            className={classNames(
              'border-b-[3px] pb-2 font-semibold text-sm',
              chartType === PoolChartType.TVL ? 'text-slate-50 border-blue' : 'text-slate-500 border-transparent'
            )}
          >
            TVL
          </button>
          <button
            onClick={() => setChartType(PoolChartType.Fees)}
            className={classNames(
              'border-b-[3px] pb-2 font-semibold text-sm',
              chartType === PoolChartType.Fees ? 'text-slate-50 border-blue' : 'text-slate-500 border-transparent'
            )}
          >
            Fees
          </button>
          <button
            onClick={() => setChartType(PoolChartType.APR)}
            className={classNames(
              'border-b-[3px] pb-2 font-semibold text-sm',
              chartType === PoolChartType.APR ? 'text-slate-50 border-blue' : 'text-slate-500 border-transparent'
            )}
          >
            APR
          </button>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setChartPeriod(PoolChartPeriod.Day)}
            className={classNames(
              'font-semibold text-sm',
              chartPeriod === PoolChartPeriod.Day ? 'text-blue' : 'text-slate-500'
            )}
          >
            1D
          </button>
          <button
            onClick={() => setChartPeriod(PoolChartPeriod.Week)}
            className={classNames(
              'font-semibold text-sm',
              chartPeriod === PoolChartPeriod.Week ? 'text-blue' : 'text-slate-500'
            )}
          >
            1W
          </button>
          <button
            onClick={() => setChartPeriod(PoolChartPeriod.Month)}
            className={classNames(
              'font-semibold text-sm',
              chartPeriod === PoolChartPeriod.Month ? 'text-blue' : 'text-slate-500'
            )}
          >
            1M
          </button>
          <button
            onClick={() => setChartPeriod(PoolChartPeriod.Year)}
            className={classNames(
              'font-semibold text-sm',
              chartPeriod === PoolChartPeriod.Year ? 'text-blue' : 'text-slate-500'
            )}
          >
            1Y
          </button>
          <button
            onClick={() => setChartPeriod(PoolChartPeriod.All)}
            className={classNames(
              'font-semibold text-sm',
              chartPeriod === PoolChartPeriod.All ? 'text-blue' : 'text-slate-500'
            )}
          >
            ALL
          </button>
        </div>
      </div>
      <div className="flex flex-col">
        <Typography variant="xl" weight={500} className="text-slate-50">
          <span className="hoveredItemValue">
            {chartType === PoolChartType.APR
              ? formatPercent(yData[yData.length - 1])
              : formatUSD(yData[yData.length - 1])}
          </span>{' '}
          {chartType === PoolChartType.Volume && (
            <span className="text-sm font-medium text-slate-300">
              <span className="text-xs top-[-2px] relative">•</span>{' '}
              <span className="hoveredItemValue">{formatUSD(yData[yData.length - 1] * (pair.swapFee / 10000))}</span>{' '}
              earned
            </span>
          )}
        </Typography>
        {xData.length && (
          <Typography variant="sm" className="text-slate-500 hoveredItemName">
            <AppearOnMount>{format(new Date(xData[xData.length - 1] * 1000), 'dd MMM yyyy HH:mm')}</AppearOnMount>
          </Typography>
        )}
      </div>
      <ReactECharts option={DEFAULT_OPTION} style={{ height: 400 }} />
    </div>
  )
}
