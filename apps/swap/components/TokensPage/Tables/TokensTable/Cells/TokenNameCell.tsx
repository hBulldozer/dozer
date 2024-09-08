import { useInViewport } from '@dozer/hooks'
import { Currency, Typography, classNames } from '@dozer/ui'
import { FC, useRef } from 'react'

import { ICON_SIZE } from '../../contants'
import { CellProps } from './types'
import { Token } from '@dozer/currency'

export const TokenNameCell: FC<CellProps> = ({ row }) => {
  let token: Token
  if (row.id.includes('native')) {
    const _token = row.token0.uuid == '00' ? row.token0 : row.token1
    token = new Token({
      uuid: _token.uuid,
      name: _token.name,
      decimals: _token.decimals,
      symbol: _token.symbol,
      chainId: _token.chainId,
    })
  } else {
    const _token = row.token0.uuid != '00' ? row.token0 : row.token1
    token = new Token({
      uuid: _token.uuid,
      name: _token.name,
      decimals: _token.decimals,
      symbol: _token.symbol,
      chainId: _token.chainId,
      imageUrl: _token.imageUrl || undefined,
    })
  }
  const ref = useRef<HTMLDivElement>(null)
  const inViewport = useInViewport(ref)

  return (
    <div className="flex items-center gap-3">
      <Currency.Icon width={ICON_SIZE} height={ICON_SIZE} currency={token} priority={inViewport} />

      <div className="flex items-center justify-between flex-1">
        <div className="flex flex-col">
          <Typography variant="sm" weight={500} className="text-stone-50">
            {token.symbol}
          </Typography>
          <span className="hidden text-xs sm:block text-stone-500">{token.name}</span>
        </div>

        {row.token1.imageUrl && (
          <div className="ml-2">
            <span className="bg-stone-700 rounded-lg px-1 py-0.5 text-xs text-stone-300 whitespace-nowrap">
              Community
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
