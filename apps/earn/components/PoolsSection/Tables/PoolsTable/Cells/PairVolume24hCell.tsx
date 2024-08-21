import { formatUSD } from '@dozer/format'
import { Typography } from '@dozer/ui'
import { FC } from 'react'

import { CellProps } from './types'

export const PairVolume24hCell: FC<CellProps> = ({ row }) => {
  const volume = formatUSD(row.volume1d * (row.priceHtr || 0))

  return (
    <Typography variant="sm" weight={600} className="text-right text-stone-50">
      {volume.includes('NaN') ? '$0.00' : volume}
    </Typography>
  )
}
