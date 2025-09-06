import React, { useState, useEffect } from 'react'
import { Dialog, Typography } from '@dozer/ui'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useMetaMaskContext, useRequest, useRequestSnap, useInvokeSnap } from '@dozer/snap-utils'
import Image from 'next/image'
import { WalletConnectIcon } from '@dozer/ui/icons'

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
  const { provider, setInstalledSnap, installedSnap } = useMetaMaskContext()
  const request = useRequest()
  const requestSnap = useRequestSnap()
  const invokeSnap = useInvokeSnap()

  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStep, setConnectionStep] = useState('')
  const [error, setError] = useState<string | null>(null)

  const resetState = () => {
    setIsConnecting(false)
    setConnectionStep('')
    setError(null)
  }

  useEffect(() => {
    if (isOpen) {
      resetState()
    }
  }, [isOpen])

  const handleWalletConnectSelection = () => {
    setIsConnecting(true)
    setConnectionStep('Connecting to Hathor wallet...')
    setError(null)

    try {
      onWalletConnect()
    } catch {
      setError('Failed to connect to Hathor wallet')
      setIsConnecting(false)
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
      // Step 1: Connect to MetaMask
      setConnectionStep('Connecting to MetaMask...')
      const accounts = (await request({ method: 'eth_requestAccounts' })) as string[]

      if (!accounts || accounts.length === 0) {
        throw new Error('No MetaMask accounts found')
      }

      // Step 2: Install Hathor snap
      setConnectionStep('Installing Hathor snap...')
      const snap = await requestSnap('local:http://localhost:8089')
      setInstalledSnap(snap)

      // Step 3: Switch to testnet network
      setConnectionStep('Switching to testnet...')
      await invokeSnap({
        snapId: snap.id,
        method: 'htr_changeNetwork',
        params: { newNetwork: 'testnet' },
      })

      // Step 4: Get Hathor address
      setConnectionStep('Getting Hathor address...')
      const result = await invokeSnap({
        snapId: snap.id,
        method: 'htr_getAddress',
        params: { type: 'index', index: 0 },
      })

      // Parse address response with proper error handling
      let hathorAddress = result
      if (typeof result === 'string') {
        try {
          const parsed = JSON.parse(result)
          hathorAddress = parsed?.response?.address || parsed?.address
        } catch {
          // If parsing fails, assume the string itself is the address
          hathorAddress = result
        }
      } else if (typeof result === 'object' && result !== null) {
        const resultObj = result as { response?: { address?: string }; address?: string }
        hathorAddress = resultObj?.response?.address || resultObj?.address
      }

      if (!hathorAddress) {
        throw new Error('Unable to retrieve Hathor address from snap')
      }

      // Success - notify parent component
      onMetaMaskConnect(hathorAddress as string)
      onClose()
    } catch (err) {
      console.error('MetaMask connection failed:', err)

      if (err instanceof Error) {
        if (err.message.includes('User rejected')) {
          setError('Connection cancelled by user')
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
    } finally {
      setIsConnecting(false)
      setConnectionStep('')
    }
  }

  const handleClose = () => {
    if (isConnecting) return // Prevent closing during connection
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
                  <WalletConnectIcon width={24} height={24} className="text-amber-400" />
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
              Both options provide secure access to Hathor network functionality
            </Typography>
          </div>
        </div>
      </Dialog.Content>
    </Dialog>
  )
}
