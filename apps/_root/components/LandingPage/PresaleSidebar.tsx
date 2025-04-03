'use client'
import React from 'react'
import { Button, Typography } from '@dozer/ui'
import { motion } from 'framer-motion'

interface PresaleSidebarProps {
  totalDonations: number
  maxSupply: number
  progress: number
  priceChangeTimeUnits: Array<{ label: string; value: number }>
  onBuyClick: () => void
}

const PresaleSidebar: React.FC<PresaleSidebarProps> = ({
  totalDonations,
  maxSupply,
  progress,
  priceChangeTimeUnits,
  onBuyClick,
}) => {
  return (
    <div className="w-full h-full border border-yellow-500/30 rounded-lg bg-black/40 p-4 shadow-lg">
      <Typography
        variant="h3"
        weight={700}
        className="text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 mb-4"
      >
        BUY $DZR PRESALE NOW!
      </Typography>

      {/* Countdown timer */}
      <Typography variant="sm" className="text-center text-neutral-400 mb-2">
        UNTIL NEXT PRICE INCREASE
      </Typography>
      <div className="flex justify-between mb-5 p-2 bg-black/60 rounded-lg">
        {priceChangeTimeUnits.map((unit, index) => (
          <div key={unit.label} className="flex flex-col items-center">
            <div className="w-12 h-12 flex items-center justify-center bg-black border rounded-md border-yellow-500/30">
              <Typography variant="lg" weight={700} className="text-yellow-500">
                {String(unit.value).padStart(2, '0')}
              </Typography>
            </div>
            <Typography variant="xs" className="mt-1 text-neutral-400">
              {unit.label}
            </Typography>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <Typography variant="xs" className="flex justify-between mb-1">
          <span className="text-neutral-400">USDT RAISED: ${totalDonations.toLocaleString()}</span>
          <span className="text-neutral-400">/${maxSupply.toLocaleString()}</span>
        </Typography>
        <div className="relative h-4 rounded-full bg-stone-950 border border-yellow-500/30 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-yellow-500 to-amber-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          ></motion.div>
        </div>
      </div>

      {/* Purchase button */}
      <Button
        onClick={onBuyClick}
        className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold hover:from-yellow-400 hover:to-amber-500"
      >
        BUY WITH CRYPTO
      </Button>
    </div>
  )
}

export default PresaleSidebar
