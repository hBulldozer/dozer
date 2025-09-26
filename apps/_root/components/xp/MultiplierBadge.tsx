import { FC } from 'react'
import { Typography, Badge, classNames } from '@dozer/ui'

interface MultiplierBadgeProps {
  multiplier: number
  isConnected?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const getMultiplierColor = (multiplier: number) => {
  if (multiplier >= 2.0) return 'purple'
  if (multiplier >= 1.5) return 'yellow'
  if (multiplier >= 1.25) return 'blue'
  if (multiplier >= 1.1) return 'green'
  return 'gray'
}

const getMultiplierLabel = (multiplier: number) => {
  if (multiplier >= 2.0) return 'Diamond'
  if (multiplier >= 1.5) return 'Gold'
  if (multiplier >= 1.25) return 'Silver'
  if (multiplier >= 1.1) return 'Bronze'
  return 'Member'
}

export const MultiplierBadge: FC<MultiplierBadgeProps> = ({
  multiplier,
  isConnected = false,
  className = '',
  size = 'md',
}) => {
  if (!isConnected) {
    return (
      <div className={classNames('flex items-center gap-2', className)}>
        <Badge variant="outline" size={size} className="text-gray-400 border-gray-600">
          Discord Not Connected
        </Badge>
        <Typography variant="xs" className="text-gray-500">
          1.0x multiplier
        </Typography>
      </div>
    )
  }

  const color = getMultiplierColor(multiplier)
  const label = getMultiplierLabel(multiplier)

  return (
    <div className={classNames('flex items-center gap-2', className)}>
      <Badge
        variant="filled"
        size={size}
        className={classNames(
          'flex items-center gap-1',
          color === 'purple' && 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          color === 'yellow' && 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
          color === 'blue' && 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          color === 'green' && 'bg-green-500/20 text-green-300 border-green-500/30',
          color === 'gray' && 'bg-gray-500/20 text-gray-300 border-gray-500/30'
        )}
      >
        <span className="text-xs">💎</span>
        {label}
      </Badge>
      <Typography variant="sm" className="text-white font-semibold">
        {multiplier.toFixed(1)}x
      </Typography>
    </div>
  )
}