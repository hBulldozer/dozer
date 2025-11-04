import { Disclosure, Transition } from '@headlessui/react'
import { ChainId } from '@dozer/chain'
import { Type } from '@dozer/currency'
import { useIsMounted } from '@dozer/hooks'
import { Widget, Currency, Typography, Button } from '@dozer/ui'
import { Web3Input, Checker } from '@dozer/higmi'
import { FC, useState, useEffect, useMemo } from 'react'
import { useNetwork } from '@dozer/zustand'
import { warningSeverity } from '@dozer/math'
import { SettingsOverlay } from '../SettingsOverlay'
import { api } from '../../utils/api'
import { AddSectionReviewModalSingleToken } from './AddSectionReviewModalSingleToken'

interface AddSectionSingleTokenProps {
  chainId: ChainId
  input: string
  token: Type | undefined
  otherToken: Type | undefined
  isLoading: boolean
  onSelectToken?(currency: Type): void
  onInput(value: string): void
  prices?: { [key: string]: number }
  fee?: number
}

export const AddSectionSingleToken: FC<AddSectionSingleTokenProps> = ({
  chainId,
  input,
  token,
  otherToken,
  onSelectToken,
  onInput,
  prices,
  isLoading,
  fee = 3, // Default 0.3%
}) => {
  const isMounted = useIsMounted()
  const { network } = useNetwork()
  const [quoteData, setQuoteData] = useState<{
    token_a_used: number
    token_b_used: number
    liquidity_amount: number
    excess_amount: number
    excess_token: string
    swap_amount: number
    swap_output: number
    price_impact: number
  } | null>(null)

  // Fetch single token quote when inputs change
  const { data: quote, isLoading: quoteIsLoading } = api.getPools.quoteSingleTokenLiquidity.useQuery(
    {
      tokenIn: token?.uuid || '',
      amountIn: parseFloat(input) || 0,
      tokenOut: otherToken?.uuid || '',
      fee: fee,
    },
    {
      enabled: !!token && !!otherToken && parseFloat(input) > 0,
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

  // Calculate price impact severity and color
  const priceImpactSeverity = useMemo(() => {
    if (!quoteData) return 0
    return warningSeverity(quoteData.price_impact)
  }, [quoteData])

  const priceImpactColor = useMemo(() => {
    if (priceImpactSeverity === 0 || priceImpactSeverity === 1) return 'text-green-400'
    if (priceImpactSeverity === 2) return 'text-yellow-400'
    if (priceImpactSeverity === 3) return 'text-orange-400'
    return 'text-red-400'
  }, [priceImpactSeverity])


  return (
    <AddSectionReviewModalSingleToken
      chainId={chainId}
      token={token}
      otherToken={otherToken}
      input={input}
      fee={fee}
      prices={prices}
    >
      {({ setOpen }) => (
        <Widget id="addLiquiditySingleToken" maxWidth={400}>
          <Widget.Content>
            <Disclosure defaultOpen={true}>
              {() => (
                <>
                  {isMounted ? (
                    <Widget.Header title="Add Liquidity" className="!pb-3">
                      <div className="flex items-center space-x-2">
                        <SettingsOverlay chainId={network} />
                      </div>
                    </Widget.Header>
                  ) : (
                    <Widget.Header title="Add Liquidity" className="!pb-3" />
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
                      {/* Amount Input with Integrated Token Selector */}
                      <div className="px-3 py-3">
                        <Web3Input.Currency
                          className=""
                          loading={isLoading}
                          value={input}
                          onChange={onInput}
                          onSelect={onSelectToken}
                          currency={token}
                          tokens={token && otherToken ? [token, otherToken] : []}
                          chainId={chainId}
                          prices={prices}
                          usdPctChange={0}
                        />
                      </div>

                  {/* Single Token Mode Details */}
                  {token && otherToken && (
                    <Transition
                      show={Boolean(parseFloat(input) > 0)}
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
                                <Typography variant="sm" weight={500} className="text-stone-300">
                                  Transaction Preview
                                </Typography>
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
                                  {quoteData && parseFloat(input) > 0 && (
                                    <>
                                      {/* Visual Route Display */}
                                      <div className="py-3">
                                        <div className="flex justify-center items-center space-x-3">
                                          {/* Input Token */}
                                          <div className="flex flex-col items-center space-y-1">
                                            <Currency.Icon currency={token} width={24} height={24} />
                                            <Typography variant="xs" className="text-stone-300">
                                              {parseFloat(input).toFixed(2)}
                                            </Typography>
                                          </div>

                                          {/* Arrow to Swap */}
                                          <div className="flex flex-col items-center">
                                            <svg
                                              className="w-4 h-4 text-stone-400"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M17 8l4 4m0 0l-4 4m4-4H3"
                                              />
                                            </svg>
                                            <Typography variant="xs" className="mt-1 text-stone-500">
                                              Swap
                                            </Typography>
                                          </div>

                                          {/* Split Result */}
                                          <div className="flex flex-col items-center space-y-2">
                                            <div className="flex flex-col items-center space-y-2">
                                              <div className="flex flex-col items-center space-y-1">
                                                <Currency.Icon currency={token} width={20} height={20} />
                                                <Typography variant="xs" className="text-green-300">
                                                  {formatAmount(quoteData.token_a_used)}
                                                </Typography>
                                              </div>
                                              <div className="flex flex-col items-center space-y-1">
                                                <Currency.Icon currency={otherToken} width={20} height={20} />
                                                <Typography variant="xs" className="text-green-300">
                                                  {formatAmount(quoteData.token_b_used)}
                                                </Typography>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Arrow to Pool */}
                                          <div className="flex flex-col items-center">
                                            <svg
                                              className="w-4 h-4 text-stone-400"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M17 8l4 4m0 0l-4 4m4-4H3"
                                              />
                                            </svg>
                                            <Typography variant="xs" className="mt-1 text-stone-500">
                                              Add LP
                                            </Typography>
                                          </div>

                                          {/* Final Position Value */}
                                          <div className="flex flex-col items-center space-y-1">
                                            <Currency.IconList iconWidth={24} iconHeight={24}>
                                              <Currency.Icon currency={token} width={24} height={24} />
                                              <Currency.Icon currency={otherToken} width={24} height={24} />
                                            </Currency.IconList>
                                            <Typography variant="xs" className="text-stone-400">
                                              {prices && token && otherToken && prices[token.uuid] && prices[otherToken.uuid] ? (
                                                <span className="text-green-300">
                                                  $
                                                  {(
                                                    quoteData.token_a_used * prices[token.uuid] +
                                                    quoteData.token_b_used * prices[otherToken.uuid]
                                                  ).toFixed(2)}
                                                </span>
                                              ) : (
                                                'LP Position'
                                              )}
                                            </Typography>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Summary */}
                                      <div className="pt-2 border-t border-stone-700">
                                        <div className="space-y-1 text-xs">
                                          <div className="flex justify-between">
                                            <span className="text-stone-500">Swap amount:</span>
                                            <span className="text-blue-300">
                                              {formatAmount(quoteData.swap_amount)} → {formatAmount(quoteData.swap_output)}
                                            </span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-stone-500">Price Impact:</span>
                                            <span className={priceImpactColor}>
                                              {quoteData.price_impact < 0.01
                                                ? '< 0.01%'
                                                : `${quoteData.price_impact.toFixed(2)}%`}
                                            </span>
                                          </div>
                                          {prices && token && prices[token.uuid] && (
                                            <div className="flex justify-between">
                                              <span className="text-stone-500">Value difference:</span>
                                              <span className="text-stone-300">
                                                ${(parseFloat(input) * prices[token.uuid]).toFixed(2)} →{' '}
                                                <span className="text-green-300">
                                                  $
                                                  {prices[otherToken?.uuid] ? (
                                                    quoteData.token_a_used * prices[token.uuid] +
                                                    quoteData.token_b_used * prices[otherToken.uuid]
                                                  ).toFixed(2) : '---'}
                                                </span>
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </>
                                  )}

                                  {quoteIsLoading && parseFloat(input) > 0 && (
                                    <div className="flex justify-center items-center py-4">
                                      <div className="w-4 h-4 rounded-full border-b-2 border-blue-500 animate-spin"></div>
                                      <span className="ml-2 text-xs text-stone-400">Getting quote...</span>
                                    </div>
                                  )}
                                </Disclosure.Panel>
                              </Transition>
                            </>
                          )}
                        </Disclosure>
                      </div>
                    </Transition>
                  )}

                      {/* Add Liquidity Button */}
                      <div className="p-3">
                        <Checker.Connected fullWidth size="lg">
                          <Checker.Amounts fullWidth size="lg" amount={Number(input)} token={token}>
                            <Button
                              size="lg"
                              className="w-full"
                              disabled={!quoteData || parseFloat(input) <= 0}
                              onClick={() => setOpen(true)}
                            >
                              {quoteData && parseFloat(input) > 0 ? 'Add Liquidity' : 'Enter an amount'}
                            </Button>
                          </Checker.Amounts>
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
    </AddSectionReviewModalSingleToken>
  )
}
