import { formatUSD, formatHTR } from '@dozer/format'
import { Typography } from '@dozer/ui'
import { FC } from 'react'

import { CellProps } from './types'

export const TokenVolume24hCell: FC<CellProps> = ({ row, displayCurrency = 'USD' }) => {
  const volumeUSD = row.volumeUSD ?? 0
  const htrPriceUSD = row.priceHtr || 1

  if (displayCurrency === 'HTR') {
    const volumeHTR = htrPriceUSD > 0 ? volumeUSD / htrPriceUSD : 0
    const formatted = formatHTR(volumeHTR)
    return (
      <Typography variant="sm" weight={600} className="text-right text-stone-50">
        {formatted.includes('NaN') ? '0.00 HTR' : formatted}
      </Typography>
    )
  }

  const volume = formatUSD(volumeUSD)
  return (
    <Typography variant="sm" weight={600} className="text-right text-stone-50">
      {volume.includes('NaN') ? '$0.00' : volume}
    </Typography>
  )
}
