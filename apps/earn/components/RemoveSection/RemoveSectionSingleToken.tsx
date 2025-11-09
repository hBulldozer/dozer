import { Disclosure, Transition } from '@headlessui/react'
import { ChainId } from '@dozer/chain'
import { Type } from '@dozer/currency'
import { useIsMounted } from '@dozer/hooks'
import { classNames, Widget, Typography, Button, Input, DEFAULT_INPUT_UNSTYLED, Currency } from '@dozer/ui'
import { Checker } from '@dozer/higmi'
import { TokenSelector } from '@dozer/higmi/components/TokenSelector'
import { ChevronDownIcon } from '@heroicons/react/24/solid'
import { FC, useState, useEffect, Fragment, useMemo, useCallback } from 'react'
import { useNetwork } from '@dozer/zustand'
import { formatUSD } from '@dozer/format'
import { warningSeverity } from '@dozer/math'
import { SettingsOverlay } from '../SettingsOverlay'
import { api } from '../../utils/api'
import { RemoveSectionReviewModalSingleToken } from './RemoveSectionReviewModalSingleToken'
import { HighPriceImpactConfirmation } from '../HighPriceImpactConfirmation'

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
  const [showPriceImpactWarning, setShowPriceImpactWarning] = useState(false)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [quoteData, setQuoteData] = useState<{
    amount_out: number
    token_a_withdrawn: number
    token_b_withdrawn: number
    swap_amount: number
    swap_output: number
    price_impact: number
    user_liquidity: number
  } | null>(null)

  // Create pool key for the new API
  const poolKey = useMemo(() => {
    if (!token0 || !token1) return ''
    // Ensure tokens are ordered (same as contract)
    const [tokenA, tokenB] = token0.uuid > token1.uuid ? [token1, token0] : [token0, token1]
    return `${tokenA.uuid}/${tokenB.uuid}/${fee * 10}` // Convert fee to basis points
  }, [token0, token1, fee])

  // Fetch single token removal quote using percentage-based method
  const { data: quote, isLoading: quoteIsLoading } = api.getPools.quoteSingleTokenRemovalPercentage.useQuery(
    {
      address: userAddress || '',
      poolKey: poolKey,
      tokenOut: selectedToken?.uuid || '',
      percentage: parseFloat(percentage) || 100,
    },
    {
      enabled: !!userAddress && !!selectedToken && !!poolKey && !!percentage,
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

  // Use quote data directly (already calculated with percentage on the backend)
  const adjustedQuoteData = quoteData

  // Calculate USD values
  const selectedTokenPrice = selectedToken?.uuid && prices ? prices[selectedToken.uuid] : 0
  const usdValue = adjustedQuoteData ? adjustedQuoteData.amount_out * selectedTokenPrice : 0

  const handleRemoveLiquidityClick = useCallback(() => {
    if (!adjustedQuoteData) return

    // Check for high price impact (5-15% range requires confirmation)
    if (adjustedQuoteData.price_impact >= 5 && adjustedQuoteData.price_impact < 15) {
      setShowPriceImpactWarning(true)
    } else {
      setReviewModalOpen(true)
    }
  }, [adjustedQuoteData])

  const handleConfirmHighImpact = useCallback(() => {
    setReviewModalOpen(true)
  }, [])

  return (
    <>
      <HighPriceImpactConfirmation
        isOpen={showPriceImpactWarning}
        onClose={() => setShowPriceImpactWarning(false)}
        onConfirm={handleConfirmHighImpact}
        priceImpact={adjustedQuoteData?.price_impact || 0}
        action="remove"
      />
      <RemoveSectionReviewModalSingleToken
        chainId={chainId}
        token0={token0}
        token1={token1}
        selectedToken={selectedToken}
        fee={fee}
        userAddress={userAddress}
        percentage={percentage}
        poolKey={poolKey}
        prices={prices}
        open={reviewModalOpen}
        setOpen={setReviewModalOpen}
      >
        {() => (
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
                            <div className="flex gap-3 items-center">
                              <div className="flex-1 min-w-0">
                                <Input.Percent
                                  onUserInput={(val) => setPercentage(val ? Math.min(+val, 100).toString() : '')}
                                  value={percentage}
                                  placeholder="100%"
                                  variant="unstyled"
                                  className={classNames(DEFAULT_INPUT_UNSTYLED, '!text-2xl')}
                                />
                              </div>
                              <div className="flex flex-shrink-0 gap-2">
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
                              <div className="flex-shrink-0 w-25">
                                <button
                                  onClick={() => setTokenSelectorOpen(true)}
                                  className={classNames(
                                    'shadow-md hover:ring-2 bg-white bg-opacity-[0.12] ring-stone-500',
                                    'h-[36px] text-stone-200 hover:text-stone-100 transition-all flex flex-row items-center gap-1 text-sm font-semibold rounded-full px-3 py-1 w-full justify-center'
                                  )}
                                >
                                  {selectedToken ? (
                                    <>
                                      <div className="flex-shrink-0 w-4 h-4">
                                        <Currency.Icon currency={selectedToken} width={16} height={16} priority />
                                      </div>
                                      <div className="text-xs truncate">{selectedToken.symbol}</div>
                                    </>
                                  ) : (
                                    <div className="text-xs">Select</div>
                                  )}
                                  <div className="flex-shrink-0 w-4 h-4">
                                    <ChevronDownIcon width={16} height={16} />
                                  </div>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Single Token Mode Details */}
                        {selectedToken && percentage && parseFloat(percentage) > 0 && (
                          <Transition
                            show={Boolean(selectedToken && parseFloat(percentage) > 0)}
                            unmount={false}
                            className="transition-[max-height] overflow-hidden"
                            enter="duration-300 ease-in-out"
                            enterFrom="transform max-h-0"
                            enterTo="transform max-h-[400px]"
                            leave="transition-[max-height] duration-250 ease-in-out"
                            leaveFrom="transform max-h-[400px]"
                            leaveTo="transform max-h-0"
                          >
                            <div className="px-3 py-2 border-b bg-stone-800/50 border-stone-700">
                              <Disclosure>
                                {({ open }) => (
                                  <>
                                    <div className="flex justify-between items-center py-2">
                                      <div className="flex gap-2 items-center">
                                        <Typography variant="sm" weight={500} className="text-stone-300">
                                          Transaction Preview
                                        </Typography>
                                        {adjustedQuoteData && (
                                          <Typography variant="xs" className="text-stone-400">
                                            ({percentage}% of position)
                                          </Typography>
                                        )}
                                      </div>
                                      <Disclosure.Button>
                                        <div className="flex gap-2 items-center cursor-pointer text-stone-400 hover:text-stone-100">
                                          <Typography variant="sm" weight={500}>
                                            {open ? 'Hide' : 'Details'}
                                          </Typography>
                                          <svg
                                            className={`w-5 h-5 transition-transform ${
                                              open ? 'rotate-180' : 'rotate-0'
                                            }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M19 9l-7 7-7-7"
                                            />
                                          </svg>
                                        </div>
                                      </Disclosure.Button>
                                    </div>

                                    {adjustedQuoteData && (
                                      <div className="py-2 space-y-1 text-xs">
                                        <div className="flex justify-between">
                                          <span className="text-stone-400">You will receive:</span>
                                          <div className="text-right">
                                            <div className="font-medium text-stone-200">
                                              {formatAmount(adjustedQuoteData.amount_out)} {selectedToken.symbol}
                                            </div>
                                            {selectedTokenPrice > 0 && (
                                              <div className="text-xs text-green-300">{formatUSD(usdValue)}</div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}

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
                                        {adjustedQuoteData && (
                                          <>
                                            {/* Visual Route Display */}
                                            <div className="py-3 border-t border-stone-700">
                                              <div className="flex justify-center items-center space-x-3">
                                                {/* LP Position */}
                                                <div className="flex flex-col items-center space-y-1">
                                                  {token0 && token1 && (
                                                    <Currency.IconList iconWidth={24} iconHeight={24}>
                                                      <Currency.Icon currency={token0} width={24} height={24} />
                                                      <Currency.Icon currency={token1} width={24} height={24} />
                                                    </Currency.IconList>
                                                  )}
                                                  <Typography variant="xs" className="text-stone-300">
                                                    LP Position
                                                  </Typography>
                                                  {prices &&
                                                    token0 &&
                                                    token1 &&
                                                    prices[token0.uuid] &&
                                                    prices[token1.uuid] && (
                                                      <Typography variant="xs" className="text-stone-500">
                                                        $
                                                        {(
                                                          adjustedQuoteData.token_a_withdrawn * prices[token0.uuid] +
                                                          adjustedQuoteData.token_b_withdrawn * prices[token1.uuid]
                                                        ).toFixed(2)}
                                                      </Typography>
                                                    )}
                                                </div>

                                                {/* Arrow to Withdrawal */}
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
                                                    Withdraw
                                                  </Typography>
                                                </div>

                                                {/* Withdrawn Tokens */}
                                                <div className="flex flex-col items-center space-y-2">
                                                  <div className="flex flex-col items-center space-y-2">
                                                    {token0 && (
                                                      <div className="flex flex-col items-center space-y-1">
                                                        <Currency.Icon currency={token0} width={20} height={20} />
                                                        <Typography variant="xs" className="text-green-300">
                                                          {formatAmount(adjustedQuoteData.token_a_withdrawn)}
                                                        </Typography>
                                                      </div>
                                                    )}
                                                    {token1 && (
                                                      <div className="flex flex-col items-center space-y-1">
                                                        <Currency.Icon currency={token1} width={20} height={20} />
                                                        <Typography variant="xs" className="text-green-300">
                                                          {formatAmount(adjustedQuoteData.token_b_withdrawn)}
                                                        </Typography>
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>

                                                {adjustedQuoteData.swap_amount > 0 && (
                                                  <>
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
                                                  </>
                                                )}

                                                {/* Final Token */}
                                                <div className="flex flex-col items-center space-y-1">
                                                  <Currency.Icon currency={selectedToken} width={24} height={24} />
                                                  <Typography variant="xs" className="text-green-300">
                                                    {formatAmount(adjustedQuoteData.amount_out)}
                                                  </Typography>
                                                  {selectedTokenPrice > 0 && (
                                                    <Typography variant="xs" className="text-stone-500">
                                                      {formatUSD(usdValue)}
                                                    </Typography>
                                                  )}
                                                </div>
                                              </div>
                                            </div>

                                            {/* Summary */}
                                            <div className="pt-2 space-y-1 text-xs border-t border-stone-700">
                                              <div className="mb-1 text-stone-400">Breakdown:</div>
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
                                                  <span className="text-stone-500">Price Impact:</span>
                                                  <span className={priceImpactColor}>
                                                    {adjustedQuoteData.price_impact < 0.01
                                                      ? '< 0.01%'
                                                      : `${adjustedQuoteData.price_impact.toFixed(2)}%`}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          </>
                                        )}
                                      </Disclosure.Panel>
                                    </Transition>
                                  </>
                                )}
                              </Disclosure>
                            </div>
                          </Transition>
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
                              onClick={handleRemoveLiquidityClick}
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
    </>
  )
}
