'use client'
import { Typography } from '@dozer/ui'
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export const TokenCounter: React.FC = () => {
  const [totalDonations, setTotalDonations] = useState(17800) // Default fallback value
  const [isLoading, setIsLoading] = useState(true)
  const maxSupply = 100000
  const tokensRemaining = maxSupply - totalDonations
  const progress = Math.min(Math.max((totalDonations / maxSupply) * 100, 0), 100)

  useEffect(() => {
    async function fetchDonationData() {
      try {
        setIsLoading(true)
        const response = await fetch(
          'explorer-service/node_api/token?id=0000018dc292fddc2ff6232c5802eaf8f1d2d89e357c512fcf1aaeddce4ed96d'
        )
        const data = await response.json()
        if (data.success) {
          setTotalDonations(Math.floor(data.total / 100))
        }
      } catch (error) {
        console.error('Error fetching donation data:', error)
        // Keep fallback value if fetch fails
      } finally {
        setIsLoading(false)
      }
    }

    fetchDonationData()
  }, [])

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-col space-y-4"
      >
        <div className="flex flex-col items-center justify-center mb-2">
          <Typography variant="h4" weight={600} className="mb-1 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">
            DZD TOKEN SALE
          </Typography>
          <Typography variant="lg" className="mb-1 text-center text-neutral-300">
            {isLoading ? "Loading..." : `${tokensRemaining.toLocaleString()} DZD tokens remaining`}
          </Typography>
          <Typography variant="sm" className="text-center text-neutral-400">
            Price: 1 DZD = 1 USDT
          </Typography>
        </div>

        <div className="relative h-6 w-full overflow-hidden rounded-full bg-gray-900 shadow-inner shadow-yellow-900/20">
          <div
            className="absolute inset-0 flex items-center rounded-full bg-gradient-to-r from-amber-500 to-yellow-500"
            style={{ width: `${isLoading ? 50 : progress}%` }}
          >
            {isLoading && (
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/50 to-yellow-500/50 animate-pulse"></div>
            )}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Typography variant="sm" weight={600} className="text-white drop-shadow-md">
              {isLoading ? "Loading..." : `${progress.toFixed(1)}% sold`}
            </Typography>
          </div>
        </div>

        <div className="flex justify-between text-sm text-neutral-400">
          <span>0 DZD</span>
          <span>{maxSupply.toLocaleString()} DZD</span>
        </div>
      </motion.div>
    </div>
  )
}
