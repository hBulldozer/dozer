import { ArrowIcon, Skeleton, Typography } from '@dozer/ui'
import { FC } from 'react'

import { ICON_SIZE } from '../../contants'
import { CellProps } from './types'
import { formatPercent, formatPercentChange, formatUSD } from '@dozer/format'
import { api } from 'utils/api'

export const TokenChangeCell: FC<CellProps> = ({ row }) => {
  const { data: poolDB, isLoading: isLoadingPoolDB } = api.getPools.byId.useQuery({ id: row.id })
  const tokenReservePrevious: { reserve0: number; reserve1: number } = {
    reserve0: poolDB ? Number(poolDB.reserve0) : row.reserve1,
    reserve1: poolDB ? Number(poolDB.reserve1) : row.reserve1,
  }
  const { data: _priceInHTR, isLoading: isLoadingPrice } = api.getPrices.fromPair.useQuery({ pairMerged: row })
  const priceInHTR_previous =
    row.id === 'native' ? 1 : Number(tokenReservePrevious.reserve0) / Number(tokenReservePrevious.reserve1)
  const priceInHTR = _priceInHTR ? _priceInHTR : priceInHTR_previous
  const change = (priceInHTR - priceInHTR_previous) / priceInHTR_previous
  const isLoading = isLoadingPoolDB || isLoadingPrice
  return !isLoading ? (
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
