import { useInViewport } from '@dozer/hooks'
import { Currency, Typography, classNames } from '@dozer/ui'
import { FC, useMemo, useRef } from 'react'

import { ICON_SIZE } from '../../contants'
import { CellProps } from './types'
import { Token } from '@dozer/currency'
import { UsersIcon } from '@heroicons/react/24/outline'

export const TokenNameCell: FC<CellProps> = ({ row }) => {
  const ref = useRef<HTMLDivElement>(null)
  const inViewport = useInViewport(ref)

  // Always select the token whose UUID matches the row's id
  const tokenUuid = row.id.replace('token-', '')
  const _token = row.token0.uuid === tokenUuid ? row.token0 : row.token1
  const token = useMemo(
    () =>
      new Token({
        uuid: _token.uuid,
        name: _token.name,
        decimals: _token.decimals,
        symbol: _token.symbol,
        chainId: _token.chainId,
        imageUrl: _token.imageUrl || undefined,
      }),
    [row]
  )

  const shouldPrioritize = inViewport || (!ref.current && token.symbol === 'HTR')

  return (
    <div className="flex items-center">
      {/* Always show icon for visual identification */}
      <div className="flex-shrink-0" style={{ width: `${ICON_SIZE}px` }}>
        <Currency.Icon
          width={ICON_SIZE}
          height={ICON_SIZE}
          currency={token}
          priority={shouldPrioritize}
          loading={shouldPrioritize ? 'eager' : 'lazy'}
        />
      </div>
      <div className="flex items-center flex-grow min-w-0 ml-3">
        <div className="flex flex-col flex-grow min-w-0 mr-2">
          {/* Mobile: Show symbol prominently with name smaller underneath */}
          <Typography variant="sm" weight={600} className="block truncate text-stone-50 sm:hidden">
            {token.symbol}
          </Typography>
          <Typography variant="xxs" className="block truncate text-stone-400 sm:hidden">
            {token.name}
          </Typography>

          {/* Desktop: Show symbol with name underneath */}
          <Typography variant="sm" weight={500} className="hidden truncate text-stone-50 sm:block">
            {token.symbol}
          </Typography>
          <Typography variant="xxs" className="hidden truncate sm:block text-stone-400">
            {token.name}
          </Typography>
        </div>
        {token.imageUrl && (
          <>
            <div className={classNames('bg-stone-700 hidden sm:flex rounded-lg px-1 py-0.5 text-xs flex-shrink-0')}>
              Tools
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
