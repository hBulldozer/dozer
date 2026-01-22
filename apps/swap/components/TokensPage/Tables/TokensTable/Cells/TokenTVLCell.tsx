import { formatUSD, formatHTR } from '@dozer/format'
import { Typography } from '@dozer/ui'
import { FC } from 'react'

import { CellProps } from './types'

export const TokenTVLCell: FC<CellProps> = ({ row, displayCurrency = 'USD' }) => {
  const tvlUSD = row.liquidityUSD
  const htrPriceUSD = row.priceHtr || 1

  if (displayCurrency === 'HTR') {
    const tvlHTR = htrPriceUSD > 0 ? tvlUSD / htrPriceUSD : 0
    const formatted = formatHTR(tvlHTR)
    return (
      <Typography variant="sm" weight={600} className="text-right text-stone-50">
        {formatted.includes('NaN') ? '0.00 HTR' : formatted}
      </Typography>
    )
  }

  const tvl = formatUSD(tvlUSD)
  return (
    <Typography variant="sm" weight={600} className="text-right text-stone-50">
      {tvl.includes('NaN') ? '$0.00' : tvl}
    </Typography>
  )
}
