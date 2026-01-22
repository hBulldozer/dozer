import { ArrowIcon, Skeleton, Typography } from '@dozer/ui'
import { FC } from 'react'

import { CellProps } from './types'
import { formatPercentChange } from '@dozer/format'
import { api } from 'utils/api'

export const TokenChangeCell: FC<CellProps> = ({ row, displayCurrency = 'USD' }) => {
  // Extract token UUID from row ID
  const tokenUuid = row.id.replace('token-', '')

  // Determine special cases
  const isHtrToken = tokenUuid === '00'
  const isHusdcToken = row.id.includes('husdc')
  const isHtrInHtrMode = displayCurrency === 'HTR' && isHtrToken
  const isHusdcInUsdMode = displayCurrency === 'USD' && isHusdcToken

  // Fetch the token's own price change (in USD terms)
  const { data: priceChangeData, isLoading: isLoadingToken } = api.getPrices.priceChange.useQuery(
    { tokenUid: tokenUuid },
    {
      enabled: !!tokenUuid && !isHtrInHtrMode && !isHusdcInUsdMode,
      staleTime: 60000,
      refetchInterval: 60000,
    }
  )

  // For HTR mode (all tokens except HTR itself), we need HTR's USD change
  // to calculate the relative change
  const { data: htrChangeData, isLoading: isLoadingHtr } = api.getPrices.priceChange.useQuery(
    { tokenUid: '00' }, // HTR token UUID
    {
      enabled: displayCurrency === 'HTR' && !isHtrToken,
      staleTime: 60000,
      refetchInterval: 60000,
    }
  )

  // Handle loading state
  const showLoading =
    (isLoadingToken && !isHtrInHtrMode && !isHusdcInUsdMode) ||
    (isLoadingHtr && displayCurrency === 'HTR' && !isHtrToken)

  if (showLoading) {
    return (
      <div className="flex items-center gap-1">
        <Skeleton.Box className="w-4 h-4 bg-white/[0.06] rounded" />
        <Skeleton.Box className="w-12 h-4 bg-white/[0.06] rounded" />
      </div>
    )
  }

  // For HTR token when displaying in HTR mode, show 0% (HTR price in HTR is always 1)
  if (isHtrInHtrMode) {
    return (
      <div className="flex items-center gap-1">
        <ArrowIcon type={'up'} className={'text-green-400'} />
        <Typography key="changeCell" variant="sm" weight={600} className={'text-green-400'}>
          {formatPercentChange(0)}
        </Typography>
      </div>
    )
  }

  // hUSDC in USD mode shows 0% (stable)
  if (isHusdcInUsdMode) {
    return (
      <div className="flex items-center gap-1">
        <ArrowIcon type={'up'} className={'text-green-400'} />
        <Typography key="changeCell" variant="sm" weight={600} className={'text-green-400'}>
          {formatPercentChange(0)}
        </Typography>
      </div>
    )
  }

  // Get the token's USD change
  const tokenUsdChange = priceChangeData?.change ?? row.change ?? 0

  // Helper function to normalize very small values to zero (floating-point precision fix)
  // This ensures 0.00% always shows as green up arrow
  const normalizeChange = (change: number): number => {
    const threshold = 0.00005 // 0.005% threshold
    return Math.abs(change) < threshold ? 0 : change
  }

  // In HTR mode, calculate the change relative to HTR
  // Formula: change_in_htr = (1 + token_usd_change) / (1 + htr_usd_change) - 1
  // This gives the token's price change when measured in HTR instead of USD
  if (displayCurrency === 'HTR' && !isHtrToken) {
    const htrUsdChange = htrChangeData?.change ?? 0

    // Calculate relative change
    // If token went up X% and HTR went up Y%,
    // then token/HTR ratio changed by: (1+X)/(1+Y) - 1
    let relativeChange = 0
    if (1 + htrUsdChange !== 0) {
      relativeChange = normalizeChange((1 + tokenUsdChange) / (1 + htrUsdChange) - 1)
    }

    return (
      <div className="flex items-center gap-1">
        <ArrowIcon
          type={relativeChange < 0 ? 'down' : 'up'}
          className={relativeChange < 0 ? 'text-red-400' : 'text-green-400'}
        />
        <Typography
          key="changeCell"
          variant="sm"
          weight={600}
          className={relativeChange < 0 ? 'text-red-400' : 'text-green-400'}
        >
          {formatPercentChange(relativeChange)}
        </Typography>
      </div>
    )
  }

  // USD mode: show the token's USD change directly
  return (
    <div className="flex items-center gap-1">
      <ArrowIcon
        type={tokenUsdChange < 0 ? 'down' : 'up'}
        className={tokenUsdChange < 0 ? 'text-red-400' : 'text-green-400'}
      />
      <Typography
        key="changeCell"
        variant="sm"
        weight={600}
        className={tokenUsdChange < 0 ? 'text-red-400' : 'text-green-400'}
      >
        {formatPercentChange(tokenUsdChange)}
      </Typography>
    </div>
  )
}
