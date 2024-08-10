import { formatUSD } from '@dozer/format'
import { Skeleton, Typography } from '@dozer/ui'
import { FC } from 'react'

import { CellProps } from './types'
import { api } from 'utils/api'

export const TokenPriceCell: FC<CellProps> = ({ row }) => {
  const { data: prices, isLoading } = api.getPrices.all.useQuery()
  const price = prices ? (row.id.includes('native') ? prices[row.token0.uuid] : prices[row.token1.uuid]) : 0

  return isLoading ? (
    <div className="flex flex-col gap-1 justify-center flex-grow h-[44px]">
      <Skeleton.Box className="w-[120px] h-[22px] bg-white/[0.06] rounded-full" />
    </div>
  ) : (
    <Typography variant="sm" weight={600} className="text-right text-stone-50">
      {row.id.includes('usdt')
        ? formatUSD(1)
        : Math.min(price) > 1
        ? formatUSD(Math.min(price))
        : formatUSD(Math.min(price))}
    </Typography>
  )
}
