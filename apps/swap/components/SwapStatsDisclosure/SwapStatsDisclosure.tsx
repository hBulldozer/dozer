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

    const tokens = []
    
    // Handle string path (comma-separated pool keys)
    let pathArray = []
    if (typeof routeInfo.path === 'string') {
      pathArray = routeInfo.path.split(',').map(s => s.trim())
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
        
        const lastToken = tokens[tokens.length - 1]
        
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
        const filtered = tokens.filter(t => t !== otherCurrency.uuid)
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
    if (!routeInfo || !routeInfo.path || !mainCurrency || !otherCurrency) return []
    
    // Handle string path (comma-separated pool keys)
    let pathArray = []
    if (typeof routeInfo.path === 'string') {
      pathArray = routeInfo.path.split(',').map(s => s.trim())
    } else if (Array.isArray(routeInfo.path)) {
      pathArray = routeInfo.path
    }
    
    if (pathArray.length < 1) return []

    const steps = []
    
    // Use the same logic as extractRouteTokens to get the correct token sequence
    const tokens = []
    
    // Start with the input token (mainCurrency)
    tokens.push(mainCurrency.uuid)
    
    // Process each pool key to build the route in the correct direction
    for (let i = 0; i < pathArray.length; i++) {
      const poolKey = pathArray[i]
      if (typeof poolKey === 'string' && poolKey.includes('/')) {
        const [tokenA, tokenB] = poolKey.split('/')
        
        const lastToken = tokens[tokens.length - 1]
        
        // Add the token that's not the last one (the destination token in this hop)
        if (tokenA === lastToken && tokenB && !tokens.includes(tokenB)) {
          tokens.push(tokenB)
        } else if (tokenB === lastToken && tokenA && !tokens.includes(tokenA)) {
          tokens.push(tokenA)
        } else if (!tokens.includes(tokenA) && !tokens.includes(tokenB)) {
          // Fallback case
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
        const filtered = tokens.filter(t => t !== otherCurrency.uuid)
        filtered.push(otherCurrency.uuid)
        tokens.length = 0
        tokens.push(...filtered, otherCurrency.uuid)
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
        const connectingPool = pathArray.find(poolKey => 
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
        show={Boolean(trade.amountSpecified || routeInfo || (process.env.NODE_ENV === 'development' && mainCurrency && otherCurrency))}
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
                      <Tooltip
                        panel={<div className="grid grid-cols-2 gap-1">{stats}</div>}
                        button={<InformationCircleIcon width={16} height={16} />}
                      >
                        <></>
                      </Tooltip>{' '}
                      {content}{' '}
                      {usdPrice && trade.amountSpecified ? (
                        <span className="font-medium text-stone-500">(${Number(usdPrice).toFixed(2)})</span>
                      ) : null}
                    </div>
                  )}
                </Rate>
                <Disclosure.Button className="flex items-center justify-end flex-grow cursor-pointer">
                  <ChevronDownIcon
                    width={24}
                    height={24}
                    className={classNames(
                      open ? '!rotate-180' : '',
                      'rotate-0 transition-[transform] duration-300 ease-in-out delay-200'
                    )}
                  />
                </Disclosure.Button>
              </div>
              <Transition
                show={open}
                unmount={false}
                className="transition-[max-height] overflow-hidden"
                enter="duration-300 ease-in-out"
                enterFrom="transform max-h-0"
                enterTo="transform max-h-[500px]"
                leave="transition-[max-height] duration-250 ease-in-out"
                leaveFrom="transform max-h-[500px]"
                leaveTo="transform max-h-0"
              >
                <div className="space-y-4 mb-4">
                  <Disclosure.Panel
                    as="div"
                    className="grid grid-cols-2 gap-1 px-4 py-2 border border-stone-200/5 rounded-2xl"
                  >
                    {stats}
                  </Disclosure.Panel>

                  {/* Route Display */}
                  {routeSteps.length > 0 ? (
                    <RouteDisplay
                      route={routeSteps}
                      totalPriceImpact={routeInfo?.priceImpact || 0}
                      estimatedCost={0.01}
                    />
                  ) : process.env.NODE_ENV === 'development' && routeInfo && routeInfo.path ? (
                    <div className="p-6 bg-stone-800/40 rounded-2xl border border-stone-700/50">
                      <div className="text-center">
                        <p className="text-stone-400 text-sm mb-4">🛣️ Development Route Preview</p>
                        
                        {/* Simple Token Route Display - Extract ACTUAL route from API */}
                        <div className="flex items-center justify-center mb-4 flex-wrap">
                          {(() => {
                            const tokens = extractRouteTokens()
                            
                            if (tokens.length === 0) {
                              return <p className="text-stone-500 text-sm">No route tokens found</p>
                            }
                            
                            return (
                              <div className="flex items-center justify-center flex-wrap gap-2">
                                {tokens.map((tokenUuid, index) => {
                                  const token = getTokenByUuid(tokenUuid)
                                  const symbol = token?.symbol || (tokenUuid === '00' ? 'HTR' : tokenUuid.substring(0, 6).toUpperCase())
                                  
                                  return (
                                    <div key={tokenUuid} className="flex items-center">
                                      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-full px-2 py-1 text-white text-xs font-medium min-w-[40px] text-center">
                                        {symbol}
                                      </div>
                                      {index < tokens.length - 1 && (
                                        <div className="mx-2 text-stone-400 text-sm">→</div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )
                          })()}
                        </div>
                        
                        <div className="space-y-2 text-xs text-stone-400">
                          <p>Price Impact: {routeInfo.priceImpact?.toFixed(2)}%</p>
                          <p>Route: {typeof routeInfo.path === 'string' ? routeInfo.path.split(',').length : routeInfo.path?.length || 0} pools</p>
                          <p className="text-stone-500 font-mono text-[10px]">
                            Raw: {typeof routeInfo.path === 'string' ? routeInfo.path.substring(0, 80) : JSON.stringify(routeInfo.path).substring(0, 80)}...
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : process.env.NODE_ENV === 'development' && mainCurrency && otherCurrency ? (
                    <div className="p-6 bg-stone-800/40 rounded-2xl border border-stone-700/50">
                      <div className="text-center">
                        <p className="text-stone-400 text-sm mb-4">🔍 Development Mode</p>
                        <div className="flex items-center justify-center mb-2">
                          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-full px-3 py-1 text-white text-sm font-medium">
                            {mainCurrency.symbol}
                          </div>
                          <div className="mx-3 text-stone-400">→</div>
                          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-full px-3 py-1 text-white text-sm font-medium">
                            {otherCurrency.symbol}
                          </div>
                        </div>
                        <p className="text-stone-500 text-xs">Enter amounts to see actual route</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </Transition>
            </>
          )}
        </Disclosure>
      </Transition>
      
    </>
  )
}
