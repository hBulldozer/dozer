import { formatUSD } from '@dozer/format'
// import { Pair } from '@dozer/graph-client'
import { Pair } from '@dozer/api'
import { Currency, Typography } from '@dozer/ui'
import { FC, useEffect, useMemo, useState } from 'react'

// import { useTokensFromPair } from '../../../lib/hooks'
import { useTokensFromPair } from '@dozer/api'
import { isError } from '@tanstack/react-query'
import { Amount, Token } from '@dozer/currency'
import { usePoolPosition } from '../../PoolPositionProvider'
// import { usePoolPosition } from '../../PoolPositionProvider'

interface PoolPositionProps {
  pair: Pair
}

export const PoolPositionDesktop: FC<PoolPositionProps> = ({ pair }) => {
  const { token1, token0 } = useTokensFromPair(pair)

  const { underlying1, underlying0, BalanceLPAmount, value1, value0, isLoading, isError } = usePoolPosition()

  if (isLoading && !isError) {
    return (
      <div className="flex flex-col gap-3 px-5 py-4">
        <div className="flex justify-between mb-1 py-0.5">
          <div className="h-[16px] bg-stone-600 animate-pulse w-[100px] rounded-full" />
          <div className="h-[16px] bg-stone-600 animate-pulse w-[60px] rounded-full" />
        </div>
        <div className="flex justify-between py-0.5">
          <div className="h-[16px] bg-stone-700 animate-pulse w-[160px] rounded-full" />
          <div className="h-[16px] bg-stone-700 animate-pulse w-[60px] rounded-full" />
        </div>
        <div className="flex justify-between py-0.5">
          <div className="h-[16px] bg-stone-700 animate-pulse w-[160px] rounded-full" />
          <div className="h-[16px] bg-stone-700 animate-pulse w-[60px] rounded-full" />
        </div>
      </div>
    )
  }

  if (!isLoading && !isError) {
    return (
      <div className="flex flex-col gap-3 px-5 py-4">
        {/* {pair.farm && (
          <div className="flex items-center justify-between mb-1">
            <Typography variant="sm" weight={600} className="text-stone-100">
              Unstaked Position
            </Typography>
            <Typography variant="xs" weight={500} className="text-stone-100">
              {formatUSD(value0 + value1)}
            </Typography>
          </div>
        )} */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Currency.Icon currency={token0} width={20} height={20} />
            <Typography variant="sm" weight={600} className="text-stone-300">
              {underlying0?.toFixed(2) || '0'}
              {' ' + token0.symbol}
            </Typography>
          </div>
          <Typography variant="xs" weight={500} className="text-stone-400">
            {formatUSD(value0)}
          </Typography>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Currency.Icon currency={token1} width={20} height={20} />
            <Typography variant="sm" weight={600} className="text-stone-300">
              {underlying1?.toFixed(2) || '0'}
              {' ' + token1.symbol}
            </Typography>
          </div>
          <Typography variant="xs" weight={500} className="text-stone-400">
            {formatUSD(value1)}
          </Typography>
        </div>
      </div>
    )
  }

  return <></>
}
