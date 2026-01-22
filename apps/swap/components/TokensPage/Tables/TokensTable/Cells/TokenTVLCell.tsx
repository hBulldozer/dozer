import { formatUSD } from '@dozer/format'
import { Typography } from '@dozer/ui'
import { FC } from 'react'

import { CellProps } from './types'

export const TokenTVLCell: FC<CellProps> = ({ row }) => {
  // TVL is always displayed in USD regardless of currency toggle
  const tvl = formatUSD(row.liquidityUSD)
  return (
    <Typography variant="sm" weight={600} className="text-right text-stone-50">
      {tvl.includes('NaN') ? '$0.00' : tvl}
    </Typography>
  )
}
