import { formatUSD, formatHTR } from '@dozer/format'
import { Skeleton, Typography } from '@dozer/ui'
import { FC } from 'react'

import { CellProps } from './types'

export const TokenMarketCapCell: FC<CellProps> = ({ row, displayCurrency = 'USD' }) => {
  const marketCapUSD = row.marketCap || 0
  const htrPriceUSD = row.priceHtr || 1

  if (displayCurrency === 'HTR') {
    const marketCapHTR = htrPriceUSD > 0 ? marketCapUSD / htrPriceUSD : 0
    return (
      <Typography variant="sm" weight={600} className="text-right text-stone-50">
        {formatHTR(marketCapHTR)}
      </Typography>
    )
  }

  return (
    <Typography variant="sm" weight={600} className="text-right text-stone-50">
      {formatUSD(marketCapUSD)}
    </Typography>
  )
}
