import { ArrowIcon, Skeleton, Typography } from '@dozer/ui'
import { FC } from 'react'

import { CellProps } from './types'
import { formatPercentChange } from '@dozer/format'
import { api } from 'utils/api'

export const TokenChangeCell: FC<CellProps> = ({ row }) => {
  // Extract token UUID from row ID
  const tokenUuid = row.id.replace('token-', '')

  // Fetch price change data with automatic environment detection
  const { data: priceChangeData, isLoading } = api.getPrices.priceChange.useQuery(
    { tokenUid: tokenUuid },
    {
      enabled: !!tokenUuid && !row.id.includes('husdc'), // Don't fetch for hUSDC as it's stable
      staleTime: 60000, // Cache for 1 minute
      refetchInterval: 60000, // Refresh every minute
    }
  )

  // Extract change from the response
  const change = priceChangeData?.change ?? row.change ?? 0

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

  return (
    <div className="flex items-center gap-1">
      <ArrowIcon type={change < 0 ? 'down' : 'up'} className={change < 0 ? 'text-red-400' : 'text-green-400'} />
      <Typography key="changeCell" variant="sm" weight={600} className={change < 0 ? 'text-red-400' : 'text-green-400'}>
        {formatPercentChange(change)}
      </Typography>
    </div>
  )
}
