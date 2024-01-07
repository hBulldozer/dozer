import { formatNumber } from '@dozer/format'
import { useInViewport } from '@dozer/hooks'
import { classNames, Currency, NetworkIcon, Typography } from '@dozer/ui'
import { FC, useRef } from 'react'

import { useTokensFromPair } from '@dozer/api'
import { ICON_SIZE } from '../../contants'
import { CellProps } from './types'

export const TokenNameCell: FC<CellProps> = ({ row }) => {
  const { token0, token1 } = useTokensFromPair(row)
  const ref = useRef<HTMLDivElement>(null)
  const inViewport = useInViewport(ref)
  return (
    <div className="flex items-center gap-3 ">
      <Currency.Icon width={ICON_SIZE} height={ICON_SIZE} currency={token1} priority={inViewport} />
      <div className="flex flex-col ">
        <Typography variant="sm" weight={500} className="flex items-center gap-2 text-stone-50">
          {token1.symbol}
        </Typography>
        <span className="text-stone-500">{token1.name}</span>
      </div>
    </div>
  )
}
