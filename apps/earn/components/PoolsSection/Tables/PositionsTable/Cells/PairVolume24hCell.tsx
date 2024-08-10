import { formatUSD } from '@dozer/format'
import { Typography } from '@dozer/ui'
import { FC } from 'react'

import { CellProps } from './types'

export const PairVolume24hCell: FC<CellProps> = ({ row }) => {
  const volume = formatUSD(row.volumeUSD)

  return (
    <Typography variant="sm" weight={600} className="text-right text-slate-50">
      {volume.includes('NaN') ? '$0.00' : volume}
    </Typography>
  )
}
