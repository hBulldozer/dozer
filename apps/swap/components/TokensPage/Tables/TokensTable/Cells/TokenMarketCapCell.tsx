import { formatUSD } from '@dozer/format'
import { Typography } from '@dozer/ui'
import { FC } from 'react'

import { CellProps } from './types'

export const TokenMarketCapCell: FC<CellProps> = ({ row }) => {
  // Market Cap is always displayed in USD regardless of currency toggle
  const marketCap = row.marketCap || 0

  return (
    <Typography variant="sm" weight={600} className="text-right text-stone-50">
      {formatUSD(marketCap)}
    </Typography>
  )
}
