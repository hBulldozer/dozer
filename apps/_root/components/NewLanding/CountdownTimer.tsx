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

export const CountdownTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    const endDate = new Date('April 30, 2025 23:59:59').getTime()

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
  }, [])

  const timeUnits = [
    { label: 'DAYS', value: timeLeft.days },
    { label: 'HOURS', value: timeLeft.hours },
    { label: 'MINUTES', value: timeLeft.minutes },
    { label: 'SECONDS', value: timeLeft.seconds },
  ]

  return (
    <div className="flex flex-col items-center justify-center">
      <Typography 
        variant="h4" 
        weight={600} 
        className="mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600"
      >
        FINAL PHASE ENDS IN
      </Typography>
      <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
        {timeUnits.map((unit, index) => (
          <motion.div
            key={unit.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="flex flex-col items-center justify-center"
          >
            <div className="flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-black bg-opacity-80 rounded-lg border border-yellow-500/30 shadow-xl shadow-yellow-500/20">
              <Typography variant="h2" weight={700} className="text-yellow-500">
                {String(unit.value).padStart(2, '0')}
              </Typography>
            </div>
            <Typography variant="xs" className="mt-2 text-neutral-400">
              {unit.label}
            </Typography>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
