import { formatUSD } from '@dozer/format'
import { Typography } from '@dozer/ui'
import { FC } from 'react'

interface TokenStats {
  totalLiquidityUSD: number
  totalVolumeUSD: number
  totalFeesUSD: number
  marketCap: number
}

export const TokenStats: FC<TokenStats> = ({ totalLiquidityUSD, totalVolumeUSD, totalFeesUSD, marketCap }) => {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="flex flex-col gap-1 p-3 rounded-md shadow-md bg-stone-800 shadow-black/20">
        <Typography variant="xs" weight={500} className="text-stone-400">
          TVL
        </Typography>
        <Typography weight={500} className="text-stone-50">
          {formatUSD(totalLiquidityUSD)}
        </Typography>
      </div>
      <div className="flex flex-col gap-1 p-3 rounded-md shadow-md bg-stone-800 shadow-black/20">
        <Typography variant="xs" weight={500} className="text-stone-400">
          Volume (24h)
        </Typography>
        <Typography weight={500} className="text-stone-50">
          {formatUSD(totalVolumeUSD)}
        </Typography>
      </div>
      <div className="flex flex-col gap-1 p-3 rounded-md shadow-md bg-stone-800 shadow-black/20">
        <Typography variant="xs" weight={500} className="text-stone-400">
          Fees (24h)
        </Typography>
        <Typography weight={500} className="text-stone-50">
          {formatUSD(totalFeesUSD)}
        </Typography>
      </div>
      <div className="flex flex-col gap-1 p-3 rounded-md shadow-md bg-stone-800 shadow-black/20">
        <Typography variant="xs" weight={500} className="text-stone-400">
          Market Cap
        </Typography>
        <Typography weight={500} className="text-stone-50">
          {formatUSD(marketCap)}
        </Typography>
      </div>
    </div>
  )
}
