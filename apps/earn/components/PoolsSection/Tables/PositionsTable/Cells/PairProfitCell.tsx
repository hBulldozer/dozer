import { FC } from 'react'
import { classNames } from '@dozer/ui'
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'
import { PositionPair } from '../PositionsTable'

interface PairProfitCellProps {
  row: PositionPair
}

export const PairProfitCell: FC<PairProfitCellProps> = ({ row }) => {
  // Check if profit data is available
  const profitData = row.profit

  if (!profitData || profitData.initial_value_usd === 0) {
    return (
      <div className="flex flex-col items-end">
        <div className="text-sm text-stone-400">-</div>
        <div className="text-xs text-stone-500">No data</div>
      </div>
    )
  }

  const isProfit = profitData.profit_amount_usd >= 0
  const profitPercentage = profitData.profit_percentage

  // Format USD amounts
  const formatUSD = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount))
  }

  // Format percentage
  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`
  }

  return (
    <div className="flex flex-col items-end">
      <div className={classNames('flex items-center space-x-1', isProfit ? 'text-green-400' : 'text-red-400')}>
        {isProfit ? (
          <ArrowTrendingUpIcon className="w-3 h-3" />
        ) : (
          <ArrowTrendingDownIcon className="w-3 h-3" />
        )}
        <span className="text-sm font-medium">
          {formatUSD(profitData.profit_amount_usd)}
        </span>
      </div>
      <div className={classNames('text-xs', isProfit ? 'text-green-400' : 'text-red-400')}>
        {formatPercentage(profitPercentage)}
      </div>
    </div>
  )
}