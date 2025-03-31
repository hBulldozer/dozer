'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { Button, Link, Typography } from '@dozer/ui'
import { CountdownTimer } from './CountdownTimer'
import { TokenCounter } from './TokenCounter'
import { PaymentSection } from './PaymentSection'
import { PriceIncrease } from './PriceIncrease'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

export const PresaleLanding: React.FC = () => {
  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-screen overflow-hidden bg-black text-white">
      {/* Simple gradient background instead of dynamic components */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-amber-950/10 to-black" />
      
      {/* Main content container */}
      <div className="relative z-20 flex flex-col items-center justify-center w-full max-w-7xl px-4 py-16 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center text-center mb-10"
        >
          <div className="inline-block mb-6">
            <div className="relative">
              <span className="absolute inset-0 flex items-center justify-center text-5xl md:text-7xl font-extrabold text-yellow-400 blur-[2px]">
                DOZER
              </span>
              <Typography 
                variant="h1" 
                weight={900} 
                className="relative text-5xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-br from-yellow-500 to-amber-700"
              >
                DOZER
              </Typography>
            </div>
          </div>
          
          <div className="relative">
            <Typography 
              variant="h2" 
              weight={700} 
              className="text-2xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-400"
            >
              FINAL PRESALE PHASE
            </Typography>
            {/* Simple stars effect instead of meteors */}
            <div className="absolute -top-10 -right-10 w-10 h-10 text-yellow-500">✨</div>
            <div className="absolute -bottom-10 -left-10 w-10 h-10 text-yellow-500">✨</div>
          </div>
          
          <Typography variant="lg" className="mt-6 max-w-xl text-neutral-300">
            Join the revolution in DeFi. The Dozer Donor Token (DZD) presale is ending soon.
            Don't miss your chance to be part of our journey from the beginning.
          </Typography>
          
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link.Internal href="/product" passHref>
              <Button 
                as="a" 
                size="lg" 
                variant="outlined"
                className="border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10"
              >
                Learn About Dozer
              </Button>
            </Link.Internal>
            <Link.External href="https://forms.gle/8cEKvsaNrTP4c8Ef6" passHref>
              <Button
                as="a"
                size="lg"
                className="bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-semibold hover:from-yellow-400 hover:to-amber-500 transition-all duration-300"
                endIcon={<ArrowRightIcon width={20} height={20} />}
              >
                Buy DZD Tokens
              </Button>
            </Link.External>
          </div>
        </motion.div>
        
        <div className="w-full grid grid-cols-1 gap-16 mt-10">
          {/* Countdown Timer */}
          <CountdownTimer />
          
          {/* Token Counter */}
          <TokenCounter />
          
          {/* Price Increase Schedule */}
          <PriceIncrease />
          
          {/* Payment Section */}
          <PaymentSection />
        </div>
        
        {/* Footer section */}
        <div className="w-full mt-20 pt-10 border-t border-yellow-500/20">
          <div className="flex flex-col items-center gap-4">
            <Typography variant="sm" className="text-neutral-400 text-center">
              DZD Token Sale | Final Phase Ending April 30, 2025
            </Typography>
            <div className="flex gap-4">
              <Link.External href="https://twitter.com/dozerfinance" className="text-neutral-400 hover:text-yellow-500">
                Twitter
              </Link.External>
              <Link.External href="https://t.me/dozerfinance" className="text-neutral-400 hover:text-yellow-500">
                Telegram
              </Link.External>
              <Link.External href="https://discord.gg/dozerfinance" className="text-neutral-400 hover:text-yellow-500">
                Discord
              </Link.External>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
