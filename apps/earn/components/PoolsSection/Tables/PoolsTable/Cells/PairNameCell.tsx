import { formatNumber } from '@dozer/format'
import { useInViewport } from '@dozer/hooks'
import { classNames, Currency, NetworkIcon, Typography, Chip } from '@dozer/ui'
import { FC, useRef } from 'react'

import { useTokensFromPair } from '@dozer/api'
import { ICON_SIZE } from '../../contants'
import { CellProps } from './types'
import { UsersIcon } from '@heroicons/react/24/outline'

export const PairNameCell: FC<CellProps> = ({ row }) => {
  const { token0, token1 } = useTokensFromPair(row)
  const ref = useRef<HTMLDivElement>(null)
  const inViewport = useInViewport(ref)
  return (
    <div className="flex items-center gap-3 sm:gap-0">
      <div className="flex">
        <Currency.IconList iconWidth={ICON_SIZE} iconHeight={ICON_SIZE}>
          <Currency.Icon currency={token0} priority={inViewport} />
          <Currency.Icon currency={token1} priority={inViewport} />
        </Currency.IconList>
      </div>
      {/* <div className="flex sm:hidden">
        <NetworkIcon chainId={row.chainId} width={ICON_SIZE} height={ICON_SIZE} />
      </div> */}
      <div className="flex flex-col">
        <Typography variant="sm" weight={500} className="flex items-center gap-1 text-stone-50">
          {token0.symbol} <span className="text-stone-500">/</span> {token1.symbol}{' '}
          <Chip color="gray" size="sm" label={`${row.swapFee.toFixed(2)}%`} className="ml-1" />
          {row.token1.imageUrl && (
            <>
              <div className={classNames('bg-stone-700 hidden sm:flex rounded-lg px-1 py-0.5 ml-1 text-xs')}>
                Community
              </div>
              <div className={classNames('bg-stone-700 flex sm:hidden rounded-lg px-1 py-0.5 ml-1 text-xs')}>
                <UsersIcon width={16} height={16} />
              </div>
            </>
          )}
        </Typography>
        {/* <Typography variant="xxs" className="text-stone-400">
          {row.type === 'STABLE_POOL' && 'Stable'}
          {row.type === 'CONSTANT_PRODUCT_POOL' && 'Classic'}
        </Typography> */}
      </div>
    </div>
  )
}
