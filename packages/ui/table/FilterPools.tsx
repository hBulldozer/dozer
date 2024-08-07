import { MagnifyingGlassIcon, XCircleIcon } from '@heroicons/react/24/outline'
import classNames from 'classnames'
import { DEFAULT_INPUT_UNSTYLED } from '../input'
import { Transition } from '@headlessui/react'
import { IconButton } from '../iconbutton'

export type FitlerPoolsProps = {
  search: string
  setSearch: (search: string) => void
}

export function FilterPools({ search, setSearch }: FitlerPoolsProps) {
  return (
    <div
      className={classNames(
        'flex flex-grow my-3 sm:flex-grow-0 transform-all items-center gap-3 bg-stone-900 rounded-xl h-[44px] border border-stone-800'
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
  )
}
