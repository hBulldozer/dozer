// import { Native } from '@dozer/currency'
import { formatNumber, formatPercent, formatUSD } from '@dozer/format'
// import { Pair } from '@dozer/graph-client'
import { Pair } from '../../utils/Pair'
import { Typography } from '@dozer/ui'
// import { usePrices } from '@dozer/wagmi'
import { usePrices } from '@dozer/react-query'
import { FC } from 'react'

interface PoolStats {
  pair: Pair
}

export const PoolStats: FC<PoolStats> = ({ pair }) => {
  const { data: prices } = usePrices(pair.chainId)
  // const nativePrice = prices?.[Native.onChain(pair.chainId).wrapped.address]
  const nativePrice = 10
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="flex flex-col gap-1 p-3 rounded-md shadow-md bg-stone-800 shadow-black/20">
        <Typography variant="xs" weight={500} className="text-stone-400">
          Liquidity
        </Typography>
        <Typography weight={500} className="text-stone-50">
          {/* {formatUSD(pair.liquidityNative * Number(nativePrice?.toFixed(4)))} */}
          {123}
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
          Fees (24h)
        </Typography>
        <Typography weight={500} className="text-stone-50">
          {/* {formatUSD(pair.volume1d * (pair.swapFee / 10000))} */}
          {0.2}
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
          Transactions (24h)
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
