import { formatNumber } from '@dozer/format'
import { classNames, Currency, NetworkIcon, Typography, Chip } from '@dozer/ui'
import { FC } from 'react'

import { ICON_SIZE } from '../../contants'
import { CellProps } from './types'
import { useTokensFromPair } from '@dozer/api'

export const PairNameCell: FC<CellProps> = ({ row }) => {
  const { token0, token1 } = useTokensFromPair(row)

  return (
    <div className="flex items-center gap-3">
      {/* Token Icons */}
      <Currency.IconList iconWidth={28} iconHeight={28}>
        <Currency.Icon currency={token0} />
        <Currency.Icon currency={token1} />
      </Currency.IconList>

      {/* Token Pair Info */}
      <div className="flex items-center gap-2">
        <Typography variant="base" weight={600} className="text-stone-100">
          {token0.symbol} / {token1.symbol}
        </Typography>
        <Chip color="gray" size="sm" label={`${row.swapFee.toFixed(2)}%`} className="text-xs" />
      </div>
    </div>
  )
}
