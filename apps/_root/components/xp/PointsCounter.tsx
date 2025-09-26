import { FC, useEffect, useState } from 'react'
import { Typography, classNames } from '@dozer/ui'

interface PointsCounterProps {
  value: number
  duration?: number
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  suffix?: string
}

const sizeClasses = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl',
  xl: 'text-6xl',
}

export const PointsCounter: FC<PointsCounterProps> = ({
  value,
  duration = 1000,
  className = '',
  size = 'md',
  suffix = '',
}) => {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTime: number
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)

      setDisplayValue(Math.floor(value * easeOutQuart))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [value, duration])

  return (
    <Typography
      variant={size}
      className={classNames(
        'font-bold text-white tabular-nums',
        sizeClasses[size],
        className
      )}
    >
      {displayValue.toLocaleString()}{suffix}
    </Typography>
  )
}