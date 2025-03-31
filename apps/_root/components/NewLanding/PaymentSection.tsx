'use client'
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button, Copy, Link, Typography } from '@dozer/ui'
import { ClipboardDocumentIcon } from '@heroicons/react/24/outline'

export const PaymentSection: React.FC = () => {
  const [selectedNetwork, setSelectedNetwork] = useState<'solana' | 'evm'>('solana')
  
  // Replace with actual addresses
  const addresses = {
    solana: 'BK6Yh1aQnX3fPNTbXmzvAFB12fwGYkEqLXq4JYbNrRjG',
    evm: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="flex flex-col space-y-6"
      >
        <div className="flex flex-col items-center justify-center">
          <Typography variant="h4" weight={600} className="mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">
            PAYMENT DETAILS
          </Typography>
          <Typography variant="base" className="mb-4 text-center text-neutral-300">
            Send USDT to the address below, then fill out the form to receive your DZD tokens
          </Typography>
        </div>

        <div className="flex flex-col space-y-4 p-6 rounded-xl bg-black bg-opacity-70 border border-yellow-500/20 shadow-lg shadow-yellow-500/10">
          <div className="flex justify-center gap-4 mb-2">
            <Button 
              size="sm"
              variant={selectedNetwork === 'solana' ? 'filled' : 'outlined'}
              onClick={() => setSelectedNetwork('solana')}
              className={selectedNetwork === 'solana' ? 'bg-yellow-500 text-black' : 'border-yellow-500/50 text-yellow-500'}
            >
              Solana
            </Button>
            <Button 
              size="sm"
              variant={selectedNetwork === 'evm' ? 'filled' : 'outlined'}
              onClick={() => setSelectedNetwork('evm')}
              className={selectedNetwork === 'evm' ? 'bg-yellow-500 text-black' : 'border-yellow-500/50 text-yellow-500'}
            >
              EVM (ETH, BSC, etc.)
            </Button>
          </div>

          <div className="flex flex-col space-y-2">
            <Typography variant="sm" weight={500} className="text-neutral-400">
              Send USDT to this address:
            </Typography>
            
            <div className="flex items-center p-3 bg-stone-900 rounded-lg overflow-hidden">
              <Typography variant="sm" className="flex-1 font-mono text-yellow-200 truncate">
                {addresses[selectedNetwork]}
              </Typography>
              <Copy className="flex-shrink-0 ml-2" text={addresses[selectedNetwork]}>
                <ClipboardDocumentIcon className="w-5 h-5 text-yellow-500 cursor-pointer hover:text-yellow-400" />
              </Copy>
            </div>
            
            <Typography variant="xs" className="text-red-400">
              Important: Only send USDT on the {selectedNetwork === 'solana' ? 'Solana' : 'EVM'} network!
            </Typography>
          </div>

          <div className="flex flex-col mt-4">
            <Typography variant="sm" weight={500} className="mb-2 text-neutral-300">
              After sending payment:
            </Typography>
            <Link.External href="https://forms.gle/8cEKvsaNrTP4c8Ef6" passHref>
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-semibold hover:from-yellow-400 hover:to-amber-500 transition-all duration-300"
              >
                Fill Out Form to Receive DZD
              </Button>
            </Link.External>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
