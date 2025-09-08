import React, { useState, useEffect, useCallback } from 'react'
import { Dialog, Typography } from '@dozer/ui'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useMetaMaskContext, useRequest, useRequestSnap, useInvokeSnap } from '@dozer/snap-utils'
import Image from 'next/image'
import { WalletIcon } from '@dozer/ui/icons'
import { useWalletConnectClient } from '../contexts'
import { WalletConnectionService } from '../../services/walletConnectionService'
import { useAccount } from '@dozer/zustand'

interface WalletSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onWalletConnect: () => void
  onMetaMaskConnect: (address: string) => void
}

export const WalletSelectionModal: React.FC<WalletSelectionModalProps> = ({
  isOpen,
  onClose,
  onWalletConnect,
  onMetaMaskConnect,
}) => {
  const { provider } = useMetaMaskContext()
  const request = useRequest()
  const requestSnap = useRequestSnap()
  const invokeSnap = useInvokeSnap()
  const { session, accounts, isWaitingApproval } = useWalletConnectClient()
  const walletService = WalletConnectionService.getInstance()
  const { targetNetwork } = useAccount()

  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStep, setConnectionStep] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [walletConnectTimeoutId, setWalletConnectTimeoutId] = useState<NodeJS.Timeout | null>(null)

  const resetState = useCallback(() => {
    setIsConnecting(false)
    setConnectionStep('')
    setError(null)
    if (walletConnectTimeoutId) {
      clearTimeout(walletConnectTimeoutId)
      setWalletConnectTimeoutId(null)
    }
  }, [walletConnectTimeoutId])

  useEffect(() => {
    if (isOpen) {
      resetState()
    }
  }, [isOpen, resetState])

  // Monitor WalletConnect session state
  useEffect(() => {
    // If we're connecting via WalletConnect and a session gets established
    if (isConnecting && connectionStep.includes('Hathor wallet') && session && accounts.length > 0) {
      const hathorAddress = accounts[0].split(':')[2]

      // Update the Zustand store with the wallet connection
      walletService.setWalletConnection({
        walletType: 'walletconnect',
        address: hathorAddress,
        hathorAddress: hathorAddress,
        isSnapInstalled: false,
        snapId: null,
        selectedNetwork: 'testnet',
      })

      // Connection was successful, close modal
      resetState()
      onClose()
    }
  }, [session, accounts, isConnecting, connectionStep, onClose, resetState, walletService])

  // Monitor WalletConnect waiting state - reset if user cancels
  useEffect(() => {
    // If we were connecting via WalletConnect but it's no longer waiting for approval
    // and we don't have a session, the user likely canceled
    if (isConnecting && connectionStep.includes('Hathor wallet') && !isWaitingApproval && !session) {
      setIsConnecting(false)
      setConnectionStep('')
      setError('Connection cancelled')

      // Clear timeout if exists
      if (walletConnectTimeoutId) {
        clearTimeout(walletConnectTimeoutId)
        setWalletConnectTimeoutId(null)
      }
    }
  }, [isConnecting, connectionStep, isWaitingApproval, session, walletConnectTimeoutId])

  const handleWalletConnectSelection = () => {
    setIsConnecting(true)
    setConnectionStep('Connecting to Hathor wallet...')
    setError(null)

    // Set a timeout for the connection attempt (60 seconds)
    const timeoutId = setTimeout(() => {
      setError('Connection timeout. Please ensure your Hathor wallet is ready and try again.')
      setIsConnecting(false)
      setConnectionStep('')
      setWalletConnectTimeoutId(null)
    }, 60000)

    setWalletConnectTimeoutId(timeoutId)

    try {
      onWalletConnect()
    } catch {
      setError('Failed to connect to Hathor wallet')
      setIsConnecting(false)
      if (timeoutId) {
        clearTimeout(timeoutId)
        setWalletConnectTimeoutId(null)
      }
    }
  }

  const handleMetaMaskSelection = async () => {
    if (!provider) {
      setError('MetaMask not detected. Please install MetaMask extension.')
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      // Use the enhanced connection service with detailed feedback
      const result = await walletService.connectMetaMaskSnapEnhanced(
        request, 
        requestSnap, 
        invokeSnap, 
        setConnectionStep // Pass setConnectionStep as status callback
      )

      if (result.success) {
        setConnectionStep('Connection successful!')

        // Success - notify parent component
        onMetaMaskConnect(result.hathorAddress)

        // Brief delay to show success message
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        throw new Error(result.error || 'Connection failed')
      }
    } catch (err) {
      console.error('MetaMask connection failed:', err)

      if (err instanceof Error) {
        // Handle user cancellation gracefully - don't show error message
        if (
          err.message.includes('User rejected') ||
          err.message.includes('User denied') ||
          err.message.includes('cancelled') ||
          err.message.includes('snap is null') ||
          err.message.includes('can\'t access property "id"') ||
          err.message.includes('User cancelled snap installation')
        ) {
          // User cancelled - just reset state without showing error
          setIsConnecting(false)
          setConnectionStep('')
          return
        } else if (err.message.includes('No MetaMask accounts')) {
          setError('No MetaMask accounts found. Please create or unlock your MetaMask wallet.')
        } else if (err.message.includes('Snap not found')) {
          setError('Hathor snap not available. Please ensure the snap is running on localhost:8089.')
        } else {
          setError(err.message)
        }
      } else {
        setError('An unexpected error occurred during connection')
      }
      setIsConnecting(false)
      setConnectionStep('')
    }
  }

  const handleClose = () => {
    // Allow closing and reset state even when connecting (user cancellation)
    resetState()
    onClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose}>
      <Dialog.Content className="max-w-md !pb-6">
        <Dialog.Header border={false} title="Connect Wallet" onClose={handleClose} className="mb-4" />

        <div className="space-y-6">
          <div className="text-center">
            <Typography variant="sm" className="text-gray-400">
              Choose how you'd like to connect to Dozer Protocol
            </Typography>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
              <Typography variant="sm" className="text-red-300">
                {error}
              </Typography>
            </div>
          )}

          {isConnecting && (
            <div className="flex items-center gap-3 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <Typography variant="sm" className="text-blue-300">
                {connectionStep || 'Connecting...'}
              </Typography>
            </div>
          )}

          <div className="space-y-3">
            {/* Hathor Wallet (WalletConnect) Option */}
            <button
              onClick={handleWalletConnectSelection}
              disabled={isConnecting}
              className="w-full p-4 bg-gradient-to-r from-amber-200/10 via-yellow-400/10 to-amber-300/10 
                         border border-amber-300/20 hover:border-amber-300/40 rounded-xl
                         transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-amber-400/20 rounded-lg flex items-center justify-center">
                  <WalletIcon width={24} height={24} className="text-amber-400" />
                </div>
                <div className="flex-1 text-left">
                  <Typography variant="base" className="font-semibold text-white group-hover:text-amber-100">
                    Hathor Wallet
                  </Typography>
                  <Typography variant="sm" className="text-gray-400 group-hover:text-gray-300">
                    Connect using WalletConnect with your Hathor mobile wallet
                  </Typography>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-amber-400 rounded-full" />
                </div>
              </div>
            </button>

            {/* MetaMask Snap Option */}
            <button
              onClick={handleMetaMaskSelection}
              disabled={isConnecting}
              className="w-full p-4 bg-gradient-to-r from-orange-200/10 via-orange-400/10 to-orange-300/10 
                         border border-orange-300/20 hover:border-orange-300/40 rounded-xl
                         transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-400/20 rounded-lg flex items-center justify-center">
                  <Image
                    src="/images/MetaMask-icon-fox.svg"
                    width={24}
                    height={24}
                    alt="MetaMask"
                    className="filter brightness-110"
                  />
                </div>
                <div className="flex-1 text-left">
                  <Typography variant="base" className="font-semibold text-white group-hover:text-orange-100">
                    MetaMask Snap
                  </Typography>
                  <Typography variant="sm" className="text-gray-400 group-hover:text-gray-300">
                    Connect using MetaMask with Hathor network snap
                  </Typography>
                </div>
                <div className="flex-shrink-0">
                  <div className={`w-2 h-2 rounded-full ${provider ? 'bg-orange-400' : 'bg-gray-500'}`} />
                </div>
              </div>
            </button>
          </div>

          {!provider && (
            <div className="flex items-center gap-2 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
              <ExclamationTriangleIcon className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <Typography variant="xs" className="text-yellow-300">
                MetaMask not detected.{' '}
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-400 hover:text-yellow-300 underline"
                >
                  Install MetaMask
                </a>{' '}
                to use the snap option.
              </Typography>
            </div>
          )}

          <div className="pt-4 border-t border-gray-700">
            <Typography variant="xs" className="text-gray-500 text-center">
              Both options provide secure access to Hathor network.
            </Typography>
          </div>
        </div>
      </Dialog.Content>
    </Dialog>
  )
}
