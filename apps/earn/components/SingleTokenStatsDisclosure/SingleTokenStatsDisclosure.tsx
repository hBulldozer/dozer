import { Disclosure, Transition } from '@headlessui/react'
import { Typography, Currency } from '@dozer/ui'
import { Type } from '@dozer/currency'
import { FC, ReactNode } from 'react'

interface SingleTokenStatsDisclosureProps {
  title: string
  subtitle?: string
  isVisible: boolean
  children: ReactNode
}

export const SingleTokenStatsDisclosure: FC<SingleTokenStatsDisclosureProps> = ({
  title,
  subtitle,
  isVisible,
  children,
}) => {
  if (!isVisible) return null

  return (
    <Transition
      show={isVisible}
      unmount={false}
      className="transition-[max-height] overflow-hidden"
      enter="duration-300 ease-in-out"
      enterFrom="transform max-h-0"
      enterTo="transform max-h-[400px]"
      leave="transition-[max-height] duration-250 ease-in-out"
      leaveFrom="transform max-h-[400px]"
      leaveTo="transform max-h-0"
    >
      <div className="px-3 py-2 border-t bg-stone-800/50 border-stone-700">
        <Disclosure>
          {({ open }) => (
            <>
              <div className="flex justify-between items-center py-2">
                <div className="flex items-center gap-2">
                  <Typography variant="sm" weight={500} className="text-stone-300">
                    {title}
                  </Typography>
                  {subtitle && (
                    <Typography variant="xs" className="text-stone-400">
                      {subtitle}
                    </Typography>
                  )}
                </div>
                <Disclosure.Button>
                  <div className="flex gap-2 items-center cursor-pointer text-stone-400 hover:text-stone-100">
                    <Typography variant="sm" weight={500}>
                      {open ? 'Hide' : 'Details'}
                    </Typography>
                    <svg
                      className={`w-5 h-5 transition-transform ${open ? 'rotate-180' : 'rotate-0'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </Disclosure.Button>
              </div>

              <Transition
                unmount={false}
                show={open}
                className="transition-[max-height] overflow-hidden"
                enter="duration-300 ease-in-out"
                enterFrom="transform max-h-0"
                enterTo="transform max-h-[300px]"
                leave="transition-[max-height] duration-250 ease-in-out"
                leaveFrom="transform max-h-[300px]"
                leaveTo="transform max-h-0"
              >
                <Disclosure.Panel className="pb-2">
                  {children}
                </Disclosure.Panel>
              </Transition>
            </>
          )}
        </Disclosure>
      </div>
    </Transition>
  )
}