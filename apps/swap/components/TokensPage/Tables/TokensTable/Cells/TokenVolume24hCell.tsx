import { formatUSD } from '@dozer/format'
import { Typography } from '@dozer/ui'
import { FC } from 'react'

import { CellProps } from './types'

export const TokenVolume24hCell: FC<CellProps> = ({ row }) => {
  // Use volumeUSD directly since it's already in USD (not volume1d which is in token0 units)
  const volume = formatUSD(row.volumeUSD ?? 0)
  return (
    <Typography variant="sm" weight={600} className="text-right text-stone-50">
      {volume.includes('NaN') ? '$0.00' : volume}
    </Typography>
  )
}
