import { FC } from 'react'
import { classNames } from '@dozer/ui'
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'

interface PoolPositionProfitProps {
  profitAmountUsd: number
  profitPercentage: number
  currentValueUsd: number
  initialValueUsd: number
  lastActionTimestamp?: number
  className?: string
}

export const PoolPositionProfit: FC<PoolPositionProfitProps> = ({
  profitAmountUsd,
  profitPercentage,
  currentValueUsd,
  initialValueUsd,
  lastActionTimestamp,
  className,
}) => {
  const isProfit = profitAmountUsd >= 0
  const hasData = initialValueUsd > 0

  // Format USD amounts
  const formatUSD = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  // Format percentage
  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`
  }

  // Format timestamp to relative time
  const formatRelativeTime = (timestamp: number) => {
    if (!timestamp) return 'N/A'

    const now = Date.now() / 1000
    const diffSeconds = now - timestamp
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return `${diffDays}d ago`
    } else if (diffHours > 0) {
      return `${diffHours}h ago`
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`
    } else {
      return 'Just now'
    }
  }

  if (!hasData) {
    return (
      <div className={classNames('flex flex-col space-y-1', className)}>
        <div className="text-sm text-stone-400">No profit data available</div>
        <div className="text-xs text-stone-500">Position tracking starts after next action</div>
      </div>
    )
  }

  return (
    <div className={classNames('flex flex-col space-y-2', className)}>
      {/* Main P&L Display */}
      <div className="flex items-center space-x-2">
        <div className={classNames('flex items-center space-x-1', isProfit ? 'text-green-400' : 'text-red-400')}>
          {isProfit ? (
            <ArrowTrendingUpIcon className="w-4 h-4" />
          ) : (
            <ArrowTrendingDownIcon className="w-4 h-4" />
          )}
          <span className="font-medium">{formatUSD(Math.abs(profitAmountUsd))}</span>
        </div>
        <div className={classNames('text-sm', isProfit ? 'text-green-400' : 'text-red-400')}>
          ({formatPercentage(profitPercentage)})
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-2 gap-2 text-xs text-stone-400">
        <div className="flex flex-col">
          <span className="text-stone-500">Current Value</span>
          <span className="text-stone-300">{formatUSD(currentValueUsd)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-stone-500">Initial Value</span>
          <span className="text-stone-300">{formatUSD(initialValueUsd)}</span>
        </div>
      </div>

      {/* Last Update */}
      {lastActionTimestamp && (
        <div className="text-xs text-stone-500">
          Updated {formatRelativeTime(lastActionTimestamp)}
        </div>
      )}
    </div>
  )
}