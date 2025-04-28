import { formatUSD } from '@dozer/format'
// EDIT
import { client, Pair } from '@dozer/api'
import { Typography } from '@dozer/ui'
import { FC } from 'react'
import { Token } from '@dozer/database'

interface TokenStats {
  uuid: string
  client: typeof client
}

export const TokenStats: FC<TokenStats> = ({ uuid, client }) => {
  const { data: tokenStats } = client.getTokens.stats.useQuery({ uuid: uuid })

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="flex flex-col gap-1 p-3 rounded-md shadow-md bg-stone-800 shadow-black/20">
        <Typography variant="xs" weight={500} className="text-stone-400">
          TVL
        </Typography>
        <Typography weight={500} className="text-stone-50">
          {tokenStats?.tvl ? formatUSD(tokenStats.tvl) : '-'}
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
          {tokenStats?.volume24h ? formatUSD(tokenStats.volume24h) : '-'}
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
          {tokenStats?.priceMin52w ? formatUSD(tokenStats.priceMin52w) : '-'}
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
          {tokenStats?.priceMax52w ? formatUSD(tokenStats.priceMax52w) : '-'}
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
