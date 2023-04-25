import { Disclosure, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/outline'
import { ChainId } from '@dozer/chain'
import { Amount, Token, Type } from '@dozer/currency'
import { formatUSD } from '@dozer/format'
import { FundSource, useIsMounted } from '@dozer/hooks'
import { ZERO } from '@dozer/math'
import {
  AppearOnMount,
  Button,
  classNames,
  Currency as UICurrency,
  DEFAULT_INPUT_UNSTYLED,
  Input,
  Typography,
} from '@dozer/ui'
import { Widget } from '@dozer/ui'
import { FC, Fragment, ReactNode, useState } from 'react'
import { useAccount, useNetwork } from '@dozer/zustand'

// import { usePoolPosition } from '../PoolPositionProvider'
import { SettingsOverlay } from '../SettingsOverlay'

interface RemoveSectionWidgetProps {
  chainId: ChainId
  percentage: string
  token0: Type
  token1: Type
  token0Minimum?: Amount<Type>
  token1Minimum?: Amount<Type>
  setPercentage(percentage: string): void
  prices: { [key: string]: number }
  BalanceLPAmount: Amount<Token>
  children: ReactNode
}

export const RemoveSectionWidget: FC<RemoveSectionWidgetProps> = ({
  chainId,
  percentage,
  setPercentage,
  token0,
  token1,
  token0Minimum,
  token1Minimum,
  prices,
  BalanceLPAmount,
  children,
}) => {
  const isMounted = useIsMounted()
  const [hover, setHover] = useState(false)
  const { address, balance } = useAccount()
  const value0 = prices[token0.uuid]
  const value1 = prices[token1.uuid]

  const { network } = useNetwork()

  Boolean(!BalanceLPAmount.greaterThan(ZERO) && hover && !address)

  return (
    <div className="relative" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <Transition
        show={Boolean(hover && (!address || !BalanceLPAmount.greaterThan(ZERO)))}
        as={Fragment}
        enter="transition duration-300 origin-center ease-out"
        enterFrom="transform opacity-0"
        enterTo="transform opacity-100"
        leave="transition duration-75 ease-out"
        leaveFrom="transform opacity-100"
        leaveTo="transform opacity-0"
      >
        <div className="border border-stone-200/5 flex justify-center items-center z-[100] absolute inset-0 backdrop-blur bg-black bg-opacity-[0.24] rounded-2xl">
          <Typography variant="xs" weight={600} className="bg-white bg-opacity-[0.12] rounded-full p-2 px-3">
            No liquidity tokens found
          </Typography>
        </div>
      </Transition>
      <Widget id="removeLiquidity" maxWidth={400} className="bg-stone-800">
        <Widget.Content>
          <Disclosure defaultOpen={true}>
            {({ open }) => (
              <>
                {
                  // isFarm &&
                  isMounted ? (
                    <Widget.Header title="Remove Liquidity" className="!pb-3 ">
                      <div className="flex gap-3">
                        <SettingsOverlay chainId={network} />
                        <Disclosure.Button className="w-full pr-0.5">
                          <div className="flex items-center justify-between">
                            <div
                              className={classNames(
                                open ? 'rotate-180' : 'rotate-0',
                                'transition-all w-5 h-5 -mr-1.5 flex items-center delay-300'
                              )}
                            >
                              <ChevronDownIcon
                                width={24}
                                height={24}
                                className="group-hover:text-stone-200 text-stone-300"
                              />
                            </div>
                          </div>
                        </Disclosure.Button>
                      </div>
                    </Widget.Header>
                  ) : (
                    <Widget.Header title="Remove Liquidity" className="!pb-3" />
                  )
                }
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
                    <div className="flex flex-col gap-3 p-3">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-between flex-grow">
                          <Input.Percent
                            onUserInput={(val) => setPercentage(val ? Math.min(+val, 100).toString() : '')}
                            value={percentage}
                            placeholder="100%"
                            variant="unstyled"
                            className={classNames(DEFAULT_INPUT_UNSTYLED, '!text-2xl')}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="xs" onClick={() => setPercentage('25')}>
                            25%
                          </Button>
                          <Button size="xs" onClick={() => setPercentage('50')}>
                            50%
                          </Button>
                          <Button size="xs" onClick={() => setPercentage('75')}>
                            75%
                          </Button>
                          <Button size="xs" onClick={() => setPercentage('100')}>
                            MAX
                          </Button>
                        </div>
                      </div>
                      <div className="grid items-center justify-between grid-cols-3 pb-2">
                        <AppearOnMount show={Boolean(balance)}>
                          <Typography variant="sm" weight={500} className="text-stone-300 hover:text-stone-20">
                            {formatUSD(
                              (Number(token0Minimum?.toFixed(2)) * value0 +
                                Number(token1Minimum?.toFixed(2)) * value1) *
                                (+percentage / 100)
                            )}
                          </Typography>
                        </AppearOnMount>
                        <AppearOnMount className="flex justify-end col-span-2" show={Boolean(balance)}>
                          <Typography
                            onClick={() => setPercentage('100')}
                            as="button"
                            variant="sm"
                            weight={500}
                            className="truncate text-stone-300 hover:text-stone-200"
                          >
                            Balance: {BalanceLPAmount.toFixed(2)}
                          </Typography>
                        </AppearOnMount>
                      </div>
                      <Transition
                        show={Boolean(+percentage > 0 && token0Minimum && token1Minimum)}
                        unmount={false}
                        className="transition-[max-height] overflow-hidden"
                        enter="duration-300 ease-in-out"
                        enterFrom="transform max-h-0"
                        enterTo="transform max-h-[380px]"
                        leave="transition-[max-height] duration-250 ease-in-out"
                        leaveFrom="transform max-h-[380px]"
                        leaveTo="transform max-h-0"
                      >
                        <div className="flex flex-col gap-3 py-3 pt-5 border-t border-stone-200/5">
                          <Typography variant="sm" weight={400} className="pb-1 text-stone-400">
                            You&apos;ll receive at least:
                          </Typography>

                          <div className="flex items-center justify-between">
                            <Typography variant="sm" weight={500} className="flex items-center gap-2 text-stone-50">
                              {token0 && <UICurrency.Icon currency={token0} width={20} height={20} />}
                              <span className="text-stone-400">
                                <span className="text-stone-50">{token0Minimum?.toSignificant(6)}</span>{' '}
                                {token0Minimum?.currency.symbol}
                              </span>
                            </Typography>
                            <Typography variant="xs" className="text-stone-400">
                              {formatUSD(Number(token0Minimum?.toFixed(2)) * value0 * (+percentage / 100))}
                            </Typography>
                          </div>
                          <div className="flex items-center justify-between">
                            <Typography variant="sm" weight={500} className="flex items-center gap-2 text-stone-50">
                              {token1 && <UICurrency.Icon currency={token1} width={20} height={20} />}
                              <span className="text-stone-400">
                                <span className="text-stone-50">{token1Minimum?.toSignificant(6)}</span>{' '}
                                {token1Minimum?.currency.symbol}
                              </span>
                            </Typography>
                            <Typography variant="xs" className="text-stone-400">
                              {formatUSD(Number(token1Minimum?.toFixed(2)) * value1 * (+percentage / 100))}
                            </Typography>
                          </div>
                        </div>
                      </Transition>
                      {children}
                    </div>
                  </Disclosure.Panel>
                </Transition>
              </>
            )}
          </Disclosure>
        </Widget.Content>
      </Widget>
    </div>
  )
}
