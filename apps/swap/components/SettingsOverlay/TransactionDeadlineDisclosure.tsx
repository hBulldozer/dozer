import { Disclosure, Transition } from '@headlessui/react'
import { ChevronRightIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { classNames, DEFAULT_INPUT_UNSTYLED, Input, Tab, Tooltip, Typography } from '@dozer/ui'
import { FC, useEffect, useState } from 'react'

import { useSettings } from '@dozer/zustand'

export const TransactionDeadlineDisclosure: FC = () => {
  const { transactionDeadline, setTransactionDeadline, setDeadlineType, deadlineType } = useSettings()
  const [deadline, setDeadline] = useState<string>(transactionDeadline.toString())

  const onChange = (value: string) => {
    let minutes: string
    // Enforce maximum of 1440 minutes (24 hours)
    if (parseFloat(value) > 1440) minutes = '1440'
    else minutes = value
    setDeadline(minutes)
    setTransactionDeadline(parseFloat(minutes || '60'))
  }

  useEffect(() => {
    if (deadlineType == 'custom') setTransactionDeadline(parseFloat(deadline))
  }, [deadlineType])

  // Check for warning conditions
  const showWarning = deadlineType === 'custom' && parseFloat(deadline) < 5 && parseFloat(deadline) >= 1
  const showError = deadlineType === 'custom' && (parseFloat(deadline) < 1 || isNaN(parseFloat(deadline)))

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
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 0a10 10 0 1 0 10 10A10 10 0 0 0 10 0zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm.5-13H9v6l5.2 3.2.8-1.3-4.5-2.7V5z"
                  fill="#97A3B7"
                />
              </svg>
            </div>
            <div className="flex items-center justify-between w-full gap-1 py-4">
              <div className="flex items-center gap-1">
                <Typography variant="sm" weight={500}>
                  Transaction Deadline
                </Typography>
                <Tooltip
                  button={<InformationCircleIcon width={14} height={14} />}
                  panel={
                    <div className="flex flex-col gap-2 w-80">
                      <Typography variant="xs" weight={500} className="text-stone-300">
                        Your transaction will revert if it is left pending for longer than the specified deadline.
                      </Typography>
                      <Typography variant="xs" weight={500} className="text-stone-300">
                        This protects you from extreme price changes while your transaction is waiting to be confirmed
                        on the blockchain.
                      </Typography>
                    </div>
                  }
                >
                  <></>
                </Tooltip>
              </div>
              <div className="flex gap-1">
                <Typography variant="sm" weight={500} className="group-hover:text-stone-200 text-stone-400">
                  {deadlineType === 'auto' ? 'Auto (60 min)' : `Custom (${deadline} min)`}
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
                selectedIndex={deadlineType === 'auto' ? 0 : 1}
                onChange={(index) => setDeadlineType(index === 0 ? 'auto' : 'custom')}
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
                        Custom Deadline
                      </Typography>
                      <div className="flex items-center gap-2">
                        <Input.Numeric
                          variant="unstyled"
                          value={deadline || ''}
                          placeholder="60"
                          onUserInput={(val) => onChange(val)}
                          className={classNames(
                            DEFAULT_INPUT_UNSTYLED,
                            showError ? 'text-red-400' : showWarning ? 'text-yellow-400' : ''
                          )}
                        />
                        <Typography variant="xs" weight={500} className="text-stone-400">
                          min
                        </Typography>
                      </div>
                      {showError && (
                        <Typography variant="xs" weight={400} className="text-red-400">
                          Please enter a deadline of at least 1 minute
                        </Typography>
                      )}
                      {showWarning && (
                        <Typography variant="xs" weight={400} className="text-yellow-400">
                          Your transaction may fail with a very short deadline
                        </Typography>
                      )}
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
