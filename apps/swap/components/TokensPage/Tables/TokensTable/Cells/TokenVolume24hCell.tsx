import { formatUSD } from '@dozer/format'
import { Typography } from '@dozer/ui'
import { FC } from 'react'

import { CellProps } from './types'

export const TokenVolume24hCell: FC<CellProps> = ({ row }) => {
  console.log(row.id, row.priceHtr, row.volume1d)
  const volume = formatUSD(row.volume1d * (row.priceHtr || 1))
  return (
    <Typography variant="sm" weight={600} className="text-right text-stone-50">
      {volume.includes('NaN') ? '$0.00' : volume}
    </Typography>
  )
}
