import { formatUSD } from '@dozer/format'
import { Typography } from '@dozer/ui'
import { FC } from 'react'

import { CellProps } from './types'
import { api } from 'utils/api'

export const TokenPriceCell: FC<CellProps> = ({ row }) => {
  const priceInHTR = row.id === 'native' ? 1 : Number(row.reserve0) / Number(row.reserve1)
  const { data: priceHTR } = api.getPrices.htr.useQuery()
  const priceInUSD = priceHTR ? formatUSD(priceInHTR * priceHTR) : 0

  return (
    <Typography variant="sm" weight={600} className="text-right text-stone-50">
      {priceInUSD}
    </Typography>
  )
}
