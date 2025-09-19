import { Disclosure, Transition } from '@headlessui/react'
import { ChainId } from '@dozer/chain'
import { Type } from '@dozer/currency'
import { useIsMounted } from '@dozer/hooks'
import { classNames, Widget, Currency, Typography, Button } from '@dozer/ui'
import { Checker } from '@dozer/higmi'
import { FC, useState, useEffect } from 'react'
import { useNetwork } from '@dozer/zustand'
import { SettingsOverlay } from '../SettingsOverlay'
import { api } from '../../utils/api'
import { RemoveSectionReviewModalSingleToken } from './RemoveSectionReviewModalSingleToken'

interface RemoveSectionSingleTokenProps {
  chainId: ChainId
  token0: Type | undefined
  token1: Type | undefined
  isLoading: boolean
  userAddress?: string
  fee?: number
}

export const RemoveSectionSingleToken: FC<RemoveSectionSingleTokenProps> = ({
  chainId,
  token0,
  token1,
  userAddress,
  fee = 3, // Default 0.3%
}) => {
  const isMounted = useIsMounted()
  const { network } = useNetwork()
  const [selectedToken, setSelectedToken] = useState<Type | undefined>(token0)
  const [quoteData, setQuoteData] = useState<{
    amount_out: number
    token_a_withdrawn: number
    token_b_withdrawn: number
    swap_amount: number
    swap_output: number
    user_liquidity: number
  } | null>(null)

  // Fetch single token removal quote
  const { data: quote, isLoading: quoteIsLoading } = api.getPools.quoteSingleTokenRemoval.useQuery(
    {
      address: userAddress || '',
      tokenOut: selectedToken?.uuid || '',
      fee: fee,
    },
    {
      enabled: !!userAddress && !!selectedToken,
      refetchInterval: 5000, // Refresh quote every 5 seconds
    }
  )

  useEffect(() => {
    if (quote) {
      setQuoteData(quote)
    }
  }, [quote])

  const formatAmount = (amount: number) => {
    return amount.toFixed(6).replace(/\.?0+$/, '')
  }

  const handleTokenSelect = (token: Type) => {
    setSelectedToken(token)
  }

  return (
    <RemoveSectionReviewModalSingleToken
      chainId={chainId}
      token0={token0}
      token1={token1}
      selectedToken={selectedToken}
      fee={fee}
      userAddress={userAddress}
    >
      {({ setOpen }) => (
        <Widget id="removeLiquiditySingleToken" maxWidth={400}>
          <Widget.Content>
            <Disclosure defaultOpen={true}>
              {() => (
                <>
                  {isMounted ? (
                    <Widget.Header title="Remove Liquidity" className="!pb-3">
                      <div className="flex items-center space-x-2">
                        <SettingsOverlay chainId={network} />
                      </div>
                    </Widget.Header>
                  ) : (
                    <Widget.Header title="Remove Liquidity" className="!pb-3" />
                  )}

                  <Transition
                    unmount={false}
                    className="transition-[max-height] overflow-hidden"
                    enter="duration-300 ease-in-out"
                    enterFrom="transform max-h-0"
                    enterTo="transform max-h-[480px]"
                    leave="transition-[max-height] duration-250 ease-in-out"
                    leaveFrom="transform max-h-[480px]"
                    leaveTo="transform max-h-0"
                  >
                    <Disclosure.Panel unmount={false}>
                      {/* Single Token Mode - Token Selection */}
                      <div className="px-3 py-3 border-b border-stone-700">
                        <div className="space-y-3">
                          <Typography variant="sm" weight={500} className="text-stone-300">
                            Receive Token:
                          </Typography>
                          <div className="flex space-x-2">
                            {token0 && (
                              <button
                                onClick={() => handleTokenSelect(token0)}
                                className={classNames(
                                  'flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border transition-colors',
                                  selectedToken?.uuid === token0.uuid
                                    ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                                    : 'border-stone-600 bg-stone-700/50 text-stone-300 hover:border-stone-500'
                                )}
                              >
                                <Currency.Icon currency={token0} width={20} height={20} />
                                <span className="text-sm font-medium">{token0.symbol}</span>
                              </button>
                            )}
                            {token1 && (
                              <button
                                onClick={() => handleTokenSelect(token1)}
                                className={classNames(
                                  'flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border transition-colors',
                                  selectedToken?.uuid === token1.uuid
                                    ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                                    : 'border-stone-600 bg-stone-700/50 text-stone-300 hover:border-stone-500'
                                )}
                              >
                                <Currency.Icon currency={token1} width={20} height={20} />
                                <span className="text-sm font-medium">{token1.symbol}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Single Token Mode Details */}
                      {selectedToken && quoteData && (
                        <div className="px-3 py-2 border-b bg-stone-800/50 border-stone-700">
                          <div className="space-y-2">
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-stone-400">Total Received:</span>
                                <span className="font-medium text-stone-200">
                                  {formatAmount(quoteData.amount_out)} {selectedToken.symbol}
                                </span>
                              </div>
                            </div>

                            <div className="pt-2 space-y-1 text-xs border-t border-stone-700">
                              <div className="mb-1 text-stone-400">Breakdown:</div>
                              <div className="flex justify-between">
                                <span className="text-stone-500">{token0?.symbol} withdrawn:</span>
                                <span className="text-stone-300">{formatAmount(quoteData.token_a_withdrawn)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-stone-500">{token1?.symbol} withdrawn:</span>
                                <span className="text-stone-300">{formatAmount(quoteData.token_b_withdrawn)}</span>
                              </div>
                              {quoteData.swap_amount > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-stone-500">Swap amount:</span>
                                  <span className="text-blue-300">
                                    {formatAmount(quoteData.swap_amount)} → {formatAmount(quoteData.swap_output)}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="pt-2 text-xs border-t border-stone-700">
                              <div className="flex justify-between">
                                <span className="text-stone-400">Your Liquidity:</span>
                                <span className="text-stone-200">
                                  {quoteData.user_liquidity.toLocaleString()} LP tokens
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Loading state for quote */}
                      {selectedToken && quoteIsLoading && (
                        <div className="px-3 py-3 border-b border-stone-700">
                          <div className="flex justify-center items-center">
                            <div className="w-4 h-4 rounded-full border-b-2 border-blue-500 animate-spin"></div>
                            <span className="ml-2 text-xs text-stone-400">Getting quote...</span>
                          </div>
                        </div>
                      )}

                      {/* Remove Liquidity Button */}
                      <div className="p-3">
                        <Checker.Connected fullWidth size="lg">
                          <Button
                            size="lg"
                            className="w-full"
                            disabled={!quoteData || !selectedToken}
                            onClick={() => setOpen(true)}
                          >
                            {quoteData && selectedToken ? 'Remove Liquidity' : 'Select token'}
                          </Button>
                        </Checker.Connected>
                      </div>
                    </Disclosure.Panel>
                  </Transition>
                </>
              )}
            </Disclosure>
          </Widget.Content>
        </Widget>
      )}
    </RemoveSectionReviewModalSingleToken>
  )
}
