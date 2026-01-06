import React, { useState, useEffect, useCallback } from 'react'
import { Dialog, Typography } from '@dozer/ui'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
// @ts-expect-error - Hathor Snap Utils is not typed
import { useMetaMaskContext, useRequest, useInvokeSnap } from '@hathor/snap-utils'
import Image from 'next/image'
import { WalletIcon } from '@dozer/ui/icons'
import { useWalletConnectClient, isMobileDevice } from '../contexts'
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
  const invokeSnap = useInvokeSnap('npm:@hathor/snap')
  const { session, accounts, isWaitingApproval } = useWalletConnectClient()
  const walletService = WalletConnectionService.getInstance()

  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStep, setConnectionStep] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [walletConnectTimeoutId, setWalletConnectTimeoutId] = useState<NodeJS.Timeout | null>(null)
  const [walletConnectMinTimeout, setWalletConnectMinTimeout] = useState<NodeJS.Timeout | null>(null)

  // Separate state to control button disable - enforces a minimum 10-second disable period
  const [isButtonDisabled, setIsButtonDisabled] = useState(false)

  // Detect if user is on mobile device
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    setIsMobile(isMobileDevice())
  }, [])

  const resetState = useCallback(() => {
    setIsConnecting(false)
    setConnectionStep('')
    setError(null)
    setIsButtonDisabled(false)
    if (walletConnectTimeoutId) {
      clearTimeout(walletConnectTimeoutId)
      setWalletConnectTimeoutId(null)
    }
    if (walletConnectMinTimeout) {
      clearTimeout(walletConnectMinTimeout)
      setWalletConnectMinTimeout(null)
    }
  }, [walletConnectTimeoutId, walletConnectMinTimeout])

  useEffect(() => {
    // Only reset state when modal is first opened (isOpen changes from false to true)
    // Don't reset when other dependencies change
    if (isOpen) {
      resetState()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Monitor WalletConnect session state - ONLY for closing modal on success
  useEffect(() => {
    // If we're connecting via WalletConnect and a session gets established
    if (session && accounts.length > 0 && isConnecting && connectionStep.includes('Hathor wallet')) {
      const hathorAddress = accounts[0].split(':')[2]

      // Update the Zustand store with the wallet connection
      walletService.setWalletConnection({
        walletType: 'walletconnect',
        address: hathorAddress,
        hathorAddress: hathorAddress,
        isSnapInstalled: false,
        snapId: null,
        // Don't set selectedNetwork here - it's controlled by environment config
      })

      // Connection was successful, clear all timeouts and close modal
      if (walletConnectTimeoutId) {
        clearTimeout(walletConnectTimeoutId)
        setWalletConnectTimeoutId(null)
      }
      if (walletConnectMinTimeout) {
        clearTimeout(walletConnectMinTimeout)
        setWalletConnectMinTimeout(null)
      }

      resetState()
      onClose()
    }
  }, [session, accounts, isConnecting, connectionStep, onClose, resetState, walletService, walletConnectTimeoutId, walletConnectMinTimeout])

  const handleWalletConnectSelection = () => {
    // Prevent double-clicks - if already disabled, do nothing
    if (isButtonDisabled) {
      return
    }

    // Immediately disable button and show loading
    setIsButtonDisabled(true)
    setIsConnecting(true)
    setConnectionStep('Connecting to Hathor wallet...')
    setError(null)

    // Set a minimum timeout of 10 seconds to prevent double-clicks
    // Button stays disabled and loading message shows for the full 10 seconds
    const minTimeoutId = setTimeout(() => {
      setIsButtonDisabled(false)
      setIsConnecting(false)
      setConnectionStep('')
      setWalletConnectMinTimeout(null)
    }, 10000)

    setWalletConnectMinTimeout(minTimeoutId)

    // Set a maximum timeout for the connection attempt (60 seconds)
    const maxTimeoutId = setTimeout(() => {
      setError('Connection timeout. Please ensure your Hathor wallet is ready and try again.')
      setIsConnecting(false)
      setConnectionStep('')
      setIsButtonDisabled(false)
      setWalletConnectTimeoutId(null)
    }, 60000)

    setWalletConnectTimeoutId(maxTimeoutId)

    // Trigger the wallet connect flow
    try {
      onWalletConnect()
    } catch (err) {
      console.error('Failed to initiate WalletConnect:', err)
      setError('Failed to connect to Hathor wallet')
      // Don't clear states on error - let the 10 second timer handle it
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
          setError('Hathor snap not available. Please install the snap from the MetaMask Snap directory.')
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
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-red-900/20 border-red-500/30">
              <ExclamationTriangleIcon className="flex-shrink-0 w-5 h-5 text-red-400" />
              <Typography variant="sm" className="text-red-300">
                {error}
              </Typography>
            </div>
          )}

          {isConnecting && (
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-blue-900/20 border-blue-500/30">
              <div className="flex-shrink-0 w-5 h-5 border-2 border-blue-400 rounded-full animate-spin border-t-transparent" />
              <Typography variant="sm" className="text-blue-300">
                {connectionStep || 'Connecting...'}
              </Typography>
            </div>
          )}

          <div className="space-y-3">
            {/* Hathor Wallet (WalletConnect) Option */}
            <button
              onClick={handleWalletConnectSelection}
              disabled={isButtonDisabled || isConnecting}
              className="w-full p-4 transition-all duration-200 border bg-gradient-to-r rounded-xl from-amber-200/10 via-yellow-400/10 to-amber-300/10 border-amber-300/20 hover:border-amber-300/40 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 rounded-lg bg-amber-400/20">
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
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                </div>
              </div>
            </button>

            {/* MetaMask Snap Option - Desktop only */}
            <button
              onClick={handleMetaMaskSelection}
              disabled={isButtonDisabled || isConnecting || isMobile}
              className="w-full p-4 transition-all duration-200 border bg-gradient-to-r rounded-xl from-orange-200/10 via-orange-400/10 to-orange-300/10 border-orange-300/20 hover:border-orange-300/40 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 rounded-lg bg-orange-400/20">
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
                    {isMobile ? 'Desktop browser only' : 'Connect using MetaMask with Hathor network snap'}
                  </Typography>
                </div>
                <div className="flex-shrink-0">
                  <div className={`w-2 h-2 rounded-full ${provider && !isMobile ? 'bg-orange-400' : 'bg-gray-500'}`} />
                </div>
              </div>
            </button>
          </div>

          {!provider && !isMobile && (
            <div className="flex items-center gap-2 p-3 border rounded-lg bg-yellow-900/20 border-yellow-500/30">
              <ExclamationTriangleIcon className="flex-shrink-0 w-4 h-4 text-yellow-400" />
              <Typography variant="xs" className="text-yellow-300">
                MetaMask not detected.{' '}
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-400 underline hover:text-yellow-300"
                >
                  Install MetaMask
                </a>{' '}
                to use the snap option.
              </Typography>
            </div>
          )}

          <div className="pt-4 border-t border-gray-700">
            <Typography variant="xs" className="text-center text-gray-500">
              Both options provide secure access to Hathor network.
            </Typography>
          </div>
        </div>
      </Dialog.Content>
    </Dialog>
  )
}
