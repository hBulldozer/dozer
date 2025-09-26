import { FC } from 'react'
import { Typography, Widget, classNames } from '@dozer/ui'

interface PointsCardProps {
  title: string
  points: number
  icon?: React.ReactNode
  color?: 'blue' | 'green' | 'purple' | 'yellow'
  subtitle?: string
  isLoading?: boolean
}

const colorClasses = {
  blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
  green: 'from-green-500/20 to-green-600/20 border-green-500/30',
  purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
  yellow: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
}

const iconColorClasses = {
  blue: 'text-blue-400',
  green: 'text-green-400',
  purple: 'text-purple-400',
  yellow: 'text-yellow-400',
}

export const PointsCard: FC<PointsCardProps> = ({
  title,
  points,
  icon,
  color = 'blue',
  subtitle,
  isLoading = false,
}) => {
  return (
    <div
      className={classNames(
        'relative overflow-hidden rounded-xl border bg-gradient-to-br p-6 transition-all duration-200 hover:scale-105',
        colorClasses[color]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {icon && <div className={classNames('w-5 h-5', iconColorClasses[color])}>{icon}</div>}
            <Typography variant="sm" className="text-gray-300 font-medium">
              {title}
            </Typography>
          </div>

          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 w-24 bg-gray-600 rounded mb-1"></div>
              {subtitle && <div className="h-4 w-16 bg-gray-600 rounded"></div>}
            </div>
          ) : (
            <>
              <Typography variant="h2" className="text-white font-bold mb-1">
                {points.toLocaleString()}
              </Typography>
              {subtitle && (
                <Typography variant="xs" className="text-gray-400">
                  {subtitle}
                </Typography>
              )}
            </>
          )}
        </div>
      </div>

      {/* Decorative gradient overlay */}
      <div
        className={classNames(
          'absolute -top-4 -right-4 w-16 h-16 rounded-full bg-gradient-to-br opacity-20',
          color === 'blue' && 'from-blue-400 to-blue-600',
          color === 'green' && 'from-green-400 to-green-600',
          color === 'purple' && 'from-purple-400 to-purple-600',
          color === 'yellow' && 'from-yellow-400 to-yellow-600'
        )}
      />
    </div>
  )
}
