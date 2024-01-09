import { formatUSD } from '@dozer/format'
import { Typography } from '@dozer/ui'
import { FC } from 'react'

import { CellProps } from './types'
import { api } from 'utils/api'

export const TokenPriceCell: FC<CellProps> = ({ row }) => {
  const { data: poolNC } = row.ncid ? api.getPools.byIdFromContract.useQuery({ ncid: row.ncid }) : { data: undefined }
  const tokenReserve: { reserve0: number; reserve1: number } = {
    reserve0: poolNC ? Number(poolNC.reserve0) : row.reserve1,
    reserve1: poolNC ? Number(poolNC.reserve1) : row.reserve1,
  }
  const priceInHTR = row.id === 'native' ? 1 : Number(tokenReserve.reserve0) / Number(tokenReserve.reserve1)
  const { data: priceHTR } = api.getPrices.htr.useQuery()
  const priceInUSD = priceHTR ? formatUSD(priceInHTR * priceHTR) : 0

  return (
    <Typography variant="sm" weight={600} className="text-right text-stone-50">
      {priceInUSD}
    </Typography>
  )
}
