import { Disclosure, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/24/solid'
import { classNames, Typography } from '@dozer/ui'
import React, { FC, useMemo } from 'react'
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

  const slippageTolerance = useSettings((state) => state.slippageTolerance)
  const priceImpactSeverity = useMemo(() => warningSeverity(trade?.priceImpact), [trade?.priceImpact])

  // Convert route info to RouteDisplay format
  const routeSteps = useMemo(() => {
    if (!routeInfo || !routeInfo.poolPath || !routeInfo.path || !mainCurrency || !otherCurrency) return []

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
    <>
      <Typography variant="sm" className="flex items-center text-stone-400">
        Price Impact
      </Typography>
      <Typography
        variant="sm"
        weight={500}
        className={classNames(
          priceImpactSeverity === 2 ? 'text-yellow' : priceImpactSeverity > 2 ? 'text-red' : 'text-stone-200',
          'text-right truncate flex items-center justify-end'
        )}
      >
        -{trade?.priceImpact?.toFixed(2)}%
      </Typography>
      <div className="col-span-2 border-t border-stone-200/5 w-full py-0.5" />
      <Typography variant="sm" className="flex items-center text-stone-400">
        Min. Received
      </Typography>
      <Typography
        variant="sm"
        weight={500}
        className="flex justify-end items-center text-right truncate text-stone-400"
      >
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
                      <Typography variant="sm" weight={600} className="flex gap-1 items-center text-stone-100">
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
                <Disclosure.Panel className="grid grid-cols-2 gap-x-2 gap-y-2 pt-4 text-xs border bg-white bg-opacity-[.02] p-2 mb-2 border-stone-200/5">
                  {stats}
                  {routeInfo && routeSteps.length > 0 && (
                    <div className="col-span-2 pt-4 mt-2 border-t border-stone-200/5">
                      <RouteDisplay route={routeSteps} />
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
