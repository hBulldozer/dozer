import { formatUSD, formatUSD5Digit } from '@dozer/format'
import { Skeleton, Typography } from '@dozer/ui'
import { FC } from 'react'

import { CellProps } from './types'
import { api } from 'utils/api'

export const TokenPriceCell: FC<CellProps> = ({ row }) => {
  const { data: prices, isLoading } = api.getPrices.all.useQuery()
  const priceInUSD = formatUSD5Digit(prices ? prices[row.token1.uuid] : '')
  // const { data: priceHTR, isLoading: isLoadingPriceHTR } = api.getPrices.htr.useQuery()
  // const { data: priceInHTR, isLoading: isLoadingPriceInHTR } = api.getPrices.fromPair.useQuery({ pairMerged: row })
  // const priceInUSD = priceHTR && priceInHTR ? formatUSD(priceInHTR * priceHTR) : ''
  // const isLoading = isLoadingPriceHTR || isLoadingPriceInHTR

  return isLoading ? (
    <div className="flex flex-col gap-1 justify-center flex-grow h-[44px]">
      <Skeleton.Box className="w-[120px] h-[22px] bg-white/[0.06] rounded-full" />
    </div>
  ) : (
    <Typography variant="sm" weight={600} className="text-right text-stone-50">
      {priceInUSD}
    </Typography>
  )
}
