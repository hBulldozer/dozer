import { formatUSD } from '@dozer/format'
import { Skeleton, Typography } from '@dozer/ui'
import { FC } from 'react'

import { CellProps } from './types'
import { hathorLib } from '@dozer/nanocontracts'
import { api } from 'utils/api'

export const TokenMarketCapCell: FC<CellProps> = ({ row }) => {
  const { data: allTotalSupply, isLoading } = api.getTokens.allTotalSupply.useQuery()
  const totalSupply = allTotalSupply
    ? row.id.includes('native')
      ? allTotalSupply[row.token0.uuid]
      : allTotalSupply[row.token1.uuid]
    : 0
  const { data: prices, isLoading: isLoadingPrices } = api.getPrices.all.useQuery()
  const price = prices ? (row.id.includes('native') ? prices[row.token0.uuid] : prices[row.token1.uuid]) : 0

  return isLoading || isLoadingPrices ? (
    <div className="flex flex-col gap-1 justify-center flex-grow h-[44px]">
      <Skeleton.Box className="ml-4 h-[22px] bg-white/[0.06] rounded-full" />
    </div>
  ) : (
    <Typography variant="sm" weight={600} className="text-right text-stone-50">
      {formatUSD((totalSupply / 100) * price)}
    </Typography>
  )
}
