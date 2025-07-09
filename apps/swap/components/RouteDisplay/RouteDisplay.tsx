import React, { FC } from 'react'
import { classNames, Typography } from '@dozer/ui'
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

interface TokenIconProps {
  token: Token
  className?: string
}

const TokenIcon: FC<TokenIconProps> = ({ token, className }) => {
  // Create a simple circular icon with token symbol
  const getIconColor = (symbol: string) => {
    switch (symbol) {
      case 'HTR':
        return 'bg-gradient-to-br from-purple-500 to-purple-600'
      case 'DZR':
        return 'bg-gradient-to-br from-blue-500 to-blue-600'
      case 'hUSDC':
        return 'bg-gradient-to-br from-green-500 to-green-600'
      case 'hBTC':
        return 'bg-gradient-to-br from-orange-500 to-orange-600'
      default:
        return 'bg-gradient-to-br from-gray-500 to-gray-600'
    }
  }

  return (
    <div
      className={classNames(
        'relative flex items-center justify-center rounded-full text-white font-bold text-xs shadow-lg',
        getIconColor(token.symbol),
        className || 'w-12 h-12'
      )}
    >
      {token.symbol === 'hUSDC' ? 'UC' : token.symbol === 'hBTC' ? 'BC' : token.symbol.slice(0, 2).toUpperCase()}
      {/* Small network indicator - purple Hathor logo */}
      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center border-2 border-stone-800">
        <span className="text-[10px] font-bold">H</span>
      </div>
    </div>
  )
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
        <TokenIcon token={step.tokenIn} />
        <Typography variant="xs" className="text-stone-400 mt-2 font-medium">
          {step.tokenIn.symbol}
        </Typography>
      </div>

      {/* Connection Line and Fee */}
      {!isLast && (
        <>
          <div className="flex flex-col items-center mx-6">
            {/* Dotted line */}
            <div className="flex items-center space-x-1.5 mb-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 bg-stone-500 rounded-full opacity-60" />
              ))}
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

  return (
    <div className={classNames('p-6 bg-stone-800/40 rounded-2xl border border-stone-700/50', className)}>
      {/* Route Visualization */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center">
          {/* Render each step */}
          {route.map((step, index) => (
            <RouteStepVisual key={index} step={step} isLast={index === route.length - 1} />
          ))}

          {/* Final token */}
          {finalToken && (
            <div className="flex flex-col items-center">
              <TokenIcon token={finalToken} />
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