import { FC } from 'react'

import { CellProps } from './types'
import { api } from 'utils/api'

export const TokenMiniChartCell: FC<CellProps> = ({ row }) => {
  const symbol = (row.token0.uuid == '00' ? row.token1 : row.token0).symbol
  const { data: poolDB } = api.getPools.byId.useQuery({ id: row.id })
  const tokenReservePrevious: { reserve0: number; reserve1: number } = {
    reserve0: poolDB ? Number(poolDB.reserve0) : row.reserve1,
    reserve1: poolDB ? Number(poolDB.reserve1) : row.reserve1,
  }
  const { data: _priceInHTR } = api.getPrices.fromPair.useQuery({ pairMerged: row })
  const priceInHTR_previous =
    row.id === 'native' ? 1 : Number(tokenReservePrevious.reserve0) / Number(tokenReservePrevious.reserve1)
  const priceInHTR = _priceInHTR ? _priceInHTR : priceInHTR_previous
  const change = (priceInHTR - priceInHTR_previous) / priceInHTR_previous
  const { data: token } = symbol
    ? api.getTokens.bySymbol.useQuery({
        symbol,
      })
    : { data: undefined }
  const chartSVG = token?.miniChartSVG.replace('black', change > 0 ? 'green' : 'red')
  return <div dangerouslySetInnerHTML={{ __html: chartSVG ? chartSVG : <></> }} />
}
