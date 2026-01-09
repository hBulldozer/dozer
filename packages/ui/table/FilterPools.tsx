import React, { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, XCircleIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'
import classNames from 'classnames'
import {
  DEFAULT_INPUT_APPEARANCE,
  DEFAULT_INPUT_BG,
  DEFAULT_INPUT_CLASSNAME_NO_PADDING,
  DEFAULT_INPUT_PADDING,
  DEFAULT_INPUT_RING,
  DEFAULT_INPUT_UNSTYLED,
} from '../input'
import { Transition, Popover } from '@headlessui/react'
import { IconButton } from '../iconbutton'
import { Button } from '../button'
import { useBreakpoint } from '@dozer/hooks'
import { Slider } from '..'

export interface Filters {
  tvl: { min?: number; max?: number }
  volume: { min?: number; max?: number }
  fees: { min?: number; max?: number }
  apy: { min?: number; max?: number }
}

export type FilterPoolsProps = {
  search: string
  setSearch: (search: string) => void
  setFilters: (filters: Filters) => void
  maxValues: Record<string, number>
}

interface FilterInputProps {
  label: string
  min: number | undefined
  setMin: (min: number | undefined) => void
  max: number | undefined
  setMax: (max: number | undefined) => void
  onEnter(): void
  close: () => void
  sliderMax: number
}

const FilterInput = ({ label, min, setMin, max, setMax, onEnter, close, sliderMax }: FilterInputProps) => {
  const [minSliderValue, setMinSliderValue] = useState<number>(min ?? 0)
  const [maxSliderValue, setMaxSliderValue] = useState<number>(max ?? sliderMax)

  useEffect(() => {
    setMinSliderValue(min ?? 0)
  }, [min])

  useEffect(() => {
    setMaxSliderValue(max ?? sliderMax)
  }, [max, sliderMax])

  const handleMinSliderChange = (value: number) => {
    setMinSliderValue(value)
    setMin(value)
  }

  const handleMaxSliderChange = (value: number) => {
    setMaxSliderValue(value)
    setMax(value)
  }

  return (
    <div className="flex flex-col gap-2 mb-4">
      <label className="text-sm text-stone-400">{label}</label>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="w-8 text-xs text-stone-400">Min:</span>
          <Slider
            min={0}
            max={sliderMax}
            step={sliderMax / 100}
            value={[minSliderValue]}
            onValueChange={(value) => handleMinSliderChange(value[0])}
            className="flex-grow"
          />
          <input
            type="number"
            placeholder="Min"
            disabled={true}
            value={min ?? ''}
            onChange={(e) => {
              const value = e.target.value ? Number(e.target.value) : undefined
              setMin(value)
              setMinSliderValue(value ?? 0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onEnter()
                close()
              }
            }}
            className={`${DEFAULT_INPUT_BG} w-20 bg-stone-800 rounded px-2 py-1 text-xs`}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="w-8 text-xs text-stone-400">Max:</span>
          <Slider
            min={0}
            max={sliderMax}
            step={sliderMax / 100}
            value={[maxSliderValue]}
            onValueChange={(value) => handleMaxSliderChange(value[0])}
            className="flex-grow"
          />
          <input
            type="number"
            placeholder="Max"
            disabled={true}
            value={max ?? ''}
            onChange={(e) => {
              const value = e.target.value ? Number(e.target.value) : undefined
              setMax(value)
              setMaxSliderValue(value ?? sliderMax)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onEnter()
                close()
              }
            }}
            className={`${DEFAULT_INPUT_BG} w-20 bg-stone-800 rounded px-2 py-1 text-xs`}
          />
        </div>
      </div>
    </div>
  )
}

