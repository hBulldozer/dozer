import { Disclosure, Transition } from '@headlessui/react'
import { ChainId } from '@dozer/chain'
import { Tab, Tooltip, Typography } from '@dozer/ui'
import { Widget } from '@dozer/ui'
import React, { FC, memo } from 'react'

// import { TRIDENT_ENABLED_NETWORKS } from '../../config'

// Fee - Tiers TBD
enum Fee {
  LOW = 1,
  MEDIUM = 5,
  AVERAGE = 10,
  DEFAULT = 30,
  HIGH = 100,
  //   MAX = 10000
}

interface SelectFeeWidgetProps {
  selectedNetwork: ChainId
  fee: number
  setFee(fee: number): void
}

const FEE_MAP = [Fee.LOW, Fee.MEDIUM, Fee.DEFAULT, Fee.HIGH]

const SelectFeeWidget: FC<SelectFeeWidgetProps> = memo(({ fee, setFee }) => {
  return (
    <Widget id="selectFee" maxWidth={400} className="!bg-stone-800">
      <Widget.Content>
        <Disclosure>
          {() => (
            <>
              <Tooltip
                mouseEnterDelay={0.3}
                button={
                  <div className="flex items-center justify-between pr-3">
                    <Widget.Header title="3. Select Fee Tier" className="!pb-3" />
                    <Typography variant="sm" weight={700} className="px-2 py-1 rounded-lg bg-stone-900">
                      {(FEE_MAP[fee] / 100).toFixed(2)}%
                    </Typography>
                  </div>
                }
                panel={
                  <Typography variant="xs" className="max-w-[220px]">
                    This network does not allow changing the default fee of 0.3%
                  </Typography>
                }
              >
                <></>
              </Tooltip>
              <Transition
                unmount={false}
                className="transition-[max-height] overflow-hidden"
                enter="duration-300 ease-in-out"
                enterFrom="transform max-h-0"
                enterTo="transform max-h-[380px]"
                leave="transition-[max-height] duration-250 ease-in-out"
                leaveFrom="transform max-h-[380px]"
                leaveTo="transform max-h-0"
              >
                <Disclosure.Panel unmount={false}>
                  <div className="p-3 pt-0">
                    <Tab.Group selectedIndex={fee} onChange={setFee}>
                      <Tab.List className="mt-2">
                        <Disclosure.Button>
                          <Tab as="div" className="!h-[unset] p-2">
                            <div className="flex flex-col gap-0.5">
                              <Typography variant="xs" weight={500} className="text-stone-200">
                                0.01%
                              </Typography>
                              <Typography variant="xxs" weight={500} className="text-stone-400">
                                Best for stable pairs.
                              </Typography>
                            </div>
                          </Tab>
                        </Disclosure.Button>
                        <Disclosure.Button>
                          <Tab as="div" className="!h-[unset] p-2">
                            <div className="flex flex-col gap-0.5">
                              <Typography variant="xs" weight={500} className="text-stone-200">
                                0.05%
                              </Typography>
                              <Typography variant="xxs" weight={500} className="text-stone-400">
                                Best for less volatile pairs.
                              </Typography>
                            </div>
                          </Tab>
                        </Disclosure.Button>
                        <Disclosure.Button>
                          <Tab as="div" className="!h-[unset] p-2">
                            <div className="flex flex-col gap-0.5">
                              <Typography variant="xs" weight={500} className="text-stone-200">
                                0.3%
                              </Typography>
                              <Typography variant="xxs" weight={500} className="text-stone-400">
                                Best for most pairs.
                              </Typography>
                            </div>
                          </Tab>
                        </Disclosure.Button>
                        <Disclosure.Button>
                          <Tab as="div" className="!h-[unset] p-2">
                            <div className="flex flex-col gap-0.5">
                              <Typography variant="xs" weight={500} className="text-stone-200">
                                1%
                              </Typography>
                              <Typography variant="xxs" weight={500} className="text-stone-400">
                                Best for volatile pairs.
                              </Typography>
                            </div>
                          </Tab>
                        </Disclosure.Button>
                      </Tab.List>
                    </Tab.Group>
                  </div>
                </Disclosure.Panel>
              </Transition>
            </>
          )}
        </Disclosure>
      </Widget.Content>
    </Widget>
  )
})
