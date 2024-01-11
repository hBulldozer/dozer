import { formatNumber } from '@dozer/format'
import { useInViewport } from '@dozer/hooks'
import { classNames, Currency, NetworkIcon, Typography } from '@dozer/ui'
import { FC, useRef } from 'react'

import { useTokensFromPair } from '@dozer/api'
import { ICON_SIZE } from '../../contants'
import { CellProps } from './types'
import { Token } from '@dozer/currency'

export const TokenNameCell: FC<CellProps> = ({ row }) => {
  const _token = row.token0.uuid != '00' ? row.token0 : row.token1
  const token = new Token({
    uuid: _token.uuid,
    name: _token.name,
    decimals: _token.decimals,
    symbol: _token.symbol,
    chainId: _token.chainId,
  })
  const ref = useRef<HTMLDivElement>(null)
  const inViewport = useInViewport(ref)
  return (
    <div className="flex items-center gap-3 ">
      <Currency.Icon width={ICON_SIZE} height={ICON_SIZE} currency={token} priority={inViewport} />
      <div className="flex flex-col ">
        <Typography variant="sm" weight={500} className="flex items-center gap-2 text-stone-50">
          {token.symbol}
        </Typography>
        <span className="text-stone-500">{token.name}</span>
      </div>
    </div>
  )
}
