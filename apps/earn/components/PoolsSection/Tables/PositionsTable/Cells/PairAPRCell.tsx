import { formatPercent } from '@dozer/format'
import { Typography, Chip } from '@dozer/ui'
import { FC } from 'react'

import { FarmRewardsAvailableTooltip } from '../../../../FarmRewardsAvailableTooltip'
import { CellProps } from './types'

export const PairAPRCell: FC<CellProps> = ({ row }) => {
  const apr = row.apr * 100
  const isHighYield = apr >= 5
  const isMediumYield = apr >= 1 && apr < 5
  const isLowYield = apr > 0 && apr < 1
  const isZeroYield = apr === 0

  // Determine APR color
  const getApyColor = () => {
    if (isZeroYield) return 'gray'
    if (isLowYield) return 'yellow'
    if (isMediumYield) return 'green'
    if (isHighYield) return 'green'
    return 'gray'
  }

  return (
    <div className="text-right">
      <Chip color={getApyColor()} size="sm" label={`${apr.toFixed(2)}% APR`} className="font-semibold" />
    </div>
  )
}
