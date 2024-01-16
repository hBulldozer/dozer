import { formatPercent } from '@dozer/format'
import { Typography } from '@dozer/ui'
import { FC } from 'react'

import { CellProps } from './types'
import { api } from 'utils/api'

export const TokenMiniChartCell: FC<CellProps> = ({ row }) => {
  const symbol = (row.token0.uuid == '00' ? row.token1 : row.token0).symbol
  const { data: token } = symbol
    ? api.getTokens.bySymbol.useQuery({
        symbol,
      })
    : { data: undefined }
  return <div dangerouslySetInnerHTML={{ __html: token ? token.miniChartSVG : <></> }} />
}
