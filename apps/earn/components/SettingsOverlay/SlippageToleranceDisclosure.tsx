import { Disclosure, Transition } from '@headlessui/react'
import { ChevronRightIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { classNames, DEFAULT_INPUT_UNSTYLED, Input, Tab, Tooltip, Typography } from '@dozer/ui'
import { FC, useEffect, useState } from 'react'

import { useSettings } from '@dozer/zustand'

export const SlippageToleranceDisclosure: FC = () => {
  const { slippageTolerance, setSlippageTolerance, setSlippageToleranceType, slippageToleranceType } = useSettings()
  const [slippage, setSlippage] = useState<string>(slippageTolerance.toFixed(2))

  const onChange = (value: string) => {
    let slip: string
    if (parseFloat(value) > 100) slip = '100'
    else slip = value
    setSlippage(slip)
    setSlippageTolerance(parseFloat(slip || '0') / 100)
  }

  useEffect(() => {
    if (slippageToleranceType == 'custom') setSlippageTolerance(parseFloat(slippage) / 100)
  }, [slippageToleranceType])

  return (
    <Disclosure>
      {({ open }) => (
        <div className="border-b border-stone-200/5">
          <Disclosure.Button
            as="div"
            className="relative flex items-center justify-between w-full gap-3 cursor-pointer group rounded-xl"
          >
            <div className="flex items-center justify-center w-5 h-5">
              <svg
                className="-ml-0.5 text-stone-500"
                width="20"
                height="12"
                viewBox="0 0 20 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="m18.617 6.797-8.125 5a.922.922 0 0 1-.492.14.984.984 0 0 1-.46-.117.953.953 0 0 1-.477-.82V2.68L2.367 6.797a.937.937 0 0 1-.984-1.594l8.125-5a.93.93 0 0 1 1.43.797v8.32l6.695-4.117a.938.938 0 0 1 .984 1.594Z"
                  fill="#97A3B7"
                />
              </svg>
            </div>
            <div className="flex items-center justify-between w-full gap-1 py-4">
              <div className="flex items-center gap-1">
                <Typography variant="sm" weight={500}>
                  Slippage Tolerance
                </Typography>
                <Tooltip
                  button={<InformationCircleIcon width={14} height={14} />}
                  panel={
                    <div className="flex flex-col gap-2 w-80">
                      <Typography variant="xs" weight={500} className="text-stone-300">
                        Slippage tolerance is the utmost percentage of slippage a user is willing to execute a trade
                        with; if the actual slippage falls outside of the user-designated range, the transaction will
                        revert.
                      </Typography>
                      <Typography variant="xs" weight={500} className="text-stone-300">
                        Slippage is the difference between the expected value of output from a trade and the actual
                        value due to asset volatility and liquidity depth.
                      </Typography>
                    </div>
                  }
                >
                  <></>
                </Tooltip>
              </div>
              <div className="flex gap-1">
                <Typography variant="sm" weight={500} className="group-hover:text-stone-200 text-stone-400">
                  {slippageToleranceType === 'auto' ? 'Auto' : `Custom (${slippage}%)`}
                </Typography>
                <div
                  className={classNames(
                    open ? 'rotate-90' : 'rotate-0',
                    'transition-all w-5 h-5 -mr-1.5 flex items-center delay-300'
                  )}
                >
                  <ChevronRightIcon width={16} height={16} className="group-hover:text-stone-200 text-stone-300" />
                </div>
              </div>
            </div>
          </Disclosure.Button>

          <Transition
            unmount={false}
            className="transition-[max-height] overflow-hidden mb-3"
            enter="duration-300 ease-in-out"
            enterFrom="transform max-h-0"
            enterTo="transform max-h-[380px]"
            leave="transition-[max-height] duration-250 ease-in-out"
            leaveFrom="transform max-h-[380px]"
            leaveTo="transform max-h-0"
          >
            <Disclosure.Panel>
              <Tab.Group
                selectedIndex={slippageToleranceType === 'auto' ? 0 : 1}
                onChange={(index) => setSlippageToleranceType(index === 0 ? 'auto' : 'custom')}
              >
                <Tab.List>
                  <Tab>Auto</Tab>
                  <Tab>Custom</Tab>
                </Tab.List>
                <Tab.Panels>
                  <Tab.Panel />
                  <Tab.Panel>
                    <div className="flex flex-col gap-2 px-3 py-2 mt-2 bg-stone-900 rounded-xl">
                      <Typography variant="xs" weight={500} className="flex items-center gap-1 text-stone-300">
                        Custom Slippage
                      </Typography>
                      <div className="flex items-center gap-2">
                        <Input.Numeric
                          variant="unstyled"
                          value={slippage ?? ''}
                          onUserInput={(val) => onChange(val)}
                          placeholder="0.5"
                          className={classNames(DEFAULT_INPUT_UNSTYLED, '')}
                        />
                        <Typography variant="xs" weight={500} className="text-stone-400">
                          %
                        </Typography>
                      </div>
                    </div>
                  </Tab.Panel>
                </Tab.Panels>
              </Tab.Group>
            </Disclosure.Panel>
          </Transition>
        </div>
      )}
    </Disclosure>
  )
}
