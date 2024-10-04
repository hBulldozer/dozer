import { useInViewport } from '@dozer/hooks'
import { Currency, Typography, classNames } from '@dozer/ui'
import { FC, useRef } from 'react'

import { ICON_SIZE } from '../../contants'
import { CellProps } from './types'
import { Token } from '@dozer/currency'
import { UsersIcon } from '@heroicons/react/24/outline'

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
    <div className="flex items-center">
      <div className="flex-shrink-0" style={{ width: `${ICON_SIZE}px` }}>
        <Currency.Icon width={ICON_SIZE} height={ICON_SIZE} currency={token} priority={inViewport} />
      </div>
      <div className="flex items-center flex-grow min-w-0 ml-3">
        <div className="flex flex-col flex-grow min-w-0 mr-2">
          <Typography variant="sm" weight={500} className="truncate text-stone-50">
            {token.symbol}
          </Typography>
          <Typography variant="xxs" className="hidden truncate sm:block text-stone-400">
            {token.name}
          </Typography>
        </div>
        {token.imageUrl && (
          <>
            <div className={classNames('bg-stone-700 hidden sm:flex rounded-lg px-1 py-0.5 text-xs flex-shrink-0')}>
              Community
            </div>
            <div className={classNames('bg-stone-700 flex sm:hidden rounded-lg p-0.5 text-xs flex-shrink-0')}>
              <UsersIcon width={16} height={16} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
