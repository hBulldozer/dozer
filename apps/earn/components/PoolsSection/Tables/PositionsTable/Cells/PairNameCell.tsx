import { formatNumber } from '@dozer/format'
import { classNames, Currency, NetworkIcon, Typography } from '@dozer/ui'
import { FC } from 'react'

import { ICON_SIZE } from '../../contants'
import { CellProps } from './types'
import { useTokensFromPair } from '@dozer/api'

export const PairNameCell: FC<CellProps> = ({ row }) => {
  const { token0, token1 } = useTokensFromPair(row)

  return (
    <div className="flex items-center gap-3 sm:gap-0">
      <div className="hidden sm:flex">
        <Currency.IconList iconWidth={ICON_SIZE} iconHeight={ICON_SIZE}>
          <Currency.Icon currency={token0} />
          <Currency.Icon currency={token1} />
        </Currency.IconList>
      </div>
      <div className="flex sm:hidden">
        <NetworkIcon chainId={row.chainId} width={ICON_SIZE} height={ICON_SIZE} />
      </div>
      <div className="flex flex-col">
        <Typography variant="sm" weight={500} className="flex items-center gap-1 text-slate-50">
          {token0.symbol} <span className="text-slate-500">/</span> {token1.symbol}{' '}
          <div className={classNames('bg-slate-700 rounded-lg px-1 py-0.5 ml-1')}>
            {formatNumber(row.feeUSD / 100)}%
          </div>
        </Typography>
        {/* <Typography variant="xxs" className="text-slate-400">
          {row.type === 'STABLE_POOL' && 'Stable'}
          {row.type === 'CONSTANT_PRODUCT_POOL' && 'Classic'}
        </Typography> */}
      </div>
    </div>
  )
}
