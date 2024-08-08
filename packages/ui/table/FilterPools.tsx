import React, { useRef, useState } from 'react'
import { MagnifyingGlassIcon, XCircleIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'
import classNames from 'classnames'
import { DEFAULT_INPUT_UNSTYLED } from '../input'
import { Transition, Popover } from '@headlessui/react'
import { IconButton } from '../iconbutton'
import { Button } from '../button'
import { useBreakpoint } from '@dozer/hooks'

export interface Filters {
  tvl: { min?: number; max?: number }
  volume: { min?: number; max?: number }
  fees: { min?: number; max?: number }
  apr: { min?: number; max?: number }
}

export type FilterPoolsProps = {
  search: string
  setSearch: (search: string) => void
  setFilters: (filters: Filters) => void
}

interface FilterInputProps {
  label: string
  min: number | undefined
  setMin: (min: number | undefined) => void
  max: number | undefined
  setMax: (max: number | undefined) => void
  onEnter(): void
  close: () => void
}

const FilterInput = ({ label, min, setMin, max, setMax, onEnter, close }: FilterInputProps) => (
  <div className="flex flex-col gap-1 mb-2">
    <label className="text-sm text-stone-400">{label}</label>
    <div className="flex gap-1">
      <input
        type="number"
        placeholder="Min"
        value={min ?? ''}
        onChange={(e) => setMin(e.target.value ? Number(e.target.value) : undefined)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onEnter()
            close()
          }
        }}
        className={`${DEFAULT_INPUT_UNSTYLED} w-1/2 bg-stone-800 rounded px-1 py-0.5 text-xs`}
      />
      <input
        type="number"
        placeholder="Max"
        value={max ?? ''}
        onChange={(e) => setMax(e.target.value ? Number(e.target.value) : undefined)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onEnter()
            close()
          }
        }}
        className={`${DEFAULT_INPUT_UNSTYLED} w-1/2 bg-stone-800 rounded px-1 py-2 text-xs`}
      />
    </div>
  </div>
)

export function FilterPools({ search, setSearch, setFilters }: FilterPoolsProps) {
  const [localFilters, setLocalFilters] = useState<Filters>({
    tvl: {},
    volume: {},
    fees: {},
    apr: {},
  })

  const updateFilter = (category: keyof Filters, type: 'min' | 'max', value: number | undefined) => {
    setLocalFilters((prev) => ({
      ...prev,
      [category]: { ...prev[category], [type]: value },
    }))
  }

  const applyFilters = () => {
    setFilters(localFilters)
  }

  const noFilters = Object.values(localFilters).every((filter) => !filter.min && !filter.max)

  const { isSm } = useBreakpoint('sm')

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
                  ? ' bg-stone-900 border border-stone-800 absolute w-48 rounded-xl px-3 py-3'
                  : ' bg-stone-800 border border-stone-700 fixed inset-x-0 bottom-0 rounded-t-xl py-4 px-5 w-full'
              )}
              style={{
                maxHeight: isSm ? 'calc(100vh - 100px)' : '80vh',
                overflowY: 'auto',
              }}
            >
              <FilterInput
                label="APR (%)"
                min={localFilters.apr.min}
                max={localFilters.apr.max}
                setMin={(value: number | undefined) => updateFilter('apr', 'min', value)}
                setMax={(value: number | undefined) => updateFilter('apr', 'max', value)}
                onEnter={applyFilters}
                close={close}
              />
              <FilterInput
                label="TVL ($)"
                min={localFilters.tvl.min}
                max={localFilters.tvl.max}
                setMin={(value: number | undefined) => updateFilter('tvl', 'min', value)}
                setMax={(value: number | undefined) => updateFilter('tvl', 'max', value)}
                onEnter={applyFilters}
                close={close}
              />
              <FilterInput
                label="Fees ($)"
                min={localFilters.fees.min}
                max={localFilters.fees.max}
                setMin={(value: number | undefined) => updateFilter('fees', 'min', value)}
                setMax={(value: number | undefined) => updateFilter('fees', 'max', value)}
                onEnter={applyFilters}
                close={close}
              />
              <FilterInput
                label="Volume ($)"
                min={localFilters.volume.min}
                max={localFilters.volume.max}
                setMin={(value: number | undefined) => updateFilter('volume', 'min', value)}
                setMax={(value: number | undefined) => updateFilter('volume', 'max', value)}
                onEnter={applyFilters}
                close={close}
              />
              <Button
                className="w-full"
                size={isSm ? 'xs' : 'sm'}
                onClick={() => {
                  applyFilters()
                  close()
                }}
              >
                Apply Filters
              </Button>
            </Popover.Panel>
          </>
        )}
      </Popover>
    </div>
  )
}
