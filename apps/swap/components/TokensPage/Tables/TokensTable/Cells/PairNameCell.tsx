import { formatNumber } from '@dozer/format'
import { useInViewport } from '@dozer/hooks'
import { classNames, Currency, NetworkIcon, Typography } from '@dozer/ui'
import { FC, useRef } from 'react'

import { useTokensFromPair } from '@dozer/api'
import { ICON_SIZE } from '../../contants'
import { CellProps } from './types'

export const PairNameCell: FC<CellProps> = ({ row }) => {
  const { token0, token1 } = useTokensFromPair(row)
  const ref = useRef<HTMLDivElement>(null)
  const inViewport = useInViewport(ref)
  return (
    <div className="flex items-center gap-3 ">
      <Currency.Icon width={ICON_SIZE} height={ICON_SIZE} currency={token1} priority={inViewport} />
      <div className="flex flex-col">
        <Typography variant="sm" weight={500} className="flex items-center gap-1 text-stone-50">
          {token0.symbol} <span className="text-stone-500">/</span> {token1.symbol}{' '}
          <div className={classNames('bg-stone-700 rounded-lg px-1 py-0.5 ml-1')}>
            {/* {formatNumber(row.swapFee / 100)}% */}
          </div>
        </Typography>
        {/* <Typography variant="xxs" className="text-stone-400">
          {row.type === 'STABLE_POOL' && 'Stable'}
          {row.type === 'CONSTANT_PRODUCT_POOL' && 'Classic'}
        </Typography> */}
      </div>
    </div>
  )
}
