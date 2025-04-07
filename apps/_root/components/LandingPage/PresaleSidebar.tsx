'use client'
import React, { useState, useEffect } from 'react'
import { Button, Typography } from '@dozer/ui'
import { motion } from 'framer-motion'
import { UserGroupIcon, ClockIcon } from '@heroicons/react/24/outline'
import { TimeLeft, formatCountdown, PRESALE_CONFIG } from '../../utils/presalePrice'
import { api } from '../../utils/api'

interface PresaleSidebarProps {
  totalDonations: number
  maxSupply: number
  progress: number
  priceChangeTimeUnits: Array<{ label: string; value: number }>
  onBuyClick: () => void
  currentPrice: number
  nextPriceStep?: number
  isPresaleActive: boolean
}

const EXPLORER_URL =
  'https://explorer.hathor.network/token_balances?sortBy=total&order=desc&token=0000018dc292fddc2ff6232c5802eaf8f1d2d89e357c512fcf1aaeddce4ed96d'

const useBackersCount = () => {
  const [backersCount, setBackersCount] = useState<number>(250) // Default fallback value
  const [isLoading, setIsLoading] = useState(true)

  // Use tRPC query instead of direct fetch
  const backersQuery = api.getPresale.getBackersCount.useQuery(undefined, {
    // Refetch every 5 minutes
    refetchInterval: 5 * 60 * 1000,
    // Don't refetch on window focus to reduce unnecessary calls
    refetchOnWindowFocus: false,
    onSuccess: (data) => {
      setBackersCount(data.backersCount)
      setIsLoading(false)
    },
    onError: () => {
      // Keep the current value on error
      setIsLoading(false)
    },
  })

  return { backersCount, isLoading }
}

const PresaleSidebar: React.FC<PresaleSidebarProps> = ({
  totalDonations,
  maxSupply,
  progress,
  priceChangeTimeUnits,
  onBuyClick,
  currentPrice,
  nextPriceStep,
  isPresaleActive,
}) => {
  const { backersCount, isLoading } = useBackersCount()
  const now = new Date()

  const handleBackersClick = () => {
    window.open(EXPLORER_URL, '_blank', 'noopener,noreferrer')
  }

  // Check if all time units are zero
  const isSaleEnded = priceChangeTimeUnits.every((unit) => unit.value === 0)

  // Check which phase we're in
  const isBeforeStart = now < PRESALE_CONFIG.START_DATE
  const isAfterEnd = now >= PRESALE_CONFIG.END_DATE
  const isInFinalPhase = isPresaleActive && now >= PRESALE_CONFIG.FINAL_INCREASE_DATE

  // Get appropriate countdown label based on current phase
  const getCountdownLabel = () => {
    if (isBeforeStart) return 'PRESALE STARTS IN'
    if (isAfterEnd) return 'PRESALE ENDED'
    if (isInFinalPhase) return 'PRESALE ENDS IN'
    return 'NEXT PRICE INCREASE IN'
  }

  return (
    <div className="flex flex-col w-full h-full bg-transparent">
      {/* Header section with enhanced typography */}
      <div className="p-5 mb-4">
        <Typography
          variant="h3"
          weight={800}
          className="text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 mb-1.5 tracking-tight"
        >
          {isPresaleActive ? 'BUY DZR PRESALE NOW!' : isSaleEnded ? 'PRESALE ENDED' : 'PRESALE COMING SOON'}
        </Typography>
        <div className="flex items-center justify-center">
          <div className="w-16 h-px mr-3 bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent"></div>
          <Typography variant="sm" className="text-xs tracking-widest text-center uppercase text-neutral-400">
            {isPresaleActive
              ? isInFinalPhase
                ? 'Final price - Ends soon!'
                : 'Before price increases'
              : isAfterEnd
              ? 'Thank you for participating'
              : 'Get ready'}
          </Typography>
          <div className="w-16 h-px ml-3 bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent"></div>
        </div>
      </div>

      {/* Main content with better spacing */}
      <div className="flex-grow px-5 space-y-8">
        {/* Countdown timer with enhanced design */}
        <div className="space-y-2">
          <Typography variant="xs" weight={600} className="tracking-widest text-center uppercase text-neutral-400">
            {getCountdownLabel()}
          </Typography>
          <div className="grid grid-cols-4 gap-3">
            {priceChangeTimeUnits.map((unit, index) => (
              <div key={unit.label} className="group">
                <div className="relative w-full aspect-square flex items-center justify-center bg-black/40 rounded-lg border border-yellow-500/20 overflow-hidden hover:border-yellow-500/50 transition-all duration-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_2px_4px_rgba(0,0,0,0.2)]">
                  <div className="absolute inset-0 transition-opacity bg-gradient-to-b from-yellow-500/5 via-transparent to-transparent opacity-60 group-hover:opacity-80"></div>
                  <div className="relative z-10 flex flex-col items-center">
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
        </div>

        {/* Subtle divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent"></div>

        {/* Backers count section with improved design */}
        <div
          onClick={handleBackersClick}
          className="flex items-center justify-between p-4 bg-black/30 rounded-lg hover:bg-black/40 transition-all duration-300 cursor-pointer group shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
        >
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 mr-3 rounded-full bg-yellow-500/10">
              <UserGroupIcon className="w-5 h-5 text-yellow-500 transition-colors group-hover:text-yellow-400" />
            </div>
            <Typography
              variant="sm"
              weight={600}
              className="transition-colors text-neutral-300 group-hover:text-neutral-200"
            >
              Total Backers
            </Typography>
          </div>
          <div className="px-3 py-1 rounded-full bg-black/40">
            <Typography
              variant="sm"
              weight={700}
              className="text-yellow-400 transition-colors group-hover:text-yellow-300"
            >
              {isLoading ? '...' : backersCount.toLocaleString()}
            </Typography>
          </div>
        </div>

        {/* Progress section with enhanced visuals */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Typography variant="sm" weight={600} className="text-xs tracking-wider uppercase text-neutral-400">
              {/* USDT  */}
              Raised
            </Typography>
            <Typography variant="base" weight={700} className="text-lg text-yellow-400">
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

          <div className="flex items-center justify-between">
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
          disabled={!isPresaleActive}
          className={`w-full py-4 font-extrabold tracking-wide rounded-lg transition-all duration-300 text-sm uppercase ${
            isPresaleActive
              ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-black hover:from-yellow-400 hover:to-amber-500 shadow-[0_4px_14px_rgba(234,179,8,0.25)] hover:shadow-[0_6px_20px_rgba(234,179,8,0.35)]'
              : 'bg-yellow-800 text-gray-400 border border-gray-700 shadow-inner hover:bg-gray-700'
          }`}
        >
          {isPresaleActive ? 'BUY WITH CRYPTO' : isAfterEnd ? 'PRESALE ENDED' : 'COMING SOON'}
        </Button>
      </div>
    </div>
  )
}

export default PresaleSidebar
