'use client'

import type { ReactNode } from 'react'

import type { ChartTimeRange } from './types'

export interface ChartModeOption<T extends string = string> {
  id: T
  label: string
}

interface ToggleGroupProps<T extends string> {
  options: ReadonlyArray<ChartModeOption<T>>
  value: T
  onChange: (value: T) => void
}

function ToggleGroup<T extends string>({ options, value, onChange }: ToggleGroupProps<T>) {
  return (
    <div className="flex gap-0.5 rounded-md bg-stone-800/60 p-0.5 backdrop-blur-sm">
      {options.map((opt) => {
        const active = opt.id === value
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              active
                ? 'bg-yellow-500 text-stone-900 shadow-sm'
                : 'text-stone-300 hover:bg-stone-700/60'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

const TIME_RANGE_OPTIONS: ReadonlyArray<ChartModeOption<ChartTimeRange>> = [
  { id: '24h', label: '24h' },
  { id: '3d', label: '3d' },
  { id: '1w', label: '1w' },
]

interface ChartControlsProps<M extends string, C extends string = string> {
  modes: ReadonlyArray<ChartModeOption<M>>
  mode: M
  onModeChange: (mode: M) => void
  timeRange: ChartTimeRange
  onTimeRangeChange: (range: ChartTimeRange) => void
  currencyOptions?: ReadonlyArray<ChartModeOption<C>>
  currency?: C
  onCurrencyChange?: (currency: C) => void
  extraControls?: ReactNode
}

export function ChartControls<M extends string, C extends string = string>({
  modes,
  mode,
  onModeChange,
  timeRange,
  onTimeRangeChange,
  currencyOptions,
  currency,
  onCurrencyChange,
  extraControls,
}: ChartControlsProps<M, C>) {
  return (
    <div className="overflow-x-auto pt-3 max-w-[90vw] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex min-w-max items-center justify-between gap-2">
        <ToggleGroup options={TIME_RANGE_OPTIONS} value={timeRange} onChange={onTimeRangeChange} />

        <div className="flex gap-2">
          {currencyOptions && currency !== undefined && onCurrencyChange && (
            <ToggleGroup options={currencyOptions} value={currency} onChange={onCurrencyChange} />
          )}
          <ToggleGroup options={modes} value={mode} onChange={onModeChange} />
          {extraControls}
        </div>
      </div>
    </div>
  )
}

// Convenience type alias used by consumers.
export type { ChartTimeRange }
