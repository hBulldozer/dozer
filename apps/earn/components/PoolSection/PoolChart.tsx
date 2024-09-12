import { formatPercent, formatUSD } from '@dozer/format'
import { Pair, PairHourSnapshot } from '@dozer/api'
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
  // Fees,
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

export const PoolChart: FC<PoolChartProps> = ({ pair }) => {
  const [chartType, setChartType] = useState<PoolChartType>(PoolChartType.Volume)
  const [chartPeriod, setChartPeriod] = useState<PoolChartPeriod>(PoolChartPeriod.Week)
  const hourSnapshots = getFirstPerHour(pair.hourSnapshots)
  const fifteenMinSnapshots = pair.hourSnapshots
  if (hourSnapshots.length == 0 || fifteenMinSnapshots.length == 0 || !pair.daySnapshots)
    return <Typography>There is no data for this pool yet.</Typography>
  const [xData, yData] = useMemo(() => {
    const data =
      chartPeriod == PoolChartPeriod.Day
        ? fifteenMinSnapshots.filter((snap) => snap.date < new Date(Date.now()))
        : chartPeriod >= PoolChartPeriod.Year
        ? pair.daySnapshots.filter((snap) => snap.date < new Date(Date.now())).reverse()
        : hourSnapshots.filter((snap) => snap.date < new Date(Date.now()))
    const currentDate = Math.round(Date.now())
    const [x, y] = data.reduce<[number[], any]>(
      (acc, cur, idx, arr) => {
        const date = new Date(cur.date).getTime()
        if (date >= currentDate - chartTimespans[chartPeriod]) {
          acc[0].push(date / 1000)
          // if (chartType === PoolChartType.Fees) {
          //   idx == 0
          //     ? acc[1].push(Number(cur.volumeUSD * (pair.swapFee / 100)))
          //     : acc[1].push(Number(cur.feeUSD) - Number(arr[idx - 1].feeUSD))
          // } else
          if (chartType === PoolChartType.Volume) {
            // idx == 0
            acc[1].push(Number(cur.volumeUSD))
            // : acc[1].push(Number(cur.volumeUSD) - Number(arr[idx - 1].volumeUSD))
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
    x.push(Math.round(Date.now()) / 1000)
    if (chartType === PoolChartType.APR) {
      y.push(pair.apr)
    } else if (chartType === PoolChartType.TVL) {
      y.push(pair.liquidityUSD)
      // } else if (chartType === PoolChartType.Fees) {
      //   y.push(pair.feeUSD)
    } else if (chartType === PoolChartType.Volume) {
      y.push(pair.volumeUSD)
    }

    return [x, y]
  }, [chartPeriod, fifteenMinSnapshots, hourSnapshots, pair.daySnapshots, pair.swapFee, chartType])

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
        valueNodes[1].innerHTML = formatUSD(value * (pair.swapFee / 100))
      }
      nameNodes[0].innerHTML = format(new Date(name * 1000), 'dd MMM yyyy HH:mm')
    },
    [chartType, pair.swapFee]
  )

  const onMouseLeave = useCallback(() => {
    const valueNodes = document.getElementsByClassName('hoveredItemValue')
    const nameNodes = document.getElementsByClassName('hoveredItemName')

    if (chartType === PoolChartType.APR) {
      valueNodes[0].innerHTML = formatPercent(yData[yData.length - 1])
    } else {
      valueNodes[0].innerHTML = formatUSD(yData[yData.length - 1])
    }

    if (chartType === PoolChartType.Volume) {
      valueNodes[1].innerHTML = formatUSD(yData[yData.length - 1] * (pair.swapFee / 100))
    }
    nameNodes[0].innerHTML = format(new Date(xData[xData.length - 1] * 1000), 'dd MMM yyyy HH:mm')
  }, [chartType, pair.swapFee])

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
          })

          const date = new Date(Number(params[0].name * 1000))
          return `<div class="flex flex-col gap-0.5">
            <span class="text-sm text-stone-50 font-semibold">${
              chartType === PoolChartType.APR ? formatPercent(params[0].value) : formatUSD(params[0].value)
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
          // show: true,
          type: 'category',
          boundaryGap: true,
          data: xData,
          axisLabel: {
            formatter: function (value: number) {
              return format(
                new Date(value * 1000),
                chartPeriod == PoolChartPeriod.Day
                  ? 'HH:mm aaa'
                  : chartPeriod === PoolChartPeriod.Week
                  ? 'eeee'
                  : chartPeriod === PoolChartPeriod.Month
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
          name: 'Volume',
          // max: 'dataMax',
          // min: 'dataMin',
        },
      ],
      series: [
        {
          name: 'Volume',
          type: chartType === PoolChartType.TVL || chartType === PoolChartType.APR ? 'line' : 'bar',
          xAxisIndex: 0,
          yAxisIndex: 0,
          itemStyle: {
            color: 'yellow',
            normal: {
              barBorderRadius: 2,
            },
          },
          areaStyle: {
            // @ts-ignore
            color: tailwind.theme.colors.yellow['500'],
          },
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
              chartType === PoolChartType.Volume ? 'text-stone-50 border-yellow' : 'text-stone-500 border-transparent'
            )}
          >
            Volume
          </button>
          <button
            onClick={() => setChartType(PoolChartType.TVL)}
            className={classNames(
              'border-b-[3px] pb-2 font-semibold text-sm',
              chartType === PoolChartType.TVL ? 'text-stone-50 border-yellow' : 'text-stone-500 border-transparent'
            )}
          >
            TVL
          </button>
          {/* <button
            onClick={() => setChartType(PoolChartType.Fees)}
            className={classNames(
              'border-b-[3px] pb-2 font-semibold text-sm',
              chartType === PoolChartType.Fees ? 'text-stone-50 border-yellow' : 'text-stone-500 border-transparent'
            )}
          >
            Fees
          </button> */}
          <button
            onClick={() => {
              setChartType(PoolChartType.APR)
              if (chartPeriod < PoolChartPeriod.Month) setChartPeriod(PoolChartPeriod.Month)
            }}
            className={classNames(
              'border-b-[3px] pb-2 font-semibold text-sm',
              chartType === PoolChartType.APR ? 'text-stone-50 border-yellow' : 'text-stone-500 border-transparent'
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
              chartPeriod === PoolChartPeriod.Day ? 'text-yellow' : 'text-stone-500',
              chartType == PoolChartType.APR ? 'hidden' : ''
            )}
          >
            1D
          </button>
          <button
            onClick={() => setChartPeriod(PoolChartPeriod.Week)}
            // disabled={chartType == PoolChartType.APR}
            className={classNames(
              'font-semibold text-sm',
              chartPeriod === PoolChartPeriod.Week ? 'text-yellow' : 'text-stone-500'
            )}
          >
            1W
          </button>
          <button
            onClick={() => setChartPeriod(PoolChartPeriod.Month)}
            className={classNames(
              'font-semibold text-sm',
              chartPeriod === PoolChartPeriod.Month ? 'text-yellow' : 'text-stone-500'
            )}
          >
            1M
          </button>
          <button
            onClick={() => setChartPeriod(PoolChartPeriod.Year)}
            className={classNames(
              'font-semibold text-sm',
              chartPeriod === PoolChartPeriod.Year ? 'text-yellow' : 'text-stone-500'
            )}
          >
            1Y
          </button>
          <button
            onClick={() => setChartPeriod(PoolChartPeriod.All)}
            className={classNames(
              'font-semibold text-sm',
              chartPeriod === PoolChartPeriod.All ? 'text-yellow' : 'text-stone-500'
            )}
          >
            ALL
          </button>
        </div>
      </div>
      <div className="flex flex-col">
        <Typography variant="xl" weight={500} className="text-stone-50">
          <span className="hoveredItemValue">
            {chartType === PoolChartType.APR
              ? formatPercent(yData[yData.length - 1])
              : formatUSD(yData[yData.length - 1])}
          </span>{' '}
          {chartType === PoolChartType.Volume && (
            <span className="text-sm font-medium text-stone-300">
              <span className="text-xs top-[-2px] relative">•</span>{' '}
              <span className="hoveredItemValue">{formatUSD(yData[yData.length - 1] * (pair.swapFee / 100))}</span>{' '}
              earned
            </span>
          )}
        </Typography>
        {xData.length && (
          <Typography variant="sm" className="text-stone-500 hoveredItemName">
            <AppearOnMount>{format(new Date(xData[xData.length - 1] * 1000), 'dd MMM yyyy HH:mm')}</AppearOnMount>
          </Typography>
        )}
      </div>
      <div onMouseLeave={onMouseLeave}>
        <ReactECharts option={DEFAULT_OPTION} style={{ height: 400 }} />
      </div>
    </div>
  )
}
