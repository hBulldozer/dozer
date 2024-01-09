import { NetworkIcon, Typography } from '@dozer/ui'
import { FC } from 'react'

import { ICON_SIZE } from '../../contants'
import { CellProps } from './types'
import { formatUSD } from '@dozer/format'
import { api } from 'utils/api'

export const TokenChangeCell: FC<CellProps> = ({ row }) => {
  const change = api.getPools.reserveChangeById({ id: row.id })
  return (
    <div className="flex items-center gap-2">
      <Typography variant="sm" weight={600} className="text-right text-stone-50">
        {volume.includes('NaN') ? '$0.00' : volume}
      </Typography>
    </div>
  )
}
