import { Disclosure, Transition } from '@headlessui/react'
import { ChainId } from '@dozer/chain'
import { Type } from '@dozer/currency'
import { useIsMounted } from '@dozer/hooks'
import { classNames, Widget, Typography, Button, Input, DEFAULT_INPUT_UNSTYLED, Currency } from '@dozer/ui'
import { Checker } from '@dozer/higmi'
import { TokenSelector } from '@dozer/higmi/components/TokenSelector'
import { ChevronDownIcon } from '@heroicons/react/24/solid'
import { FC, useState, useEffect, Fragment, useMemo } from 'react'
import { useNetwork } from '@dozer/zustand'
import { formatUSD } from '@dozer/format'
import { SettingsOverlay } from '../SettingsOverlay'
import { api } from '../../utils/api'
import { RemoveSectionReviewModalSingleToken } from './RemoveSectionReviewModalSingleToken'

interface RemoveSectionSingleTokenProps {
  chainId: ChainId
  token0: Type | undefined
  token1: Type | undefined
  isLoading?: boolean
  userAddress?: string
  fee?: number
  prices?: { [key: string]: number }
}

export const RemoveSectionSingleToken: FC<RemoveSectionSingleTokenProps> = ({
  chainId,
  token0,
  token1,
  userAddress,
  fee = 3, // Default 0.3%
  prices = {},
}) => {
  const isMounted = useIsMounted()
  const { network } = useNetwork()
  const [selectedToken, setSelectedToken] = useState<Type | undefined>(token0)
  const [hover, setHover] = useState(false)
  const [percentage, setPercentage] = useState<string>('100')
  const [tokenSelectorOpen, setTokenSelectorOpen] = useState(false)
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
      tokenA: token0?.uuid || '',
      tokenB: token1?.uuid || '',
      tokenOut: selectedToken?.uuid || '',
      fee: fee,
    },
    {
      enabled: !!userAddress && !!selectedToken && !!token0 && !!token1,
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
    setTokenSelectorOpen(false)
  }

  // Create available tokens array for the token selector
  const availableTokens = useMemo(() => {
    const tokens = []
    if (token0) tokens.push(token0)
    if (token1) tokens.push(token1)
    return tokens
  }, [token0, token1])

  // Check if user has liquidity
  const hasLiquidity = quoteData && quoteData.user_liquidity > 0

  // Calculate percentage-based amounts
  const percentageDecimal = parseFloat(percentage) / 100
  const adjustedQuoteData = quoteData
    ? {
        amount_out: quoteData.amount_out * percentageDecimal,
        token_a_withdrawn: quoteData.token_a_withdrawn * percentageDecimal,
        token_b_withdrawn: quoteData.token_b_withdrawn * percentageDecimal,
        swap_amount: quoteData.swap_amount * percentageDecimal,
        swap_output: quoteData.swap_output * percentageDecimal,
        user_liquidity: quoteData.user_liquidity, // This stays the same to show total
      }
    : null

  // Calculate USD values
  const selectedTokenPrice = selectedToken?.uuid && prices ? prices[selectedToken.uuid] : 0
  const usdValue = adjustedQuoteData ? adjustedQuoteData.amount_out * selectedTokenPrice : 0

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
        <div className="relative" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
          <Transition
            show={Boolean(hover && (!userAddress || !hasLiquidity))}
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
                You don&apos;t have liquidity in this pool
              </Typography>
            </div>
          </Transition>
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
                        {/* Percentage Selection */}
                        <div className="px-3 py-3 border-b border-stone-700">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <Typography variant="sm" weight={500} className="text-stone-300">
                                Amount to Remove:
                              </Typography>
                              <Typography variant="sm" weight={500} className="text-stone-300">
                                Receive Token:
                              </Typography>
                            </div>
                            <div className="flex gap-4 items-center">
                              <div className="flex flex-grow justify-between items-center">
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
                              <div className="w-32">
                                <button
                                  onClick={() => setTokenSelectorOpen(true)}
                                  className={classNames(
                                    'shadow-md hover:ring-2 bg-white bg-opacity-[0.12] ring-stone-500',
                                    'h-[36px] text-stone-200 hover:text-stone-100 transition-all flex flex-row items-center gap-1 text-xl font-semibold rounded-full px-2 py-1 w-full justify-center'
                                  )}
                                >
                                  {selectedToken ? (
                                    <>
                                      <div className="w-5 h-5">
                                        <Currency.Icon
                                          currency={selectedToken}
                                          width={20}
                                          height={20}
                                          priority
                                        />
                                      </div>
                                      <div className="ml-0.5 -mr-0.5">{selectedToken.symbol}</div>
                                    </>
                                  ) : (
                                    <div className="ml-0.5 -mr-0.5 pl-1">Select</div>
                                  )}
                                  <div className="w-5 h-5">
                                    <ChevronDownIcon width={20} height={20} />
                                  </div>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Single Token Mode Details */}
                        {selectedToken && adjustedQuoteData && percentage && parseFloat(percentage) > 0 && (
                          <div className="px-3 py-2 border-b bg-stone-800/50 border-stone-700">
                            <div className="space-y-2">
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-stone-400">Total Received:</span>
                                  <div className="text-right">
                                    <div className="font-medium text-stone-200">
                                      {formatAmount(adjustedQuoteData.amount_out)} {selectedToken.symbol}
                                    </div>
                                    {selectedTokenPrice > 0 && (
                                      <div className="text-xs text-stone-400">{formatUSD(usdValue)}</div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="pt-2 space-y-1 text-xs border-t border-stone-700">
                                <div className="mb-1 text-stone-400">Breakdown ({percentage}% of position):</div>
                                <div className="flex justify-between">
                                  <span className="text-stone-500">{token0?.symbol} withdrawn:</span>
                                  <span className="text-stone-300">
                                    {formatAmount(adjustedQuoteData.token_a_withdrawn)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-stone-500">{token1?.symbol} withdrawn:</span>
                                  <span className="text-stone-300">
                                    {formatAmount(adjustedQuoteData.token_b_withdrawn)}
                                  </span>
                                </div>
                                {adjustedQuoteData.swap_amount > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-stone-500">Swap amount:</span>
                                    <span className="text-blue-300">
                                      {formatAmount(adjustedQuoteData.swap_amount)} →{' '}
                                      {formatAmount(adjustedQuoteData.swap_output)}
                                    </span>
                                  </div>
                                )}
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

          {/* Token Selector Dialog */}
          <TokenSelector
            id="receive-token-selector"
            variant="dialog"
            onClose={() => setTokenSelectorOpen(false)}
            open={tokenSelectorOpen}
            chainId={chainId}
            currency={selectedToken}
            onSelect={handleTokenSelect}
            includeNative={false}
            tokens={availableTokens}
            showUnsignedSwitchInDialog={false}
          />
        </div>
      )}
    </RemoveSectionReviewModalSingleToken>
  )
}
