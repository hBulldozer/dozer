'use client'
import React, { useState } from 'react'
import { Dialog, Typography, Button } from '@dozer/ui'
import { motion } from 'framer-motion'
import { CheckIcon } from '@heroicons/react/24/solid'
import { ChevronRightIcon } from '@heroicons/react/24/outline'

interface PresaleModalProps {
  isOpen: boolean
  onClose: () => void
}

const PresaleModal: React.FC<PresaleModalProps> = ({ isOpen, onClose }) => {
  // Track the current step in the process
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedNetwork, setSelectedNetwork] = useState<'solana' | 'evm' | null>(null)

  // Networks available for selection
  const networks = [
    {
      id: 'solana',
      name: 'Solana',
      description: 'Fast and cost-effective transactions',
      icon: '🌙', // Placeholder for Solana icon
    },
    {
      id: 'evm',
      name: 'EVM Networks',
      description: 'Compatible with Ethereum, BSC, Polygon, etc.',
      icon: '⚡', // Placeholder for EVM icon
    },
  ]

  // Handle network selection
  const handleNetworkSelect = (network: 'solana' | 'evm') => {
    setSelectedNetwork(network)
  }

  // Handle continue to next step
  const handleContinue = () => {
    // For now, just close the modal since we're only implementing the first step
    // Later this would advance to the next step
    onClose()
  }

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <Dialog.Content className="w-screen max-w-md bg-stone-950">
        <Dialog.Header title="Join the Dozer Presale" onClose={onClose} />
        
        {/* Step indicator */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-yellow-500/20">
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-6 h-6 text-black bg-yellow-500 rounded-full">
              <span className="text-xs font-bold">1</span>
            </div>
            <Typography variant="sm" weight={600} className="text-yellow-500">
              Select Network
            </Typography>
          </div>
          <div className="flex items-center space-x-2 opacity-40">
            <div className="flex items-center justify-center w-6 h-6 text-black bg-gray-500 rounded-full">
              <span className="text-xs font-bold">2</span>
            </div>
            <Typography variant="sm" weight={600} className="text-gray-500">
              Payment
            </Typography>
          </div>
        </div>

        {/* Step content */}
        <div className="flex flex-col p-6">
          <Typography variant="lg" weight={600} className="mb-4 text-neutral-300">
            Choose a Network
          </Typography>
          <Typography variant="sm" className="mb-6 text-neutral-400">
            Select the blockchain network you want to use for your USDT payment.
          </Typography>

          {/* Network options */}
          <div className="flex flex-col space-y-3 mb-8">
            {networks.map((network) => (
              <motion.div
                key={network.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleNetworkSelect(network.id as 'solana' | 'evm')}
                className={`relative flex items-center p-4 border rounded-lg cursor-pointer ${
                  selectedNetwork === network.id
                    ? 'border-yellow-500 bg-yellow-500/10'
                    : 'border-stone-700 hover:border-stone-500'
                }`}
              >
                <div className="flex-shrink-0 w-10 h-10 mr-4 text-2xl flex items-center justify-center bg-stone-800 rounded-full">
                  {network.icon}
                </div>
                <div className="flex-1">
                  <Typography variant="base" weight={600} className="text-white">
                    {network.name}
                  </Typography>
                  <Typography variant="xs" className="text-neutral-400">
                    {network.description}
                  </Typography>
                </div>
                {selectedNetwork === network.id && (
                  <div className="absolute flex items-center justify-center w-6 h-6 text-black bg-yellow-500 rounded-full -top-2 -right-2">
                    <CheckIcon className="w-4 h-4" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end pt-4 border-t border-stone-800">
            <Button
              size="lg"
              onClick={handleContinue}
              disabled={!selectedNetwork}
              className={`px-6 ${
                selectedNetwork
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-black'
                  : 'bg-stone-800 text-stone-500'
              }`}
              endIcon={<ChevronRightIcon width={20} height={20} />}
            >
              Continue
            </Button>
          </div>
        </div>
      </Dialog.Content>
    </Dialog>
  )
}

export default PresaleModal
