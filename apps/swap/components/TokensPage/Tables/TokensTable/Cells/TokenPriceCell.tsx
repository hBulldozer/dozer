import { formatUSD } from '@dozer/format'
import { Typography } from '@dozer/ui'
import { FC } from 'react'

import { CellProps } from './types'
import { api } from 'utils/api'

export const TokenPriceCell: FC<CellProps> = ({ row }) => {
  const { data: priceHTR } = api.getPrices.htr.useQuery()
  const { data: priceInHTR } = api.getPrices.fromPair.useQuery({ pairMerged: row })
  const priceInUSD = priceHTR && priceInHTR ? formatUSD(priceInHTR * priceHTR) : 'failed'

  return (
    <Typography variant="sm" weight={600} className="text-right text-stone-50">
      {priceInUSD}
    </Typography>
  )
}
