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
  apy: number
  token0: {
    uuid: string
    symbol: string
    name: string
    decimals: number
    chainId: number
    imageUrl?: string | null
  }
  token1: {
    uuid: string
    symbol: string
    name: string
    decimals: number
    chainId: number
    imageUrl?: string | null
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
            <div className="flex justify-center items-center mx-auto mb-4 w-16 h-16 rounded-full bg-stone-700/50">
              <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <Typography variant="base" weight={500} className="mb-2 text-stone-300">
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
            const apy = pool.apy * 100
            const isHighYield = apy >= 5
            const isMediumYield = apy >= 1 && apy < 5
            const isLowYield = apy > 0 && apy < 1
            const isZeroYield = apy === 0

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
                className="relative p-4 rounded-xl border transition-all duration-200 group bg-stone-700/30 hover:bg-stone-700/50 border-stone-600/30 hover:border-stone-500/50 hover:shadow-lg hover:shadow-stone-900/20"
              >
                {/* Pool Header */}
                <div className="flex justify-between items-center mb-3">
                  <div className="flex gap-3 items-center">
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
                        className="transition-colors text-stone-100 group-hover:text-white"
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
                    label={`${apy.toFixed(2)}% APY`}
                    className="font-semibold"
                  />
                </div>

                {/* Pool Stats Row */}
                <div className="flex justify-between items-center">
                  <div className="flex gap-4 items-center text-xs text-stone-400">
                    <span>24h Volume: {formatUSD(pool.volumeUSD)}</span>
                    <span>•</span>
                    <span>Fee: {pool.swapFee.toFixed(2)}%</span>
                  </div>

                  {/* Action Button */}
                  <Button
                    as="a"
                    href={`/pool/${pool.symbolId}/add?singleToken=${currentToken.symbol}`}
                    size="sm"
                    variant="filled"
                    className="px-4 py-2 font-semibold bg-yellow-500 rounded-lg transition-all duration-200 hover:bg-yellow-400 text-stone-900 hover:scale-105 hover:shadow-md"
                  >
                    Deposit
                  </Button>
                </div>

                {/* Subtle hover indicator */}
                <div className="absolute inset-0 bg-gradient-to-r to-transparent rounded-xl opacity-0 transition-opacity duration-200 pointer-events-none from-yellow-500/5 group-hover:opacity-100" />
              </div>
            )
          })}
        </div>
      </Widget.Content>
    </Widget>
  )
}
