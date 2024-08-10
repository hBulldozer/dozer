import { formatUSD } from '@dozer/format'
import { Typography } from '@dozer/ui'
import { FC } from 'react'

import { CellProps } from './types'

export const PairFees24hCell: FC<CellProps> = ({ row }) => {
  const fees = formatUSD(row.feeUSD)

  return (
    <Typography variant="sm" weight={600} className="text-right text-stone-50">
      {fees}
    </Typography>
  )
}
