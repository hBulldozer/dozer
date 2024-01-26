import { ArrowIcon, Skeleton, Typography } from '@dozer/ui'
import { FC } from 'react'

import { ICON_SIZE } from '../../contants'
import { CellProps } from './types'
import { formatPercent, formatPercentChange, formatUSD } from '@dozer/format'
import { api } from 'utils/api'

export const TokenChangeCell: FC<CellProps> = ({ row }) => {
  const { data: prices24h, isLoading } = api.getPrices.all24h.useQuery()
  const { data: lastPrices, isLoading: isLoadingLast } = api.getPrices.all.useQuery()
  const tokenUuid = row.id.includes('native') ? row.token0.uuid : row.token1.uuid
  const prices24h_token = prices24h?.[tokenUuid]
  const lastPrice = lastPrices?.[tokenUuid]
  const previousPrice = prices24h_token?.[0]
  const change = lastPrice && previousPrice ? (lastPrice - previousPrice) / lastPrice : 0
  return !(isLoading || isLoadingLast) ? (
    <div className="flex items-center gap-1">
      <ArrowIcon type={change < 0 ? 'down' : 'up'} className={change < 0 ? 'text-red-400' : 'text-green-400'} />
      <Typography key="changeCell" variant="sm" weight={600} className={change < 0 ? 'text-red-400' : 'text-green-400'}>
        {formatPercentChange(change)}
      </Typography>
    </div>
  ) : (
    <div className="flex flex-col gap-1 justify-center flex-grow h-[44px]">
      <Skeleton.Box className="w-[120px] h-[22px] bg-white/[0.06] rounded-full" />
    </div>
  )
}
