import { formatUSD } from '@dozer/format'
import { Skeleton, Typography } from '@dozer/ui'
import { FC } from 'react'

import { CellProps } from './types'
import { api } from 'utils/api'

export const TokenPriceCell: FC<CellProps> = ({ row }) => {
  const price = row.price || 0

  return (
    <Typography variant="sm" weight={600} className="text-right text-stone-50">
      {row.id.includes('husdc')
        ? formatUSD(1)
        : Math.min(price) > 1
        ? formatUSD(Math.min(price))
        : formatUSD(Math.min(price))}
    </Typography>
  )
}
