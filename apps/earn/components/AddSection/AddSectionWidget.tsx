import { Disclosure, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { PlusIcon } from '@heroicons/react/24/solid'
import { ChainId } from '@dozer/chain'
import { Type, getTokens } from '@dozer/currency'
import { useIsMounted } from '@dozer/hooks'
import { classNames } from '@dozer/ui'
import { Widget } from '@dozer/ui'
import { Web3Input } from '@dozer/higmi'
import { FC, ReactNode } from 'react'
import { TradeType, useNetwork } from '@dozer/zustand'
import { SettingsOverlay } from '../SettingsOverlay'

// import { useCustomTokens } from '../../lib/state/storage'
// import { useTokens } from '../../lib/state/token-lists'
// import { SettingsOverlay } from '../SettingsOverlay'

interface AddSectionWidgetProps {
  isFarm: boolean
  chainId: ChainId
  input0: string
  input1: string
  token0: Type | undefined
  token1: Type | undefined
  isLoading: boolean
  tradeType: TradeType
  onSelectToken0?(currency: Type): void
  onSelectToken1?(currency: Type): void
  onInput0(value: string): void
  onInput1(value: string): void
  prices?: { [key: string]: number }
  children: ReactNode
}

export const AddSectionWidget: FC<AddSectionWidgetProps> = ({
  isFarm,
  chainId,
  input0,
  input1,
  token0,
  token1,
  onSelectToken0,
  onSelectToken1,
  onInput0,
  onInput1,
  prices,
  children,
  isLoading,
  tradeType,
}) => {
  const isMounted = useIsMounted()
  const { network } = useNetwork()
  // const [customTokensMap, { addCustomToken, removeCustomToken }] = useCustomTokens(chainId)
  return (
    <Widget id="addLiquidity" maxWidth={400}>
      <Widget.Content>
        <Disclosure defaultOpen={true}>
          {({ open }) => (
            <>
              {isMounted ? (
                <Widget.Header title="Add Liquidity" className="!pb-3 ">
                  {/* <div className="flex gap-3"> */}
                  <SettingsOverlay chainId={network} />
                  {/* <Disclosure.Button className="w-full pr-0.5">
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
                            className="hidden group-hover:text-stone-200 text-stone-300"
                          />
                        </div>
                      </div>
                    </Disclosure.Button> */}
                  {/* </div> */}
                </Widget.Header>
              ) : (
                <Widget.Header title="Add Liquidity" className="!pb-3" />
              )}
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
                  <Web3Input.Currency
                    className="p-3"
                    loading={tradeType == TradeType.EXACT_OUTPUT && isLoading}
                    value={input0}
                    onChange={onInput0}
                    onSelect={onSelectToken0}
                    currency={token0}
                    // customTokenMap={customTokensMap}
                    // onAddToken={addCustomToken}
                    // onRemoveToken={removeCustomToken}
                    chainId={chainId}
                    // tokenMap={tokenMap}
                    prices={prices}
                  />
                  <div className="flex items-center justify-center -mt-[12px] -mb-[12px] z-10">
                    <div className="group bg-stone-700 p-0.5 border-2 border-stone-800 transition-all rounded-full">
                      <PlusIcon width={16} height={16} />
                    </div>
                  </div>
                  <div className="bg-stone-800">
                    <Web3Input.Currency
                      className="p-3 !pb-1"
                      loading={tradeType == TradeType.EXACT_INPUT && isLoading}
                      value={input1}
                      onChange={onInput1}
                      currency={token1}
                      onSelect={onSelectToken1}
                      prices={prices}
                      // customTokenMap={customTokensMap}
                      // onAddToken={addCustomToken}
                      // onRemoveToken={removeCustomToken}
                      chainId={chainId}
                      // tokenMap={tokenMap}
                    />
                    <div className="p-3">{children}</div>
                  </div>
                </Disclosure.Panel>
              </Transition>
            </>
          )}
        </Disclosure>
      </Widget.Content>
    </Widget>
  )
}
