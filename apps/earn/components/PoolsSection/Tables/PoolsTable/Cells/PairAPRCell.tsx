import { formatPercent } from '@dozer/format'
import { Typography } from '@dozer/ui'
import { FC } from 'react'

import { CellProps } from './types'

export const PairAPYCell: FC<CellProps> = ({ row }) => {
  return (
    <Typography variant="sm" weight={600} className="flex items-center justify-end gap-1 text-stone-50">
      {formatPercent(row.apy)}
    </Typography>
  )
}

// Keep old export for backwards compatibility during migration
export const PairAPRCell = PairAPYCell
