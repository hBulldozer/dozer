import { ArrowIcon, Skeleton, Typography } from '@dozer/ui'
import { FC } from 'react'

import { CellProps } from './types'
import { formatPercentChange } from '@dozer/format'
import { api } from 'utils/api'
import { getMetricsQueryConfig } from '@dozer/api/src/helpers/queryConfig'

export const TokenChangeCell: FC<CellProps> = ({ row }) => {
  // Extract token UUID - either from token1 (normal pairs) or token0 (if it's the non-HTR token)
  const token = row.token1.uuid !== '00' ? row.token1 : row.token0
  const tokenUuid = token.uuid

  // Construct pool ID (assuming fee tier of 5 basis points)
  const poolId = `00/${tokenUuid}/5`

  // Fetch 24h metrics from history API with optimized config
  const { data: metrics, isLoading } = api.getHistory.get24hMetrics.useQuery(
    { poolId, tokenId: tokenUuid },
    {
      enabled: !!tokenUuid && !row.id.includes('husdc'), // Don't fetch for hUSDC as it's stable
      ...getMetricsQueryConfig(), // Use environment-optimized settings
    }
  )

  // Extract price change from the response
  const change = metrics?.priceChange24h ?? row.change ?? 0

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
