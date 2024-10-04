import { formatUSD } from '@dozer/format'
import { Skeleton, Typography } from '@dozer/ui'
import { FC } from 'react'

import { CellProps } from './types'
import { api } from 'utils/api'

export const TokenMarketCapCell: FC<CellProps> = ({ row }) => {
  const marketCap = row.marketCap || 0

  return (
    <Typography variant="sm" weight={600} className="text-right text-stone-50">
      {formatUSD(marketCap)}
    </Typography>
  )
}
