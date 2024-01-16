import { FC } from 'react'

import { CellProps } from './types'
import { api } from 'utils/api'
import { Skeleton } from '@dozer/ui'

export const TokenMiniChartCell: FC<CellProps> = ({ row }) => {
  const symbol = (row.token0.uuid == '00' ? row.token1 : row.token0).symbol
  const { data: poolDB, isLoading: isLoadingDB } = api.getPools.byId.useQuery({ id: row.id })
  const tokenReservePrevious: { reserve0: number; reserve1: number } = {
    reserve0: poolDB ? Number(poolDB.reserve0) : row.reserve1,
    reserve1: poolDB ? Number(poolDB.reserve1) : row.reserve1,
  }
  const { data: _priceInHTR, isLoading: isLoadingPrice } = api.getPrices.fromPair.useQuery({ pairMerged: row })
  const priceInHTR_previous = row.id.includes('native')
    ? 1
    : Number(tokenReservePrevious.reserve0) / Number(tokenReservePrevious.reserve1)
  const priceInHTR = _priceInHTR ? _priceInHTR : priceInHTR_previous
  const change = (priceInHTR - priceInHTR_previous) / priceInHTR_previous
  const { data: token, isLoading: isLoadingToken } = symbol
    ? api.getTokens.bySymbol.useQuery({
        symbol,
      })
    : { data: undefined, isLoading: false }
  const chartSVG = token?.miniChartSVG
    .replace('black', change >= 0 ? 'rgb(74 222 128)' : 'rgb(248 113 113)')
    .replace('strokeWidth="2"', 'strokeWidth="5"')
  const isLoading = isLoadingToken || isLoadingPrice || isLoadingDB
  return isLoading ? (
    <div className="flex flex-col gap-1 justify-center flex-grow h-[44px]">
      <Skeleton.Box className="w-[120px] h-[22px] bg-white/[0.06] rounded-full" />
    </div>
  ) : (
    <div
      dangerouslySetInnerHTML={{
        __html: chartSVG ? chartSVG : <span>Failed to fetch</span>,
      }}
    />
  )
}
