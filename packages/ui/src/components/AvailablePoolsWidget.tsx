import React from 'react'
import { Typography, Button, Currency, Widget, Chip } from '@dozer/ui'
import { formatUSD } from '@dozer/format'
import { toToken } from '@dozer/api'

interface Pool {
  id: string
  symbolId: string
  name: string
  liquidityUSD: number
  volumeUSD: number
  feeUSD: number
  swapFee: number
  apr: number
  token0: {
    uuid: string
    symbol: string
    name: string
    decimals: number
    chainId: number
  }
  token1: {
    uuid: string
    symbol: string
    name: string
    decimals: number
    chainId: number
  }
  reserve0: number
  reserve1: number
  chainId: number
}

interface AvailablePoolsWidgetProps {
  pools: Pool[]
  currentToken: {
    uuid: string
    symbol: string
    name: string
  }
}

export const AvailablePoolsWidget: React.FC<AvailablePoolsWidgetProps> = ({ pools, currentToken }) => {
  if (pools.length === 0) {
    return (
      <Widget id="earn-widget" maxWidth={400}>
        <Widget.Header title="Earn" />
        <Widget.Content>
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-700/50 flex items-center justify-center">
              <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <Typography variant="base" weight={500} className="text-stone-300 mb-2">
              No liquidity pools available
            </Typography>
            <Typography variant="sm" className="text-stone-500">
              This token doesn't have any active pools for earning rewards yet.
            </Typography>
          </div>
        </Widget.Content>
      </Widget>
    )
  }

  return (
    <Widget id="earn-widget" maxWidth={400}>
      <Widget.Header title="Earn" />
      <Widget.Content>
        <div className="p-3 pt-0 space-y-2">
          {pools.map((pool) => {
            // Get the paired token (not the current token)
            const pairedToken = pool.token0.uuid === currentToken.uuid ? pool.token1 : pool.token0
            const apr = pool.apr * 100
            const isHighYield = apr >= 5
            const isMediumYield = apr >= 1 && apr < 5
            const isLowYield = apr > 0 && apr < 1
            const isZeroYield = apr === 0

            // Determine APY color and treatment
            const getApyColor = () => {
              if (isZeroYield) return 'text-stone-500'
              if (isLowYield) return 'text-yellow-400'
              if (isMediumYield) return 'text-green-400'
              if (isHighYield) return 'text-emerald-400'
              return 'text-stone-500'
            }

            const getApyChipColor = () => {
              if (isZeroYield) return 'gray'
              if (isLowYield) return 'yellow'
              if (isMediumYield) return 'green'
              if (isHighYield) return 'green'
              return 'gray'
            }

            return (
              <div
                key={pool.id}
                className="group relative p-4 rounded-xl bg-stone-700/30 hover:bg-stone-700/50 border border-stone-600/30 hover:border-stone-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-stone-900/20"
              >
                {/* Pool Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Currency.IconList iconWidth={32} iconHeight={32}>
                        <Currency.Icon currency={toToken(currentToken)} />
                        <Currency.Icon currency={toToken(pairedToken)} />
                      </Currency.IconList>
                    </div>
                    <div>
                      <Typography
                        variant="base"
                        weight={600}
                        className="text-stone-100 group-hover:text-white transition-colors"
                      >
                        {currentToken.symbol} / {pairedToken.symbol}
                      </Typography>
                      <Typography variant="xs" className="text-stone-400">
                        {formatUSD(pool.liquidityUSD)} TVL
                      </Typography>
                    </div>
                  </div>

                  {/* APY Badge */}
                  <Chip
                    color={getApyChipColor()}
                    size="sm"
                    label={`${apr.toFixed(2)}% APY`}
                    className="font-semibold"
                  />
                </div>

                {/* Pool Stats Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-stone-400">
                    <span>24h Volume: {formatUSD(pool.volumeUSD)}</span>
                    <span>•</span>
                    <span>Fee: {pool.swapFee.toFixed(2)}%</span>
                  </div>

                  {/* Action Button */}
                  <Button
                    as="a"
                    href={`/pool/${pool.symbolId}`}
                    size="sm"
                    variant="filled"
                    className="bg-yellow-500 hover:bg-yellow-400 text-stone-900 font-semibold px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-md"
                  >
                    Deposit
                  </Button>
                </div>

                {/* Subtle hover indicator */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
              </div>
            )
          })}
        </div>
      </Widget.Content>
    </Widget>
  )
}
