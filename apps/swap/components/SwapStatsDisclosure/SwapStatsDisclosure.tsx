import { Disclosure, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/24/solid'
import { classNames, Typography, Skeleton } from '@dozer/ui'
import React, { FC, useMemo, useState, useEffect } from 'react'
import { Token } from '@dozer/currency'

// Simple USD formatting
const formatUSD = (value: number): string => {
  if (value === 0) return '0.00'
  if (value >= 0.1) {
    return value.toFixed(2)
  }
  if (value < 0.1) {
    return value.toFixed(4)
  }
  return value.toFixed(2)
}

import { Rate } from '../../components'
import { RouteDisplay, RouteDisplaySkeleton } from '../RouteDisplay'
import { useTrade, useSettings } from '@dozer/zustand'
import { warningSeverity, calculateUSDPriceImpact } from '../utils/functions'
import { api } from 'utils/api'
// import { useSettings } from '../../lib/state/storage'

interface SwapStats {
  prices: { [key: string]: number }
  loading?: boolean
}

export const SwapStatsDisclosure: FC<SwapStats> = ({ prices, loading = false }) => {
  const trade = useTrade()
  const { data: tokens } = api.getTokens.all.useQuery()
  // const [showRoute, setShowRoute] = useState(false)
  const { mainCurrency, otherCurrency, routeInfo } = useTrade()

  // Add same delay as Rate component to prevent glitch
  const [delayedLoading, setDelayedLoading] = useState(false)

  useEffect(() => {
    if (loading) {
      setDelayedLoading(true)
    } else {
      const timer = setTimeout(() => {
        setDelayedLoading(false)
      }, 350)
      return () => clearTimeout(timer)
    }
  }, [loading])

  // Check if we have valid trade data to prevent showing stale data
  const hasValidTradeData = trade.amountSpecified && trade.outputAmount && !delayedLoading

  const slippageTolerance = useSettings((state) => state.slippageTolerance)

  // Calculate USD-based price impact
  const usdPriceImpact = useMemo(() => {
    if (!trade.mainCurrency || !trade.otherCurrency || !trade.amountSpecified || !trade.outputAmount) {
      return undefined
    }

    const inputTokenPrice = prices[trade.mainCurrency.uuid]
    const outputTokenPrice = prices[trade.otherCurrency.uuid]

    return calculateUSDPriceImpact(trade.amountSpecified, trade.outputAmount, inputTokenPrice, outputTokenPrice)
  }, [trade.amountSpecified, trade.outputAmount, trade.mainCurrency, trade.otherCurrency, prices])

  // Use USD price impact if available, fallback to contract price impact
  const displayPriceImpact = usdPriceImpact ?? trade?.priceImpact
  const priceImpactSeverity = useMemo(() => warningSeverity(displayPriceImpact), [displayPriceImpact])

  // Convert route info to RouteDisplay format
  const routeSteps = useMemo(() => {
    if (!routeInfo || !routeInfo.poolPath || !routeInfo.path || !mainCurrency || !otherCurrency) return []

    // Helper function to get token by UUID
    const getTokenByUuid = (uuid: string): Token | undefined => {
      if (!tokens) return undefined

      // First try to find in the regular tokens list (signed pools)
      const dbToken = tokens.find((t) => t.uuid === uuid)
      if (dbToken) {
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

      // If not found in signed pools, check if it's one of the main currencies (unsigned tokens)
      // This handles the case where we're dealing with unsigned tokens
      if (uuid === mainCurrency?.uuid) {
        return mainCurrency
      }
      if (uuid === otherCurrency?.uuid) {
        return otherCurrency
      }

      // For other unsigned tokens, create a basic token object with minimal info
      // This is a fallback to prevent the RouteDisplay from breaking
      return new Token({
        chainId: 1, // Default chainId
        uuid: uuid,
        decimals: 2, // Standard Hathor decimals
        name: uuid === '00' ? 'Hathor' : `Token ${uuid.substring(0, 8)}`,
        symbol: uuid === '00' ? 'HTR' : uuid.substring(0, 8).toUpperCase(),
        imageUrl: undefined,
      })
    }

    // Use poolPath for pool keys and path for token sequence
    const poolKeys =
      typeof routeInfo.poolPath === 'string' ? routeInfo.poolPath.split(',').map((s: string) => s.trim()) : []
    const tokenPath = Array.isArray(routeInfo.path) ? routeInfo.path : []

    if (poolKeys.length < 1 || tokenPath.length < 2) return []

    const steps = []

    // Create steps from consecutive token pairs using the correct token path
    for (let i = 0; i < tokenPath.length - 1; i++) {
      const tokenInUuid = tokenPath[i]
      const tokenOutUuid = tokenPath[i + 1]

      const tokenIn = getTokenByUuid(tokenInUuid)
      const tokenOut = getTokenByUuid(tokenOutUuid)

      if (tokenIn && tokenOut) {
        // Find the pool that connects these tokens
        const connectingPool = poolKeys.find((poolKey) => {
          const [tokenA, tokenB] = poolKey.split('/')
          return (
            (tokenA === tokenInUuid && tokenB === tokenOutUuid) || (tokenA === tokenOutUuid && tokenB === tokenInUuid)
          )
        })

        // Extract fee from pool key (format: tokenA/tokenB/fee)
        let fee = 0.5 // Default
        if (connectingPool) {
          const parts = connectingPool.split('/')
          if (parts[2]) {
            fee = parseInt(parts[2]) / 10 // Convert from basis points to percentage
          }
        }

        steps.push({
          tokenIn,
          tokenOut,
          pool: connectingPool || `${tokenInUuid}/${tokenOutUuid}/${fee * 10}`,
          fee,
          amountIn: routeInfo.amounts[i] || 0,
          amountOut: routeInfo.amounts[i + 1] || 0,
          priceImpact: routeInfo.priceImpact / (tokenPath.length - 1), // Distribute price impact
        })
      }
    }

    return steps
  }, [routeInfo, tokens, mainCurrency, otherCurrency])

  const stats = (
    <div className="grid grid-cols-2 gap-x-3 gap-y-4">
      <Typography variant="xs" weight={400} className="flex items-center text-stone-500">
        Price Impact
      </Typography>
      <Typography
        variant="sm"
        weight={600}
        className={classNames(
          priceImpactSeverity === 2 ? 'text-yellow-400' : priceImpactSeverity > 2 ? 'text-red-400' : 'text-stone-100',
          'text-right truncate flex items-center justify-end'
        )}
      >
        {delayedLoading || !hasValidTradeData ? (
          <div className="w-[50px] h-[14px] bg-stone-600 animate-pulse rounded" />
        ) : displayPriceImpact && displayPriceImpact > 0 ? (
          `${displayPriceImpact.toFixed(2)}%`
        ) : (
          '< 0.01%'
        )}
      </Typography>

      <Typography variant="xs" weight={400} className="flex items-center text-stone-500">
        Minimum Received
      </Typography>
      <Typography
        variant="sm"
        weight={600}
        className="flex justify-end items-center text-right truncate text-stone-100"
      >
        {delayedLoading || !hasValidTradeData ? (
          <div className="w-[80px] h-[14px] bg-stone-600 animate-pulse rounded" />
        ) : trade.outputAmount ? (
          `${(trade.outputAmount * (1 - slippageTolerance / 100)).toFixed(2)} ${trade.otherCurrency?.symbol || ''}`
        ) : (
          ''
        )}
      </Typography>
    </div>
  )

  return (
    <>
      <Transition
        show={Boolean(
          trade.amountSpecified ||
            routeInfo ||
            (process.env.NODE_ENV === 'development' && mainCurrency && otherCurrency)
        )}
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
              <div className="flex justify-between items-center px-4 py-3 gap-2">
                <Rate token1={mainCurrency} token2={otherCurrency} prices={prices} loading={loading}>
                  {({ content, usdPrice, toggleInvert }) => (
                    <div
                      className="text-sm text-stone-300 hover:text-stone-50 cursor-pointer gap-1 font-semibold tracking-tight h-[36px] flex items-center truncate"
                      onClick={toggleInvert}
                    >
                      <Typography variant="sm" weight={600} className="flex gap-1 items-center text-stone-100">
                        {content}
                      </Typography>
                      {/* Don't show USD price if loading or no valid trade data */}
                      {usdPrice && Number(usdPrice) > 0 && hasValidTradeData && (
                        <Typography variant="sm" weight={500} className="text-stone-300">
                          (${formatUSD(Number(usdPrice))})
                        </Typography>
                      )}
                    </div>
                  )}
                </Rate>
                <Disclosure.Button>
                  <div className="flex gap-2 items-center cursor-pointer text-stone-400 hover:text-stone-100">
                    <Typography variant="sm" weight={500}>
                      {open ? 'Hide' : 'Details'}
                    </Typography>
                    <ChevronDownIcon
                      width={20}
                      className={classNames('transition-all', open ? 'rotate-180' : 'rotate-0')}
                    />
                  </div>
                </Disclosure.Button>
              </div>

              <Transition
                unmount={false}
                show={open}
                className="transition-[max-height] overflow-hidden"
                enter="duration-300 ease-in-out"
                enterFrom="transform max-h-0"
                enterTo="transform max-h-[380px]"
                leave="transition-[max-height] duration-250 ease-in-out"
                leaveFrom="transform max-h-[380px]"
                leaveTo="transform max-h-0"
              >
                <Disclosure.Panel className="border-t border-stone-200/10 px-4 pb-4 pt-4">
                  {stats}
                  {(routeInfo && routeSteps.length > 0) ||
                  delayedLoading ||
                  (trade.amountSpecified && trade.mainCurrency && trade.otherCurrency) ? (
                    <div className="pt-6 mt-4 border-t border-stone-200/5">
                      {delayedLoading || !hasValidTradeData || routeSteps.length === 0 ? (
                        <RouteDisplaySkeleton hopCount={1} />
                      ) : (
                        <RouteDisplay route={routeSteps} />
                      )}
                    </div>
                  ) : null}
                </Disclosure.Panel>
              </Transition>
            </>
          )}
        </Disclosure>
      </Transition>
    </>
  )
}