export function FilterPools({ search, setSearch, setFilters, maxValues }: FilterPoolsProps) {
  const [localFilters, setLocalFilters] = useState<Filters>({
    tvl: {},
    volume: {},
    fees: {},
    apy: {},
  })
  const [activeFilter, setActiveFilter] = useState<keyof Filters>('apy')

  const updateFilter = (category: keyof Filters, type: 'min' | 'max', value: number | undefined) => {
    setLocalFilters((prev) => ({
      ...prev,
      [category]: { ...prev[category], [type]: value },
    }))
  }

  const applyFilters = () => {
    setFilters(localFilters)
  }

  const resetFilters = () => {
    const resetFilters: Filters = {
      tvl: {},
      volume: {},
      fees: {},
      apy: {},
    }
    setLocalFilters(resetFilters)
    setFilters(resetFilters)
  }

  useEffect(() => {
    setFilters(localFilters)
  }, [localFilters])

  const noFilters = Object.values(localFilters).every((filter) => !filter.min && !filter.max)

  const { isSm } = useBreakpoint('sm')

  const filterOptions: Array<{ key: keyof Filters; label: string }> = [
    { key: 'apy', label: 'APY' },
    { key: 'tvl', label: 'TVL' },
    { key: 'fees', label: 'Fees' },
    { key: 'volume', label: 'Volume' },
  ]

  const renderFilterInputs = (close: () => void) => {
    if (isSm) {
      return filterOptions.map((option) => (
        <FilterInput
          key={option.key}
          label={option.label}
          min={localFilters[option.key].min}
          max={localFilters[option.key].max}
          setMin={(value: number | undefined) => updateFilter(option.key, 'min', value)}
          setMax={(value: number | undefined) => updateFilter(option.key, 'max', value)}
          onEnter={applyFilters}
          close={close}
          sliderMax={option.key === 'apy' ? maxValues[option.key] * 100 : maxValues[option.key]}
        />
      ))
    } else {
      const currentFilter = filterOptions.find((option) => option.key === activeFilter)!
      return (
        <FilterInput
          label={currentFilter.label}
          min={localFilters[currentFilter.key].min}
          max={localFilters[currentFilter.key].max}
          setMin={(value: number | undefined) => updateFilter(currentFilter.key, 'min', value)}
          setMax={(value: number | undefined) => updateFilter(currentFilter.key, 'max', value)}
          onEnter={applyFilters}
          close={close}
          sliderMax={currentFilter.key === 'apy' ? maxValues[currentFilter.key] * 100 : maxValues[currentFilter.key]}
        />
      )
    }
  }

  return (
    <div className="flex items-center w-full gap-3 mb-3">
      <div
        className={classNames(
          'flex flex-grow sm:flex-grow-0 transform-all items-center gap-3 bg-stone-900 rounded-xl h-[44px] border border-stone-800'
        )}
      >
        <div className={classNames('w-full sm:w-[240px] flex-grow flex gap-2 items-center px-2 py-2.5 rounded-2xl')}>
          <div className="min-w-[24px] w-6 h-6 min-h-[24px] flex flex-grow items-center justify-center">
            <MagnifyingGlassIcon className="text-stone-400" strokeWidth={2} width={24} height={24} />
          </div>
          <input
            value={search}
            placeholder="Filter pools"
            className={classNames(DEFAULT_INPUT_UNSTYLED, 'flex flex-grow !text-base placeholder:text-sm')}
            type="text"
            onInput={(e) => setSearch(e.currentTarget.value)}
          />
          <Transition
            appear
            show={search?.length > 0}
            className="flex items-center"
            enter="transition duration-300 origin-center ease-out"
            enterFrom="transform scale-90 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform opacity-100"
            leaveTo="transform opacity-0"
          >
            <IconButton onClick={() => setSearch('')}>
              <XCircleIcon width={20} height={20} className="cursor-pointer text-stone-500 hover:text-stone-300" />
            </IconButton>
          </Transition>
        </div>
      </div>

      <Popover>
        {({ close }) => (
          <>
            <Popover.Button
              className={
                noFilters
                  ? 'h-[44px] p-2 border bg-stone-900 rounded-xl border-stone-800 hover:bg-stone-800 focus:outline-none'
                  : 'h-[44px] p-2 border bg-yellow-600 rounded-xl border-stone-800 hover:bg-yellow-500 focus:outline-none'
              }
            >
              <AdjustmentsHorizontalIcon
                className={noFilters ? 'text-stone-400' : 'text-stone-800'}
                width={24}
                height={24}
              />
            </Popover.Button>
            <Popover.Panel
              className={classNames(
                'z-50',
                isSm
                  ? 'bg-stone-900 border border-stone-800 absolute w-72 rounded-xl px-4 py-4'
                  : 'bg-stone-800 border border-stone-700 fixed inset-x-0 bottom-0 rounded-t-xl py-4 px-5 w-full'
              )}
              style={{
                maxHeight: isSm ? 'calc(100vh - 100px)' : '60vh',
                overflowY: 'auto',
              }}
            >
              {!isSm && (
                <div className="flex gap-2 pb-2 mb-4 overflow-x-auto">
                  {filterOptions.map((option) => (
                    <Button
                      key={option.key}
                      size="xs"
                      className={classNames(
                        'whitespace-nowrap',
                        activeFilter === option.key ? 'bg-yellow-700' : 'bg-stone-700'
                      )}
                      onClick={() => setActiveFilter(option.key)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              )}
              {renderFilterInputs(close)}
              <div className="flex gap-2 mt-4">
                <Button
                  className="flex-1"
                  size={isSm ? 'xs' : 'sm'}
                  onClick={() => {
                    resetFilters()
                    close()
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            </Popover.Panel>
          </>
        )}
      </Popover>
    </div>
  )
}
