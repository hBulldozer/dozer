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
  totalPriceImpact?: number
  estimatedCost?: number
  className?: string
}



export const RouteDisplay: FC<RouteDisplayProps> = ({
  route,
  totalPriceImpact,
  estimatedCost,
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
    <div className={classNames('py-2 min-h-[88px]', className)}>
      {/* Simplified Route Visualization */}
      <div className="flex items-center justify-center space-x-4 py-3 mb-2">
        {/* Input Token */}
        <div className="flex flex-col items-center space-y-2">
          <Currency.Icon currency={inputToken} width={28} height={28} />
          <Typography variant="xs" weight={500} className="text-stone-300">
            {inputToken?.symbol}
          </Typography>
        </div>

        {/* Route Flow */}
        {route.map((step, index) => (
          <div key={index} className="flex items-center space-x-3">
            {/* Arrow to Pool */}
            <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            
            {/* Pool Token Pair and Fee */}
            <div className="flex flex-col items-center space-y-2">
              {/* Pool Token Pair */}
              <Currency.IconList iconWidth={28} iconHeight={28}>
                <Currency.Icon currency={step.tokenIn} width={28} height={28} />
                <Currency.Icon currency={step.tokenOut} width={28} height={28} />
              </Currency.IconList>
              {/* Pool Fee */}
              <Typography 
                variant="xs" 
                weight={600}
                className={classNames('text-center', getFeeColor(step.fee))}
              >
                {step.fee}%
              </Typography>
            </div>
          </div>
        ))}

        {/* Final Arrow to Output Token */}
        <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>

        {/* Output Token */}
        <div className="flex flex-col items-center space-y-2">
          <Currency.Icon currency={outputToken} width={28} height={28} />
          <Typography variant="xs" weight={500} className="text-stone-300">
            {outputToken?.symbol}
          </Typography>
        </div>
      </div>

      {/* Route Label Below */}
      <div className="flex items-center justify-center">
        <Typography variant="sm" weight={500} className="text-stone-400">
          {route.length === 1 ? 'Direct route' : route.length === 2 ? 'Double swap' : route.length === 3 ? 'Triple swap' : `${route.length} hops`}
        </Typography>
      </div>
    </div>
  )
}