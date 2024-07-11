import { Disclosure, Transition } from '@headlessui/react'
import { InformationCircleIcon } from '@heroicons/react/24/outline'
import { ChevronDownIcon } from '@heroicons/react/24/solid'
import { classNames, Tooltip, Typography } from '@dozer/ui'
import React, { FC, useMemo } from 'react'

import { Rate } from '../../components'
import { useTrade, useSettings } from '@dozer/zustand'
import { warningSeverity } from '../utils/functions'
// import { useSettings } from '../../lib/state/storage'

interface SwapStats {
  prices: { [key: string]: number }
}

export const SwapStatsDisclosure: FC<SwapStats> = ({ prices }) => {
  const trade = useTrade()
  // const [showRoute, setShowRoute] = useState(false)
  const { mainCurrency, otherCurrency } = useTrade()

  const slippageTolerance = useSettings((state) => state.slippageTolerance)
  const priceImpactSeverity = useMemo(() => warningSeverity(trade?.priceImpact), [trade?.priceImpact])

  const stats = (
    <>
      <Typography variant="sm" className="text-stone-400">
        Price Impact
      </Typography>
      <Typography
        variant="sm"
        weight={500}
        className={classNames(
          priceImpactSeverity === 2 ? 'text-yellow' : priceImpactSeverity > 2 ? 'text-red' : 'text-stone-200',
          'text-right truncate'
        )}
      >
        -{trade?.priceImpact?.toFixed(2)}%
      </Typography>
      <div className="col-span-2 border-t border-stone-200/5 w-full py-0.5" />
      <Typography variant="sm" className="text-stone-400">
        Min. Received
      </Typography>
      <Typography variant="sm" weight={500} className="text-right truncate text-stone-400">
        {trade.outputAmount && slippageTolerance
          ? (trade?.outputAmount * (1 - slippageTolerance / 100)).toFixed(2)
          : ''}{' '}
        {trade.outputAmount && slippageTolerance ? trade?.otherCurrency?.symbol : ''}
      </Typography>
    </>
  )

  return (
    <>
      <Transition
        show={!!trade.amountSpecified}
        unmount={false}
        className="p-3 !pb-1 transition-[max-height] overflow-hidden"
        enter="duration-300 ease-in-out"
        enterFrom="transform max-h-0"
        enterTo="transform max-h-[380px]"
        leave="transition-[max-height] duration-250 ease-in-out"
        leaveFrom="transform max-h-[380px]"
        leaveTo="transform max-h-0"
      >
        <Disclosure>
          {({ open }) => (
            <>
              <div className="flex justify-between items-center bg-white bg-opacity-[0.04] hover:bg-opacity-[0.08] rounded-2xl px-4 mb-4 py-2.5 gap-2">
                <Rate token1={mainCurrency} token2={otherCurrency} prices={prices}>
                  {({ content, usdPrice, toggleInvert }) => (
                    <div
                      className="text-sm text-stone-300 hover:text-stone-50 cursor-pointer gap-1 font-semibold tracking-tight h-[36px] flex items-center truncate"
                      onClick={toggleInvert}
                    >
                      <Tooltip
                        panel={<div className="grid grid-cols-2 gap-1">{stats}</div>}
                        button={<InformationCircleIcon width={16} height={16} />}
                      >
                        <></>
                      </Tooltip>{' '}
                      {content}{' '}
                      {usdPrice && trade.amountSpecified ? (
                        <span className="font-medium text-stone-500">(${Number(usdPrice).toFixed(2)})</span>
                      ) : null}
                    </div>
                  )}
                </Rate>
                <Disclosure.Button className="flex items-center justify-end flex-grow cursor-pointer">
                  <ChevronDownIcon
                    width={24}
                    height={24}
                    className={classNames(
                      open ? '!rotate-180' : '',
                      'rotate-0 transition-[transform] duration-300 ease-in-out delay-200'
                    )}
                  />
                </Disclosure.Button>
              </div>
              <Transition
                show={open}
                unmount={false}
                className="transition-[max-height] overflow-hidden"
                enter="duration-300 ease-in-out"
                enterFrom="transform max-h-0"
                enterTo="transform max-h-[380px]"
                leave="transition-[max-height] duration-250 ease-in-out"
                leaveFrom="transform max-h-[380px]"
                leaveTo="transform max-h-0"
              >
                <Disclosure.Panel
                  as="div"
                  className="grid grid-cols-2 gap-1 px-4 py-2 mb-4 border border-stone-200/5 rounded-2xl"
                >
                  {stats}
                </Disclosure.Panel>
              </Transition>
            </>
          )}
        </Disclosure>
      </Transition>
    </>
  )
}
