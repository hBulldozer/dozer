'use client'
import React, { useState, useEffect } from 'react'
import { Typography } from '@dozer/ui'
import { motion } from 'framer-motion'

type TimeLeft = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

interface CountdownTimerProps {
  targetDate: string
  title?: string
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, title = 'FINAL PHASE ENDS IN' }) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    const endDate = new Date(targetDate).getTime()

    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const difference = endDate - now

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        })
      } else {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  const timeUnits = [
    { label: 'DAYS', value: timeLeft.days },
    { label: 'HOURS', value: timeLeft.hours },
    { label: 'MINUTES', value: timeLeft.minutes },
    { label: 'SECONDS', value: timeLeft.seconds },
  ]

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-full">
      <Typography
        variant="h1"
        weight={600}
        className="mb-4 text-center text-transparent text-white sm:mb-24 sm:-mt-36 "
      >
        {title}
      </Typography>
      <div className="flex items-center justify-center w-full max-w-full gap-2 px-2 sm:gap-4 md:gap-6">
        {timeUnits.map((unit, index) => (
          <motion.div
            key={unit.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="flex flex-col items-center justify-center"
          >
            <div className="flex items-center justify-center w-16 h-16 bg-black border rounded-lg shadow-xl sm:w-20 sm:h-20 md:w-24 md:h-24 bg-opacity-80 border-yellow-500/30 shadow-yellow-500/20">
              <Typography variant="h2" weight={700} className="text-2xl text-yellow-500 sm:text-3xl md:text-4xl">
                {String(unit.value).padStart(2, '0')}
              </Typography>
            </div>
            <Typography weight={600} variant="xs" className="mt-1 sm:mt-2 text-white text-[10px] sm:text-sm ">
              {unit.label}
            </Typography>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
