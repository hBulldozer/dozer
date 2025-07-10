import { Disclosure, Transition } from '@headlessui/react'
import { InformationCircleIcon } from '@heroicons/react/24/outline'
import { ChevronDownIcon } from '@heroicons/react/24/solid'
import { classNames, Tooltip, Typography } from '@dozer/ui'
import React, { FC, useMemo, useCallback } from 'react'
import { Token } from '@dozer/currency'

import { Rate } from '../../components'
import { RouteDisplay } from '../RouteDisplay'
import { useTrade, useSettings } from '@dozer/zustand'
import { warningSeverity } from '../utils/functions'
import { api } from 'utils/api'
// import { useSettings } from '../../lib/state/storage'

interface SwapStats {
  prices: { [key: string]: number }
}

export const SwapStatsDisclosure: FC<SwapStats> = ({ prices }) => {
  const trade = useTrade()
  const { data: tokens } = api.getTokens.all.useQuery()
  // const [showRoute, setShowRoute] = useState(false)
  const { mainCurrency, otherCurrency, routeInfo } = useTrade()

  // Extract route tokens for development mode display
  const extractRouteTokens = useCallback(() => {
    if (!routeInfo?.path || !mainCurrency || !otherCurrency) return []

    const tokens: string[] = []

    // Handle string path (comma-separated pool keys)
    let pathArray: string[] = []
    if (typeof routeInfo.path === 'string') {
      pathArray = (routeInfo.path as string).split(',').map((s: string) => s.trim())
    } else if (Array.isArray(routeInfo.path)) {
      pathArray = routeInfo.path
    }

    // Start with the input token (mainCurrency)
    tokens.push(mainCurrency.uuid)

    // Process each pool key to build the route in the correct direction
    for (let i = 0; i < pathArray.length; i++) {
      const poolKey = pathArray[i]
      if (typeof poolKey === 'string' && poolKey.includes('/')) {
        const [tokenA, tokenB] = poolKey.split('/')

        const lastToken: string = tokens[tokens.length - 1]

        // Add the token that's not the last one (the destination token in this hop)
        if (tokenA === lastToken && tokenB && !tokens.includes(tokenB)) {
          tokens.push(tokenB)
        } else if (tokenB === lastToken && tokenA && !tokens.includes(tokenA)) {
          tokens.push(tokenA)
        } else if (!tokens.includes(tokenA) && !tokens.includes(tokenB)) {
          // If neither token is in our path yet, choose based on which connects to our last token
          // This shouldn't happen if the route is properly ordered, but it's a fallback
          tokens.push(tokenA, tokenB)
        }
      }
    }

    // Ensure we end with the output token (otherCurrency)
    if (tokens[tokens.length - 1] !== otherCurrency.uuid) {
      if (!tokens.includes(otherCurrency.uuid)) {
        tokens.push(otherCurrency.uuid)
      } else {
        // Reorder to end with output token
        const filtered = tokens.filter((t) => t !== otherCurrency.uuid)
        filtered.push(otherCurrency.uuid)
        return filtered
      }
    }

    return tokens
  }, [routeInfo, mainCurrency, otherCurrency])

  const slippageTolerance = useSettings((state) => state.slippageTolerance)
  const priceImpactSeverity = useMemo(() => warningSeverity(trade?.priceImpact), [trade?.priceImpact])

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
    if (!routeInfo || !routeInfo.poolPath || !routeInfo.path || !mainCurrency || !otherCurrency) return []

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
            fee = parseInt(parts[2]) / 1000 // Convert from basis points to percentage
          }
        }

        steps.push({
          tokenIn,
          tokenOut,
          pool: connectingPool || `${tokenInUuid}/${tokenOutUuid}/${fee * 1000}`,
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
        {trade.outputAmount ? (trade?.outputAmount * (1 - slippageTolerance / 100)).toFixed(2) : ''}{' '}
        {trade.outputAmount ? trade?.otherCurrency?.symbol : ''}
      </Typography>
    </>
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
              <div className="flex justify-between items-center bg-white bg-opacity-[0.04] hover:bg-opacity-[0.08] rounded-2xl px-4 mb-4 py-2.5 gap-2">
                <Rate token1={mainCurrency} token2={otherCurrency} prices={prices}>
                  {({ content, usdPrice, toggleInvert }) => (
                    <div
                      className="text-sm text-stone-300 hover:text-stone-50 cursor-pointer gap-1 font-semibold tracking-tight h-[36px] flex items-center truncate"
                      onClick={toggleInvert}
                    >
                      <Typography variant="sm" weight={600} className="flex items-center gap-1 text-stone-100">
                        {content}
                      </Typography>
                      {usdPrice && (
                        <Typography variant="sm" weight={500} className="text-stone-300">
                          (${usdPrice})
                        </Typography>
                      )}
                    </div>
                  )}
                </Rate>
                <Disclosure.Button>
                  <div className="flex items-center gap-2 cursor-pointer text-stone-400 hover:text-stone-100">
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
                <Disclosure.Panel className="grid grid-cols-2 gap-x-2 gap-y-1 pt-4 text-xs border-t bg-white bg-opacity-[.02] -m-4 mt-4 p-4 border-stone-200/5">
                  <div className="flex col-span-2 gap-1 items-center">
                    <Typography variant="sm" weight={500} className="text-stone-400">
                      Network Fee
                    </Typography>
                    <Tooltip
                      placement="bottom"
                      panel={
                        <div>This fee is paid to the network to process your transaction and does not go to Dozer.</div>
                      }
                      button={<InformationCircleIcon width={16} className="text-stone-500" />}
                    >
                      <></>
                    </Tooltip>
                  </div>
                  <Typography variant="sm" weight={500} className="text-right truncate col-span-1 text-stone-400">
                    ~0.01 HTR
                  </Typography>
                  {stats}
                  {routeInfo && routeSteps.length > 0 && (
                    <div className="col-span-2 pt-2 mt-2 border-t border-stone-700">
                      <RouteDisplay
                        route={routeSteps}
                        totalPriceImpact={routeInfo.priceImpact}
                        estimatedCost={0.01} // Example cost
                        className="!p-0"
                      />
                    </div>
                  )}
                </Disclosure.Panel>
              </Transition>
            </>
          )}
        </Disclosure>
      </Transition>
    </>
  )
}
