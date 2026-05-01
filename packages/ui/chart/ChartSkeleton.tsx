'use client'

import { FC } from 'react'

interface ChartSkeletonProps {
  height?: number
}

const BAR_HEIGHTS = [45, 70, 35, 60, 50, 80, 40, 65, 55, 75, 30, 68]

export const ChartSkeleton: FC<ChartSkeletonProps> = ({ height = 400 }) => {
  return (
    <>
      <div className="mb-1 h-14 w-48 animate-pulse rounded bg-yellow-500/10" />
      <div className="h-0.5" />
      <div className="relative overflow-hidden rounded-lg" style={{ height: `${height}px` }}>
        <div className="absolute inset-0 flex items-end justify-around gap-2 p-8">
          {BAR_HEIGHTS.map((h, i) => (
            <div
              key={i}
              className="w-full animate-pulse rounded-t bg-stone-700/60"
              style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>
    </>
  )
}
