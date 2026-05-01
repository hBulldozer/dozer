'use client'

import { FC, useEffect, useRef, useState } from 'react'
import {
  createChart,
  ColorType,
  CrosshairMode,
  PriceScaleMode,
  type IChartApi,
  type Time,
} from 'lightweight-charts'

import type { ChartTimeRange } from './types'
import { chartFontFamily, chartTheme } from './theme'

export interface BuildSeriesContext {
  chart: IChartApi
}

export interface LightweightChartProps {
  height?: number
  buildSeries: (ctx: BuildSeriesContext) => void | (() => void)
  onCrosshairMove?: (param: {
    time: Time | undefined
    seriesData: Map<unknown, unknown>
  }) => void
  priceFormatter?: (price: number) => string
  timeRange?: ChartTimeRange
  deps?: ReadonlyArray<unknown>
}

const formatTickMark = (time: number, timeRange: ChartTimeRange): string => {
  const date = new Date(time * 1000)

  if (timeRange === '24h') {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (timeRange === '3d') {
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
    })
  }

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  })
}

const formatHoverTime = (time: number, timeRange: ChartTimeRange): string => {
  const date = new Date(time * 1000)

  if (timeRange === '1w') {
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const LightweightChart: FC<LightweightChartProps> = ({
  height = 400,
  buildSeries,
  onCrosshairMove,
  priceFormatter,
  timeRange = '24h',
  deps = [],
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!containerRef.current || chartRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: chartTheme.text,
        fontSize: 12,
        fontFamily: chartFontFamily,
      },
      localization: {
        timeFormatter: (time: number) => formatHoverTime(time, timeRange),
        priceFormatter,
      },
      grid: {
        vertLines: { color: chartTheme.grid, visible: true },
        horzLines: { color: chartTheme.grid, visible: true },
      },
      timeScale: {
        borderColor: chartTheme.scaleBorder,
        timeVisible: true,
        rightOffset: 3,
        fixRightEdge: true,
        tickMarkFormatter: (time: number) => formatTickMark(time, timeRange),
      },
      rightPriceScale: {
        borderColor: chartTheme.scaleBorder,
        scaleMargins: { top: 0.05, bottom: 0.05 },
        mode: PriceScaleMode.Normal,
        autoScale: true,
      },
      leftPriceScale: { visible: false },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: { color: chartTheme.crosshair, labelBackgroundColor: chartTheme.crosshairLabelBg },
        horzLine: { color: chartTheme.crosshair, labelBackgroundColor: chartTheme.crosshairLabelBg },
      },
      handleScroll: false,
      handleScale: false,
    })

    chartRef.current = chart
    setIsReady(true)

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth })
      }
    }
    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
      setIsReady(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!chartRef.current || !isReady) return

    chartRef.current.applyOptions({
      localization: {
        timeFormatter: (time: number) => formatHoverTime(time, timeRange),
        priceFormatter,
      },
      timeScale: {
        tickMarkFormatter: (time: number) => formatTickMark(time, timeRange),
      },
    })
  }, [isReady, priceFormatter, timeRange])

  useEffect(() => {
    if (!chartRef.current || !isReady) return
    const cleanup = buildSeries({ chart: chartRef.current })
    const moveHandler = onCrosshairMove
      ? (param: Parameters<NonNullable<typeof onCrosshairMove>>[0]) => onCrosshairMove(param)
      : null
    if (moveHandler) {
      chartRef.current.subscribeCrosshairMove(moveHandler as Parameters<IChartApi['subscribeCrosshairMove']>[0])
    }
    chartRef.current.timeScale().fitContent()

    return () => {
      if (chartRef.current && moveHandler) {
        chartRef.current.unsubscribeCrosshairMove(
          moveHandler as Parameters<IChartApi['unsubscribeCrosshairMove']>[0]
        )
      }
      if (cleanup) cleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, ...deps])

  return <div ref={containerRef} className="rounded" style={{ height: `${height}px` }} />
}
