import { ArrowIcon, Skeleton, Typography } from '@dozer/ui'
import { FC, useContext } from 'react'

import { CellProps } from './types'
import { formatPercentChange } from '@dozer/format'
import { TokensSummaryContext } from './TokensSummaryContext'

export const TokenChangeCell: FC<CellProps> = ({ row }) => {
  // Extract token UUID from row ID
  const tokenUuid = row.id.replace('token-', '')

  // Get summary data from context (no individual API call!)
  const tokensSummary = useContext(TokensSummaryContext)
  const summaryData = tokensSummary?.[tokenUuid]
  const change = summaryData?.change_24h ?? row.change ?? 0
  const isLoading = !tokensSummary // Loading if summary not yet fetched

  // Handle loading state
  if (isLoading && !row.id.includes('husdc')) {
    return (
      <div className="flex items-center gap-1">
        <Skeleton.Box className="w-4 h-4 bg-white/[0.06] rounded" />
        <Skeleton.Box className="w-12 h-4 bg-white/[0.06] rounded" />
      </div>
    )
  }

  // Handle hUSDC (stable coin - always 0% change)
  if (row.id.includes('husdc')) {
    return (
      <div className="flex items-center gap-1">
        <ArrowIcon type={'up'} className={'text-green-400'} />
        <Typography key="changeCell" variant="sm" weight={600} className={'text-green-400'}>
          {formatPercentChange(0)}
        </Typography>
      </div>
    )
  }

  // Format the change value
  // Note: summaryData.change_24h is already in percentage form (e.g., -0.49 = -49%)
  // while row.change is a decimal fraction (e.g., -0.49 = -49% needs to be multiplied by 100)
  const formattedChange = summaryData
    ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` // Already a percentage from price service
    : formatPercentChange(change) // Decimal fraction from fallback data

  return (
    <div className="flex items-center gap-1">
      <ArrowIcon type={change < 0 ? 'down' : 'up'} className={change < 0 ? 'text-red-400' : 'text-green-400'} />
      <Typography key="changeCell" variant="sm" weight={600} className={change < 0 ? 'text-red-400' : 'text-green-400'}>
        {formattedChange}
      </Typography>
    </div>
  )
}
