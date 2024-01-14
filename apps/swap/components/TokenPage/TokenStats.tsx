import { formatUSD } from '@dozer/format'
import { Pair } from '@dozer/api'
import { Typography } from '@dozer/ui'
import { FC } from 'react'

interface TokenStats {
  pair: Pair
  prices: { [key: string]: number }
}

export const TokenStats: FC<TokenStats> = ({ pair, prices }) => {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="flex flex-col gap-1 p-3 rounded-md shadow-md bg-stone-800 shadow-black/20">
        <Typography variant="xs" weight={500} className="text-stone-400">
          TVL
        </Typography>
        <Typography weight={500} className="text-stone-50">
          {formatUSD(pair.liquidityUSD * Number(prices['00']))}
          {/* {123} */}
        </Typography>
        {/* {pair.liquidity1dChange ? (
          <Typography variant="xs" weight={500} className={pair.liquidity1dChange > 0 ? 'text-green' : 'text-red'}>
            {pair.liquidity1dChange > 0 ? '+' : '-'}
            {formatPercent(Math.abs(pair.liquidity1dChange))}
          </Typography>
        ) : null} */}
      </div>
      <div className="flex flex-col gap-1 p-3 rounded-md shadow-md bg-stone-800 shadow-black/20">
        <Typography variant="xs" weight={500} className="text-stone-400">
          Volume (24h)
        </Typography>
        <Typography weight={500} className="text-stone-50">
          {formatUSD(pair.volume1d)}
        </Typography>
        {/* {pair.volume1dChange ? (
          <Typography variant="xs" weight={500} className={pair.volume1dChange > 0 ? 'text-green' : 'text-red'}>
            {pair.volume1dChange > 0 ? '+' : '-'}
            {formatPercent(Math.abs(pair.volume1dChange))}
          </Typography>
        ) : null} */}
      </div>
      <div className="flex flex-col gap-1 p-3 rounded-md shadow-md bg-stone-800 shadow-black/20">
        <Typography variant="xs" weight={500} className="text-stone-400">
          Min (52W)
        </Typography>
        <Typography weight={500} className="text-stone-50">
          {formatUSD(pair.volume1d * (pair.swapFee / 10000))}
          {/* {0.2} */}
        </Typography>
        {/* {pair.volume1dChange ? (
          <Typography variant="xs" weight={500} className={pair.volume1dChange > 0 ? 'text-green' : 'text-red'}>
            {pair.volume1dChange > 0 ? '+' : '-'}
            {formatPercent(Math.abs(pair.volume1dChange))}
          </Typography>
        ) : null} */}
      </div>
      <div className="flex flex-col gap-1 p-3 rounded-md shadow-md bg-stone-800 shadow-black/20">
        <Typography variant="xs" weight={500} className="text-stone-400">
          Max (52W)
        </Typography>
        <Typography weight={500} className="text-stone-50">
          {/* Don't need decimals for a count */}
          {/* {formatNumber(pair.txCount1d).replace('.00', '')} */}
          {10}
        </Typography>
        {/* {pair.txCount1dChange ? (
          <Typography variant="xs" weight={500} className={pair.txCount1dChange > 0 ? 'text-green' : 'text-red'}>
            {pair.txCount1dChange > 0 ? '+' : '-'}
            {formatPercent(Math.abs(pair.txCount1dChange))}
          </Typography>
        ) : null} */}
      </div>
    </div>
  )
}
