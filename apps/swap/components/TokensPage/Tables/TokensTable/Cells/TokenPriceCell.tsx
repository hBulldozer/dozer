import { formatUSD, formatHTR } from '@dozer/format'
import { Skeleton, Typography } from '@dozer/ui'
import { FC } from 'react'

import { CellProps } from './types'

export const TokenPriceCell: FC<CellProps> = ({ row, displayCurrency = 'USD' }) => {
  const priceUSD = row.price || 0
  const htrPriceUSD = row.priceHtr || 1

  // Calculate price in HTR (token price in USD / HTR price in USD)
  const priceHTR = htrPriceUSD > 0 ? priceUSD / htrPriceUSD : 0

  if (displayCurrency === 'HTR') {
    // For HTR token itself, show 1 HTR
    if (row.id === 'token-00') {
      return (
        <Typography variant="sm" weight={600} className="text-right text-stone-50 sm:text-sm text-base">
          1.00 HTR
        </Typography>
      )
    }
    return (
      <Typography variant="sm" weight={600} className="text-right text-stone-50 sm:text-sm text-base">
        {formatHTR(priceHTR)}
      </Typography>
    )
  }

  return (
    <Typography variant="sm" weight={600} className="text-right text-stone-50 sm:text-sm text-base">
      {row.id.includes('husdc')
        ? formatUSD(1)
        : Math.min(priceUSD) > 1
        ? formatUSD(Math.min(priceUSD))
        : formatUSD(Math.min(priceUSD))}
    </Typography>
  )
}
