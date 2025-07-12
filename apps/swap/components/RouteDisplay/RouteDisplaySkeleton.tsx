import React, { FC, useMemo } from 'react'
import { classNames, Typography, Skeleton } from '@dozer/ui'
import { getRandomCryptoPhrase } from './cryptoPhrases'

interface RouteDisplaySkeletonProps {
  className?: string
  hopCount?: number
}

export const RouteDisplaySkeleton: FC<RouteDisplaySkeletonProps> = ({
  className,
  hopCount = 1,
}) => {
  // Get a random phrase that stays consistent during this render
  const randomPhrase = useMemo(() => getRandomCryptoPhrase(), [])

  return (
    <div className={classNames('py-2 min-h-[88px]', className)}>
      {/* Horizontal Route Bar Skeleton */}
      <div className="flex items-center justify-center py-2 mb-3">
        <Skeleton.Box variant="fast" className="w-[240px] h-[40px] rounded-lg" />
      </div>

      {/* Centered Random Phrase Below */}
      <div className="flex items-center justify-center">
        <Typography variant="sm" className="text-stone-300 font-medium italic">
          {randomPhrase}
        </Typography>
      </div>
    </div>
  )
}