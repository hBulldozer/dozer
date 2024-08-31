import { formatUSD } from '@dozer/format'
import { Typography } from '@dozer/ui'
import { FC, useRef } from 'react'
import { CellProps } from './types'

export const PairValueCell: FC<CellProps> = ({ row }) => {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <Typography variant="sm" weight={600} className="text-right text-slate-50">
      {formatUSD((row.value0 || 0) + (row.value1 || 0))}
    </Typography>
  )
}
