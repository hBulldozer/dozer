import { ArrowIcon, Typography } from '@dozer/ui'
import { FC } from 'react'

import { ICON_SIZE } from '../../contants'
import { CellProps } from './types'
import { formatPercent, formatPercentChange, formatUSD } from '@dozer/format'
import { api } from 'utils/api'

export const TokenChangeCell: FC<CellProps> = ({ row }) => {
  const { data: poolDB } = api.getPools.byId.useQuery({ id: row.id })
  const tokenReservePrevious: { reserve0: number; reserve1: number } = {
    reserve0: poolDB ? Number(poolDB.reserve0) : row.reserve1,
    reserve1: poolDB ? Number(poolDB.reserve1) : row.reserve1,
  }
  const { data: _priceInHTR } = api.getPrices.fromPair.useQuery({ pairMerged: row })
  const priceInHTR_previous =
    row.id === 'native' ? 1 : Number(tokenReservePrevious.reserve0) / Number(tokenReservePrevious.reserve1)
  const priceInHTR = _priceInHTR ? _priceInHTR : priceInHTR_previous
  const change = (priceInHTR - priceInHTR_previous) / priceInHTR_previous
  return (
    <div className="flex items-center gap-1">
      <ArrowIcon type={change < 0 ? 'down' : 'up'} className={change < 0 ? 'text-red-400' : 'text-green-400'} />
      <Typography variant="sm" weight={600} className={change < 0 ? 'text-red-400' : 'text-green-400'}>
        {formatPercentChange(change)}
      </Typography>
    </div>
  )
}
