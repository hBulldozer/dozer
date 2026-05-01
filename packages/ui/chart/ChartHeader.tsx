'use client'

import { FC } from 'react'

import type { ChartHoverData } from './types'

export type ChartValueFormat = 'compact' | 'price'

interface ChartHeaderProps {
  label: string
  value: number
  hoverData?: ChartHoverData | null
  format?: ChartValueFormat
  currencySymbol?: string
  currencySuffix?: string
  showOHLC?: boolean
}

const formatCompact = (value: number): string => {
  if (!Number.isFinite(value)) return '0'
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `${(value / 1_000).toFixed(2)}K`
  return value.toFixed(2)
}

const formatPrice = (value: number): string => {
  if (!Number.isFinite(value) || value === 0) return '0'
  const abs = Math.abs(value)
  if (abs < 0.0001) return value.toFixed(8)
  if (abs < 0.01) return value.toFixed(6)
  if (abs < 1) return value.toFixed(4)
  return value.toFixed(4)
}

const formatValue = (value: number, format: ChartValueFormat): string =>
  format === 'price' ? formatPrice(value) : formatCompact(value)

export const ChartHeader: FC<ChartHeaderProps> = ({
  label,
  value,
  hoverData = null,
  format = 'compact',
  currencySymbol = '',
  currencySuffix = '',
  showOHLC = false,
}) => {
  const isHovering = hoverData !== null
  const displayValue =
    isHovering && hoverData && hoverData.value !== undefined
      ? hoverData.value
      : isHovering && hoverData && hoverData.close !== undefined
      ? hoverData.close
      : value

  const showOHLCPanel =
    showOHLC &&
    isHovering &&
    hoverData?.open !== undefined &&
    hoverData?.high !== undefined &&
    hoverData?.low !== undefined

  return (
    <div className="flex min-h-[60px] items-start justify-between pb-2">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2 text-xs text-stone-400">
          <span className="font-medium">{label}</span>
          {isHovering && hoverData?.time && <span className="text-stone-500">• {hoverData.time}</span>}
        </div>
        <span className="font-mono text-2xl font-bold text-stone-100 sm:text-3xl">
          {currencySymbol}
          {formatValue(displayValue, format)}
          {currencySuffix}
        </span>
      </div>

      {showOHLCPanel && hoverData && (
        <div className="flex flex-col items-end gap-0.5 font-mono text-xs">
          <div className="text-stone-400">
            O:{' '}
            <span className="text-stone-100">
              {currencySymbol}
              {formatValue(hoverData.open as number, format)}
              {currencySuffix}
            </span>
          </div>
          <div className="text-stone-400">
            H:{' '}
            <span className="text-emerald-400">
              {currencySymbol}
              {formatValue(hoverData.high as number, format)}
              {currencySuffix}
            </span>
          </div>
          <div className="text-stone-400">
            L:{' '}
            <span className="text-red-400">
              {currencySymbol}
              {formatValue(hoverData.low as number, format)}
              {currencySuffix}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
