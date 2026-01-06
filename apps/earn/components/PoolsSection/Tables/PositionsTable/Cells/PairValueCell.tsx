import { formatUSD, formatNumber } from '@dozer/format'
import { Typography } from '@dozer/ui'
import { FC } from 'react'
import { CellProps } from './types'
import { useTokensFromPair } from '@dozer/api'

export const PairValueCell: FC<CellProps> = ({ row }) => {
  const totalValue = (row.value0 || 0) + (row.value1 || 0)

  return (
    <div className="text-right">
      <Typography variant="base" weight={600} className="text-stone-100">
        {formatUSD(totalValue)}
      </Typography>
    </div>
  )
}
