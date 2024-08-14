import { ArrowIcon, Skeleton, Typography } from '@dozer/ui'
import { FC } from 'react'

import { CellProps } from './types'
import { formatPercentChange } from '@dozer/format'
import { api } from 'utils/api'

export const TokenChangeCell: FC<CellProps> = ({ row }) => {
  const change = row.change || 0
  return row.id.includes('usdt') ? (
    <div className="flex items-center gap-1">
      <ArrowIcon type={'up'} className={'text-green-400'} />
      <Typography key="changeCell" variant="sm" weight={600} className={'text-green-400'}>
        {formatPercentChange(0)}
      </Typography>
    </div>
  ) : (
    <div className="flex items-center gap-1">
      <ArrowIcon type={change < 0 ? 'down' : 'up'} className={change < 0 ? 'text-red-400' : 'text-green-400'} />
      <Typography key="changeCell" variant="sm" weight={600} className={change < 0 ? 'text-red-400' : 'text-green-400'}>
        {formatPercentChange(change)}
      </Typography>
    </div>
  )
}
