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
  className?: string
}



export const RouteDisplay: FC<RouteDisplayProps> = ({
  route,
  className,
}) => {
  if (!route || route.length === 0) {
    return null
  }

  const getFeeColor = (fee: number) => {
    if (fee <= 0.3) return 'text-green-400'
    if (fee <= 0.5) return 'text-yellow-400'
    if (fee <= 1.0) return 'text-orange-400'
    return 'text-red-400'
  }

  const inputToken = route[0]?.tokenIn
  const outputToken = route[route.length - 1]?.tokenOut

  return (
    <div className={classNames('py-2', className)}>
      {/* Route Header */}
      <div className="flex items-center justify-between mb-3">
        <Typography variant="sm" className="text-stone-300 font-medium">
          {route.length} hop{route.length !== 1 ? 's' : ''}
        </Typography>
      </div>

      {/* Simplified Route Visualization */}
      <div className="flex items-center justify-center space-x-3 py-2">
        {/* Input Token */}
        <div className="flex flex-col items-center space-y-1">
          <Currency.Icon currency={inputToken} width={24} height={24} />
          <Typography variant="xs" className="text-stone-400 font-medium">
            {inputToken?.symbol}
          </Typography>
        </div>

        {/* Route Flow */}
        {route.map((step, index) => (
          <div key={index} className="flex items-center space-x-2">
            {/* Arrow to Pool */}
            <svg className="w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            
            {/* Pool Token Pair and Fee */}
            <div className="flex flex-col items-center space-y-1">
              {/* Pool Token Pair */}
              <Currency.IconList iconWidth={24} iconHeight={24}>
                <Currency.Icon currency={step.tokenIn} width={24} height={24} />
                <Currency.Icon currency={step.tokenOut} width={24} height={24} />
              </Currency.IconList>
              {/* Pool Fee */}
              <Typography 
                variant="xs" 
                className={classNames('font-bold text-xs text-center', getFeeColor(step.fee))}
              >
                {step.fee}%
              </Typography>
            </div>
          </div>
        ))}

        {/* Final Arrow to Output Token */}
        <svg className="w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>

        {/* Output Token */}
        <div className="flex flex-col items-center space-y-1">
          <Currency.Icon currency={outputToken} width={24} height={24} />
          <Typography variant="xs" className="text-stone-400 font-medium">
            {outputToken?.symbol}
          </Typography>
        </div>
      </div>
    </div>
  )
}