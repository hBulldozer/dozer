import { formatUSD } from '@dozer/format'
import { Pair } from '@dozer/api'
import { Typography } from '@dozer/ui'
import { FC } from 'react'

interface TokenStats {
  pair: Pair
  prices: { [key: string]: number }
}

export const TokenStats: FC<TokenStats> = ({ pair, prices }) => {
  const priceArray = pair.hourSnapshots.map((snap) =>
    pair.id.includes('native') ? snap.reserve1 / snap.reserve0 : (snap.priceHTR * snap.reserve1) / snap.reserve0
  )
  priceArray.push(pair.id.includes('native') ? prices['00'] : prices[pair.token1.uuid])

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="flex flex-col gap-1 p-3 rounded-md shadow-md bg-stone-800 shadow-black/20">
        <Typography variant="xs" weight={500} className="text-stone-400">
          TVL
        </Typography>
        <Typography weight={500} className="text-stone-50">
          {formatUSD(pair.liquidityUSD)}
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
          {formatUSD(pair.volume1d * prices['00'])}
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
          {pair.id.includes('usdt') ? formatUSD(1) : formatUSD(Math.min(...priceArray))}
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
          {pair.id.includes('usdt')
            ? formatUSD(1)
            : Math.max(...priceArray) > 1
            ? formatUSD(Math.max(...priceArray))
            : formatUSD(Math.max(...priceArray))}
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
