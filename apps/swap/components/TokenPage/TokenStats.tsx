import { formatHTR, formatUSD } from '@dozer/format'
import { Pair } from '@dozer/api'
import { Typography } from '@dozer/ui'
import { FC } from 'react'
import { api } from 'utils/api'

interface TokenStats {
  pair: Pair
  prices: { [key: string]: number }
}

export const TokenStats: FC<TokenStats> = ({ pair, prices }) => {
  const { token0, token1 } = pair
  const token = pair.id.includes('native') ? token0 : token1
  const isUSDPool = pair.id.includes('husdc')

  // Fetch 24h metrics for min/max prices
  const { data: metrics24h } = api.getHistory.get24hMetrics.useQuery({
    poolId: pair.id,
    tokenId: token.uuid,
  })

  // Format min/max values based on pool type
  const formatPrice = (value: number | undefined) => {
    if (value === undefined || value === 0) return '-'
    return isUSDPool ? formatUSD(value) : formatHTR(value)
  }

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
          {formatUSD(pair.volumeUSD)}
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
          Min (24h)
        </Typography>
        <Typography weight={500} className="text-stone-50">
          {formatPrice(metrics24h?.minPrice)}
        </Typography>
      </div>
      <div className="flex flex-col gap-1 p-3 rounded-md shadow-md bg-stone-800 shadow-black/20">
        <Typography variant="xs" weight={500} className="text-stone-400">
          Max (24h)
        </Typography>
        <Typography weight={500} className="text-stone-50">
          {formatPrice(metrics24h?.maxPrice)}
        </Typography>
      </div>
    </div>
  )
}
