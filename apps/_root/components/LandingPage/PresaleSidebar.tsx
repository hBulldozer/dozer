'use client'
import React, { useState, useEffect } from 'react'
import { Button, Typography } from '@dozer/ui'
import { motion } from 'framer-motion'
import { UserGroupIcon } from '@heroicons/react/24/outline'

interface PresaleSidebarProps {
  totalDonations: number
  maxSupply: number
  progress: number
  priceChangeTimeUnits: Array<{ label: string; value: number }>
  onBuyClick: () => void
}

const EXPLORER_URL =
  'https://explorer.hathor.network/token_balances?sortBy=total&order=desc&token=0000018dc292fddc2ff6232c5802eaf8f1d2d89e357c512fcf1aaeddce4ed96d'

const useBackersCount = () => {
  const [backersCount, setBackersCount] = useState<number>(250) // Default fallback value
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchBackersCount = async () => {
      try {
        const response = await fetch(
          'explorer-service/node_api/token?id=0000018dc292fddc2ff6232c5802eaf8f1d2d89e357c512fcf1aaeddce4ed96d'
        )
        const data = await response.json()
        if (data.success) {
          // The API returns total addresses that hold the token
          setBackersCount(data.addresses_count || 250)
        }
      } catch (error) {
        console.error('Error fetching backers count:', error)
        // Keep the current value instead of setting fallback
      } finally {
        setIsLoading(false)
      }
    }

    fetchBackersCount()
    // Refresh every 5 minutes
    const interval = setInterval(fetchBackersCount, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return { backersCount, isLoading }
}

const PresaleSidebar: React.FC<PresaleSidebarProps> = ({
  totalDonations,
  maxSupply,
  progress,
  priceChangeTimeUnits,
  onBuyClick,
}) => {
  const { backersCount, isLoading } = useBackersCount()

  const handleBackersClick = () => {
    window.open(EXPLORER_URL, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="w-full h-full flex flex-col bg-transparent">
      {/* Header section with enhanced typography */}
      <div className="p-5 mb-4">
        <Typography
          variant="h3"
          weight={800}
          className="text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 mb-1.5 tracking-tight"
        >
          BUY DZR PRESALE NOW!
        </Typography>
        <div className="flex items-center justify-center">
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent mr-3"></div>
          <Typography variant="sm" className="text-center text-neutral-400 uppercase tracking-widest text-xs">
            Before price increases
          </Typography>
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent ml-3"></div>
        </div>
      </div>

      {/* Main content with better spacing */}
      <div className="flex-grow px-5 space-y-8">
        {/* Countdown timer with enhanced design */}
        <div className="grid grid-cols-4 gap-3">
          {priceChangeTimeUnits.map((unit, index) => (
            <div key={unit.label} className="group">
              <div className="relative w-full aspect-square flex items-center justify-center bg-black/40 rounded-lg border border-yellow-500/20 overflow-hidden hover:border-yellow-500/50 transition-all duration-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_2px_4px_rgba(0,0,0,0.2)]">
                <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                <div className="flex flex-col items-center relative z-10">
                  <Typography
                    variant="xl"
                    weight={700}
                    className="text-yellow-400 group-hover:text-yellow-300 transition-colors mb-0.5 text-3xl"
                  >
                    {String(unit.value).padStart(2, '0')}
                  </Typography>
                  <Typography
                    variant="xs"
                    className="text-neutral-500 font-medium uppercase tracking-wider text-[10px]"
                  >
                    {unit.label}
                  </Typography>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Subtle divider */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent"></div>

        {/* Backers count section with improved design */}
        <div
          onClick={handleBackersClick}
          className="flex items-center justify-between p-4 bg-black/30 rounded-lg hover:bg-black/40 transition-all duration-300 cursor-pointer group shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
        >
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center mr-3">
              <UserGroupIcon className="w-5 h-5 text-yellow-500 group-hover:text-yellow-400 transition-colors" />
            </div>
            <Typography
              variant="sm"
              weight={600}
              className="text-neutral-300 group-hover:text-neutral-200 transition-colors"
            >
              Total Backers
            </Typography>
          </div>
          <div className="bg-black/40 px-3 py-1 rounded-full">
            <Typography
              variant="sm"
              weight={700}
              className="text-yellow-400 group-hover:text-yellow-300 transition-colors"
            >
              {isLoading ? '...' : backersCount.toLocaleString()}
            </Typography>
          </div>
        </div>

        {/* Progress section with enhanced visuals */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Typography variant="sm" weight={600} className="text-neutral-400 uppercase tracking-wider text-xs">
              {/* USDT  */}
              Raised
            </Typography>
            <Typography variant="base" weight={700} className="text-yellow-400 text-lg">
              ${totalDonations.toLocaleString()}
            </Typography>
          </div>

          <div className="relative h-2.5 rounded-full bg-black/50 overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]">
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-500 to-amber-600 shadow-[0_0_10px_rgba(234,179,8,0.3)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
          </div>

          <div className="flex justify-between items-center">
            <Typography variant="xs" className="text-neutral-500">
              Progress
            </Typography>
            <Typography variant="xs" weight={600} className="text-neutral-400">
              <span className="text-yellow-400">{progress.toFixed(1)}%</span> of ${maxSupply.toLocaleString()}
            </Typography>
          </div>
        </div>
      </div>

      {/* Footer section with enhanced button */}
      <div className="p-5 mt-6">
        <Button
          onClick={onBuyClick}
          className="w-full py-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-extrabold tracking-wide rounded-lg hover:from-yellow-400 hover:to-amber-500 shadow-[0_4px_14px_rgba(234,179,8,0.25)] hover:shadow-[0_6px_20px_rgba(234,179,8,0.35)] transition-all duration-300 text-sm uppercase"
        >
          BUY WITH CRYPTO
        </Button>
      </div>
    </div>
  )
}

export default PresaleSidebar
