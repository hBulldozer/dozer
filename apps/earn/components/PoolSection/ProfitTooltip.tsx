import { FC } from 'react'
import { Popover } from '@headlessui/react'
import { InformationCircleIcon } from '@heroicons/react/24/outline'
import { classNames } from '@dozer/ui'

interface ProfitTooltipProps {
  profitAmountUsd: number
  profitPercentage: number
  currentValueUsd: number
  initialValueUsd: number
  lastActionTimestamp?: number
  className?: string
}

export const ProfitTooltip: FC<ProfitTooltipProps> = ({
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
      maximumFractionDigits: 4,
    }).format(amount)
  }

  // Format percentage
  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(4)}%`
  }

  // Format date
  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'N/A'
    return new Date(timestamp * 1000).toLocaleString()
  }

  if (!hasData) {
    return null
  }

  return (
    <Popover className={classNames('relative', className)}>
      <Popover.Button className="flex items-center text-stone-400 hover:text-stone-300 transition-colors">
        <InformationCircleIcon className="w-4 h-4" />
      </Popover.Button>

      <Popover.Panel className="absolute z-50 w-80 p-4 mt-2 bg-stone-800 border border-stone-700 rounded-lg shadow-lg">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-stone-200">Position Performance</h3>
            <div className={classNames('text-sm font-medium', isProfit ? 'text-green-400' : 'text-red-400')}>
              {formatPercentage(profitPercentage)}
            </div>
          </div>

          {/* Main Metrics */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-stone-400">Current Value:</span>
              <span className="text-xs text-stone-200">{formatUSD(currentValueUsd)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-stone-400">Initial Value:</span>
              <span className="text-xs text-stone-200">{formatUSD(initialValueUsd)}</span>
            </div>
            <div className="border-t border-stone-700 pt-2">
              <div className="flex justify-between">
                <span className="text-xs text-stone-400">Profit/Loss:</span>
                <span className={classNames('text-xs font-medium', isProfit ? 'text-green-400' : 'text-red-400')}>
                  {formatUSD(profitAmountUsd)}
                </span>
              </div>
            </div>
          </div>

          {/* Performance Notes */}
          <div className="space-y-2 pt-2 border-t border-stone-700">
            <div className="text-xs text-stone-400">
              <div className="font-medium text-stone-300 mb-1">How this is calculated:</div>
              <ul className="list-disc list-inside space-y-1 text-stone-500">
                <li>Current value is based on your share of the pool</li>
                <li>Initial value is from your last deposit/withdrawal</li>
                <li>Includes fees earned and impermanent loss/gain</li>
              </ul>
            </div>
          </div>

          {/* Last Update */}
          {lastActionTimestamp && (
            <div className="pt-2 border-t border-stone-700">
              <div className="text-xs text-stone-500">
                Last updated: {formatDate(lastActionTimestamp)}
              </div>
            </div>
          )}
        </div>
      </Popover.Panel>
    </Popover>
  )
}