import React, { FC } from 'react'
import { classNames, Typography } from '@dozer/ui'
import { Currency } from '@dozer/ui'
import { Token } from '@dozer/currency'

interface RouteStep {
  tokenIn: Token
  tokenOut: Token
  pool: string
  fee: number
  amountIn: number
  amountOut: number
  priceImpact: number
}

interface RouteDisplayProps {
  route: RouteStep[]
  totalPriceImpact: number
  estimatedCost?: number
  className?: string
}


interface RouteStepVisualProps {
  step: RouteStep
  isLast: boolean
}

const RouteStepVisual: FC<RouteStepVisualProps> = ({ step, isLast }) => {
  const getFeeColor = (fee: number) => {
    if (fee <= 0.3) return 'text-green-400'
    if (fee <= 0.5) return 'text-yellow-400'
    if (fee <= 1.0) return 'text-orange-400'
    return 'text-red-400'
  }

  return (
    <div className="flex items-center">
      {/* Token Icon */}
      <div className="flex flex-col items-center">
        <Currency.Icon currency={step.tokenIn} width={48} height={48} />
        <Typography variant="xs" className="text-stone-400 mt-2 font-medium">
          {step.tokenIn.symbol}
        </Typography>
      </div>

      {/* Connection Line and Fee */}
      {!isLast && (
        <>
          <div className="flex flex-col items-center mx-6">
            {/* Arrow */}
            <div className="flex items-center mb-1">
              <svg className="w-6 h-6 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
            {/* Fee percentage */}
            <Typography variant="xs" className={classNames('font-bold px-2 py-1 rounded-full bg-stone-700/50', getFeeColor(step.fee))}>
              {step.fee}%
            </Typography>
          </div>
        </>
      )}
    </div>
  )
}

export const RouteDisplay: FC<RouteDisplayProps> = ({
  route,
  totalPriceImpact,
  estimatedCost = 0.01,
  className,
}) => {
  if (!route || route.length === 0) {
    return null
  }

  // Get the final token for the last step
  const finalToken = route[route.length - 1]?.tokenOut
  
  // Create all unique tokens in the route for IconList
  const allTokens: Token[] = []
  route.forEach(step => {
    if (!allTokens.find(t => t.uuid === step.tokenIn.uuid)) {
      allTokens.push(step.tokenIn)
    }
  })
  if (finalToken && !allTokens.find(t => t.uuid === finalToken.uuid)) {
    allTokens.push(finalToken)
  }

  return (
    <div className={classNames('p-6 bg-stone-800/40 rounded-2xl border border-stone-700/50', className)}>
      {/* Compact Route Header with IconList */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Currency.IconList iconWidth={32} iconHeight={32}>
            {allTokens.map(token => (
              <Currency.Icon key={token.uuid} currency={token} width={32} height={32} />
            ))}
          </Currency.IconList>
          <div className="flex items-center space-x-2">
            <Typography variant="sm" className="text-stone-300 font-medium">
              {route.length} hop{route.length !== 1 ? 's' : ''}
            </Typography>
            <div className="w-1 h-1 bg-stone-500 rounded-full" />
            <Typography variant="sm" className="text-stone-400">
              {totalPriceImpact.toFixed(2)}% impact
            </Typography>
          </div>
        </div>
      </div>
      
      {/* Detailed Route Visualization */}
      <div className="flex items-center justify-center mb-6 overflow-x-auto">
        <div className="flex items-center min-w-max">
          {/* Render each step */}
          {route.map((step, index) => (
            <RouteStepVisual key={index} step={step} isLast={index === route.length - 1} />
          ))}

          {/* Final token */}
          {finalToken && (
            <div className="flex flex-col items-center">
              <Currency.Icon currency={finalToken} width={48} height={48} />
              <Typography variant="xs" className="text-stone-400 mt-2 font-medium">
                {finalToken.symbol}
              </Typography>
            </div>
          )}
        </div>
      </div>

      {/* Route Information */}
      <div className="space-y-3">
        <Typography variant="sm" className="text-stone-300 leading-relaxed">
          Most efficient route is estimated to cost ~${estimatedCost.toFixed(2)} in network costs.
        </Typography>
        <Typography variant="xs" className="text-stone-400 leading-relaxed">
          This route considers split routes, multiple hops, and network costs of each step.
        </Typography>

        {/* Route Details */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center">
            <Typography variant="xs" className="text-stone-400">
              Route
            </Typography>
            <Typography variant="xs" className="text-stone-300 font-medium">
              {route.length} hop{route.length > 1 ? 's' : ''}
            </Typography>
          </div>
          <div className="flex justify-between items-center">
            <Typography variant="xs" className="text-stone-400">
              Total Price Impact
            </Typography>
            <Typography
              variant="xs"
              className={classNames(
                'font-bold',
                totalPriceImpact < 1
                  ? 'text-green-400'
                  : totalPriceImpact < 3
                  ? 'text-yellow-400'
                  : 'text-red-400'
              )}
            >
              {totalPriceImpact.toFixed(2)}%
            </Typography>
          </div>

          {/* Show path details for debugging */}
          <div className="mt-3 p-3 bg-stone-900/30 rounded-lg border border-stone-700/30">
            <Typography variant="xs" className="text-stone-500 mb-2 font-medium">
              Debug - Route Details:
            </Typography>
            {route.map((step, index) => (
              <div key={index} className="flex justify-between items-center text-xs py-1">
                <span className="text-stone-400 font-medium">
                  {step.tokenIn.symbol} → {step.tokenOut.symbol}
                </span>
                <span className="text-stone-500 font-mono">
                  {step.amountIn.toFixed(4)} → {step.amountOut.toFixed(4)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Learn more link */}
        <button className="text-purple-400 hover:text-purple-300 text-sm font-medium mt-4 transition-colors">
          Learn more
        </button>
      </div>
    </div>
  )
}