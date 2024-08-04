import { formatPercentChange, formatUSD } from '@dozer/format'
// import { Pair } from '@dozer/graph-client'
import { Pair } from '@dozer/api'
import { ArrowIcon, CalendarIcon, Currency, Typography } from '@dozer/ui'
import { FC, useEffect, useMemo, useState } from 'react'

// import { useTokensFromPair } from '../../../lib/hooks'
import { useTokensFromPair } from '@dozer/api'
import { Amount, Token } from '@dozer/currency'
import { usePoolPosition } from '../../PoolPositionProvider'
import { ChartBarSquareIcon } from '@heroicons/react/24/outline'
// import { usePoolPosition } from '../../PoolPositionProvider'

interface PoolPositionProps {
  pair: Pair
}

function daysAgoFormatted(last_tx: number) {
  const now = Date.now()
  const pastDate = new Date(last_tx * 1000).getTime()
  const timeDiff = now - pastDate

  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (days === 0) {
    if (hours > 0) {
      return `${hours},${Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
        .toString()
        .padStart(2, '0')} hours ago`
    } else if (timeDiff >= 60000) {
      // At least 1 minute passed
      return `${Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))} minutes ago`
    } else {
      return 'Just now'
    }
  }

  return `${days},${hours.toString().padStart(2, '0')} days ago`
}

export const PoolPositionDesktop: FC<PoolPositionProps> = ({ pair }) => {
  const { token1, token0 } = useTokensFromPair(pair)

  const {
    max_withdraw_a,
    max_withdraw_b,
    // user_deposited_a,
    // user_deposited_b,
    // depositedUSD0,
    // depositedUSD1,
    value1,
    value0,
    // changeUSD0,
    // changeUSD1,
    last_tx,
    isLoading,
    isError,
  } = usePoolPosition()

  // console.log('max_withdraw_a', max_withdraw_a)

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

  // const positionChange = (100 * (changeUSD0 + changeUSD1)) / (depositedUSD0 + depositedUSD1)

  if (!isLoading && !isError) {
    return (
      <>
        <div className="flex flex-row justify-between px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Currency.Icon currency={token0} width={20} height={20} />
              <Typography variant="sm" weight={600} className="text-stone-300">
                {max_withdraw_a?.toFixed(2) || '0'}
                {' ' + token0.symbol}
              </Typography>
            </div>
            {/* <Typography variant="xs" weight={500} className="text-stone-400">
              {formatUSD(value0)}
            </Typography> */}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Currency.Icon currency={token1} width={20} height={20} />
              <Typography variant="sm" weight={600} className="text-stone-300">
                {max_withdraw_b?.toFixed(2) || '0'}
                {' ' + token1.symbol}
              </Typography>
            </div>
            {/* <Typography variant="xs" weight={500} className="text-stone-400">
              {formatUSD(value1)}
            </Typography> */}
          </div>
        </div>
        <div className="flex items-center justify-between px-5 border-b border-stone-200/5" />
        <div className="flex flex-col gap-3 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 ">
              <ChartBarSquareIcon width={20} height={20} />
              <Typography variant="sm" weight={600} className="text-stone-300">
                Return on Investment
              </Typography>
            </div>
            <div className="flex flex-row">
              {/* <Typography variant="xs" weight={500} className="text-stone-400">
                {formatPercentChange(positionChange)}{' '}
              </Typography>
              <ArrowIcon
                type={positionChange < 0 ? 'down' : 'up'}
                className={positionChange < 0 ? 'text-red-400' : 'text-green-400'}
              /> */}
              <Typography variant="xs" weight={500} className="text-stone-400">
                Coming soon
              </Typography>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 ">
              <CalendarIcon width={20} height={20} />
              <Typography variant="sm" weight={600} className="text-stone-300">
                Position Age
              </Typography>
            </div>
            <div className="flex flex-row">
              <Typography variant="xs" weight={500} className="text-stone-400">
                {daysAgoFormatted(last_tx)}
              </Typography>
            </div>
          </div>
        </div>
      </>
    )
  }

  return <></>
}
