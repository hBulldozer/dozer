'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { Typography } from '@dozer/ui'

const priceStages = [
  { date: 'Apr 1-10', price: '$1.00', active: true },
  { date: 'Apr 11-20', price: '$1.10', active: false },
  { date: 'Apr 21-30', price: '$1.25', active: false },
]

export const PriceIncrease: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="flex flex-col items-center">
        <Typography
          variant="h3"
          weight={600}
          className="mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600"
        >
          PRICE INCREASE SCHEDULE
        </Typography>
        <Typography variant="base" className="mb-6 text-center text-neutral-300">
          DZD token price increases as the presale progresses
        </Typography>

        <div className="relative w-full mt-2">
          {/* Timeline connector */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-yellow-500/80 via-yellow-500/50 to-yellow-500/10" />

          {/* Timeline stages */}
          <div className="flex flex-col space-y-16">
            {priceStages.map((stage, index) => (
              <div key={index} className="relative flex items-center">
                {/* Timeline dot */}
                <div className="absolute left-1/2 transform -translate-x-1/2 w-5 h-5 rounded-full border-2 border-yellow-500 bg-black" />

                {/* Content boxes - alternate sides */}
                <div className={`flex w-full ${index % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                  <div className={`w-5/12 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                    <div
                      className={`p-4 rounded-lg border ${
                        stage.active
                          ? 'bg-gradient-to-br from-yellow-500/20 to-amber-600/10 border-yellow-500/50'
                          : 'bg-black/60 border-gray-700/30'
                      } shadow-md`}
                    >
                      <Typography variant="sm" weight={600} className="text-white">
                        {stage.date}
                      </Typography>
                      <Typography
                        variant="lg"
                        weight={700}
                        className={stage.active ? 'text-yellow-400' : 'text-gray-400'}
                      >
                        {stage.price}
                      </Typography>
                      {stage.active && (
                        <Typography variant="xs" className="text-green-400 mt-1">
                          Current Phase
                        </Typography>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
