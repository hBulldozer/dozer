import { ChevronDownIcon, Square2StackIcon } from '@heroicons/react/24/solid'
import { Amount, Price, Type, getTokens } from '@dozer/currency'
import { ZERO } from '@dozer/math'
import { CopyHelper, Dialog, IconButton, Typography } from '@dozer/ui'
import { Currency } from '@dozer/ui'
import { FC, ReactNode, useMemo } from 'react'

// import { useTokenAmountDollarValues } from '../../lib/hooks'
import { Rate } from '../Rate'
import { RouteDisplay } from '../RouteDisplay'
import { TradeType, useSettings, useTrade } from '@dozer/zustand'
import { Token } from '@dozer/currency'
import { api } from 'utils/api'

interface SwapReviewModalBase {
  chainId: number | undefined
  open: boolean
  setOpen(open: boolean): void
  children: ReactNode
}

export const SwapReviewModalBase: FC<SwapReviewModalBase> = ({ chainId, children, open, setOpen }) => {
  const { slippageTolerance } = useSettings()
  const { amountSpecified, outputAmount, tradeType, mainCurrencyPrice, otherCurrencyPrice, pool, routeInfo } =
    useTrade()
  const { data: tokens } = api.getTokens.all.useQuery()
  const input0 = amountSpecified
    ? amountSpecified * (tradeType === TradeType.EXACT_OUTPUT ? 1 + slippageTolerance : 1)
    : 0
  // const input1 = useTrade((state) => state.outputAmount)
  const value0 = useTrade((state) => state.mainCurrencyPrice)
  // const value1 = useTrade((state) => state.otherCurrencyPrice)
  const token1 = useTrade((state) => state.mainCurrency)
  const token2 = useTrade((state) => state.otherCurrency)
  // const input0 = amountSpecified ? amountSpecified * (1 - slippageTolerance) : 0
  const input1 = outputAmount ? outputAmount * (tradeType === TradeType.EXACT_INPUT ? 1 - slippageTolerance : 1) : 0
  // const value0 = mainCurrencyPrice ? mainCurrencyPrice * (1 - slippageTolerance) : 0
  const value1 = otherCurrencyPrice ? otherCurrencyPrice : 0

  // Helper function to get token by UUID
  const getTokenByUuid = (uuid: string): Token | undefined => {
    if (!tokens) return undefined
    const dbToken = tokens.find((t) => t.uuid === uuid)
    if (!dbToken) return undefined

    return new Token({
      chainId: dbToken.chainId,
      uuid: dbToken.uuid,
      decimals: dbToken.decimals,
      name: dbToken.name,
      symbol: dbToken.symbol,
      imageUrl: dbToken.imageUrl || undefined,
      bridged: !!dbToken.bridged,
      originalAddress: dbToken.originalAddress || undefined,
      sourceChain: dbToken.sourceChain || undefined,
      targetChain: dbToken.targetChain || undefined,
    })
  }

  // Convert route info to RouteDisplay format
  const routeSteps = useMemo(() => {
    if (!routeInfo || !Array.isArray(routeInfo.path) || routeInfo.path.length < 2) return []

    const steps = []

    // Based on the console output, the path contains pool keys like "tokenA/tokenB/fee"
    // Let's extract tokens in order by parsing the path sequentially
    const tokens = []

    // First item might be a token UUID (starting token)
    if (routeInfo.path[0] && typeof routeInfo.path[0] === 'string' && !routeInfo.path[0].includes('/')) {
      tokens.push(routeInfo.path[0])
    }

    // Process each pool key to extract the token sequence
    for (let i = 0; i < routeInfo.path.length; i++) {
      const poolKey = routeInfo.path[i]
      if (typeof poolKey === 'string' && poolKey.includes('/')) {
        const [tokenA, tokenB, feeStr] = poolKey.split('/')

        // Add tokens in sequence (avoid duplicates while maintaining order)
        if (tokens.length === 0) {
          tokens.push(tokenA, tokenB)
        } else {
          // Add the token that's not already the last one
          const lastToken = tokens[tokens.length - 1]
          if (tokenA === lastToken && tokenB) {
            tokens.push(tokenB)
          } else if (tokenB === lastToken && tokenA) {
            tokens.push(tokenA)
          } else if (tokenA && !tokens.includes(tokenA)) {
            tokens.push(tokenA)
          } else if (tokenB && !tokens.includes(tokenB)) {
            tokens.push(tokenB)
          }
        }
      }
    }

    // Create steps from consecutive token pairs
    for (let i = 0; i < tokens.length - 1; i++) {
      const tokenInUuid = tokens[i]
      const tokenOutUuid = tokens[i + 1]

      const tokenIn = getTokenByUuid(tokenInUuid)
      const tokenOut = getTokenByUuid(tokenOutUuid)

      if (tokenIn && tokenOut) {
        // Find the pool that connects these tokens
        const connectingPool = routeInfo.path.find(
          (poolKey) =>
            typeof poolKey === 'string' &&
            poolKey.includes('/') &&
            poolKey.includes(tokenInUuid) &&
            poolKey.includes(tokenOutUuid)
        )

        // Extract fee from pool key (format: tokenA/tokenB/fee)
        let fee = 0.5 // Default
        if (connectingPool && typeof connectingPool === 'string') {
          const parts = connectingPool.split('/')
          if (parts[2]) {
            fee = parseInt(parts[2]) / 1000 // Convert from basis points to percentage
          }
        }

        steps.push({
          tokenIn,
          tokenOut,
          pool: connectingPool || `${tokenInUuid}/${tokenOutUuid}/${fee}`,
          fee,
          amountIn: routeInfo.amounts[i] || 0,
          amountOut: routeInfo.amounts[i + 1] || 0,
          priceImpact: routeInfo.priceImpact / tokens.length, // Distribute price impact
        })
      }
    }

    return steps
  }, [routeInfo, tokens])

  return (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <Dialog.Content className="max-w-sm !pb-4">
        <Dialog.Header border={false} title="Confirm Swap" onClose={() => setOpen(false)} />
        <div className="!my-0 grid grid-cols-12 items-center">
          <div className="flex relative flex-col col-span-12 gap-1 p-2 rounded-2xl border sm:p-4 bg-stone-700/40 border-stone-200/5">
            <div className="flex gap-2 items-center">
              <div className="flex gap-2 justify-between items-center w-full">
                <Typography variant="h3" weight={500} className="truncate text-stone-50">
                  {input0?.toFixed(2)}{' '}
                </Typography>
                <div className="flex gap-2 justify-end items-center text-right">
                  {input0 && (
                    <div className="w-5 h-5">
                      <Currency.Icon currency={token1 ? token1 : getTokens(chainId)[0]} width={20} height={20} />
                    </div>
                  )}
                  <Typography variant="h3" weight={500} className="text-right text-stone-50">
                    {token1 ? token1.symbol : getTokens(chainId)[0].symbol}
                  </Typography>
                </div>
              </div>
            </div>
            <Typography variant="sm" weight={500} className="text-stone-500">
              {value0 && input0 ? `$${(value0 * input0).toFixed(2)}` : '-'}
            </Typography>
          </div>
          <div className="flex items-center justify-center col-span-12 -mt-2.5 -mb-2.5">
            <div className="p-0.5 bg-stone-700 border-2 border-stone-800 ring-1 ring-stone-200/5 z-10 rounded-full">
              <ChevronDownIcon width={18} height={18} className="text-stone-200" />
            </div>
          </div>
          <div className="flex flex-col col-span-12 gap-1 p-2 rounded-2xl border sm:p-4 bg-stone-700/40 border-stone-200/5">
            <div className="flex gap-2 items-center">
              <div className="flex gap-2 justify-between items-center w-full">
                <Typography variant="h3" weight={500} className="truncate text-stone-50">
                  {input1?.toFixed(2)}{' '}
                </Typography>
                <div className="flex gap-2 justify-end items-center text-right">
                  {input1 && (
                    <div className="w-5 h-5">
                      <Currency.Icon currency={token2 ? token2 : getTokens(chainId)[0]} width={20} height={20} />
                    </div>
                  )}
                  <Typography variant="h3" weight={500} className="text-right text-stone-50">
                    {token2 ? token2?.symbol : getTokens(chainId)[0].symbol}
                  </Typography>
                </div>
              </div>
            </div>
            <Typography variant="sm" weight={500} className="text-stone-500">
              {value1 && input1 ? `$${(value1 * input1).toFixed(2)}` : ''}
            </Typography>
          </div>
        </div>
        <div className="flex gap-2 justify-center items-center py-6">
          <Rate token1={token1} token2={token2}>
            {({ toggleInvert, content, usdPrice }) => (
              <Typography
                as="button"
                onClick={() => toggleInvert()}
                // variant="sm"
                weight={600}
                className="flex gap-1 items-center text-stone-100"
              >
                {content} {usdPrice && <span className="font-normal text-stone-300">(${usdPrice})</span>}
              </Typography>
            )}
          </Rate>
        </div>

        {/* Route Display */}
        {routeSteps.length > 0 && (
          <div className="px-4 pb-4">
            <RouteDisplay
              route={routeSteps}
              totalPriceImpact={routeInfo?.priceImpact || 0}
              estimatedCost={0.01}
              className="!p-4 !bg-stone-800/20"
            />
          </div>
        )}

        {children}
      </Dialog.Content>
    </Dialog>
  )
}
