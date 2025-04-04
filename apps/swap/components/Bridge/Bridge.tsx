import { FC, useState, useEffect, useRef } from 'react'
import { useAccount, useNetwork } from '@dozer/zustand'
import { Button, Widget, classNames, createSuccessToast, createErrorToast, createInfoToast } from '@dozer/ui'
import { useBridge, useWalletConnectClient } from '@dozer/higmi'
import { Token } from '@dozer/currency'
import Image from 'next/legacy/image'
import { ExclamationCircleIcon } from '@heroicons/react/24/solid'
import { api } from 'utils/api'
import bridgeIcon from '../../public/bridge-icon.jpeg'
import { CurrencyInput } from '../CurrencyInput'
import { TradeType } from '../utils/TradeType'
import { nanoid } from 'nanoid'

interface BridgeProps {
  initialToken?: Token
}

export const Bridge: FC<BridgeProps> = ({ initialToken }) => {
  const network = useNetwork((state) => state.network)
  const { data: tokens } = api.getTokens.all.useQuery()
  const { data: prices } = api.getPrices.all.useQuery()
  const { accounts } = useWalletConnectClient() // Get accounts from WalletConnect

  const [selectedToken, setSelectedToken] = useState<Token | undefined>(initialToken)
  const [amount, setAmount] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [transactionHash, setTransactionHash] = useState<string>('')

  // Use a ref to track mounted state to avoid state updates after unmount
  const isMounted = useRef(true)

  const { connection, connectArbitrum, disconnectArbitrum, bridgeTokenToHathor, pendingClaims, loadPendingClaims } =
    useBridge()

  // Get hathorAddress from WalletConnect accounts
  const hathorAddress = accounts && accounts.length > 0 ? accounts[0].split(':')[2] : ''

  // Filter to only show bridged tokens
  const bridgedTokens = tokens
    ? tokens
        .filter((token) => token.bridged)
        .map((token) => {
          // Convert null to undefined for originalAddress
          const { originalAddress, ...rest } = token
          return new Token({
            ...rest,
            originalAddress: originalAddress || undefined,
          })
        })
    : []

  const navigateToClaims = () => {
    window.location.href = '/bridge/claims'
  }

  useEffect(() => {
    // Set the mounted ref to true
    isMounted.current = true

    // Add global error event listener to catch unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.log('Unhandled promise rejection:', event)

      // Check if this is a MetaMask transaction rejection
      if (
        event.reason &&
        (event.reason.message?.includes('MetaMask Tx Signature: User denied') ||
          event.reason.message?.includes('User denied transaction signature') ||
          event.reason.code === 4001)
      ) {
        console.log('Detected MetaMask transaction rejection via global handler')

        // Reset the processing state if component is still mounted
        if (isMounted.current) {
          setIsProcessing(false)
          setErrorMessage('Transaction cancelled: You rejected the request in MetaMask')

          // Show info toast for cancellation
          createInfoToast({
            type: 'send',
            summary: {
              pending: '',
              completed: '',
              failed: '',
              info: 'Transaction cancelled by user',
            },
            txHash: nanoid(),
            groupTimestamp: Date.now(),
            timestamp: Date.now(),
          })
        }
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // Clean up function - remove event listener and set mounted ref to false
    return () => {
      isMounted.current = false
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  useEffect(() => {
    if (initialToken) {
      setSelectedToken(initialToken)
    }
  }, [initialToken])

  // Remove the automatic loading of pending claims
  // Instead, we'll load them once on mount if connected and provide a refresh button
  useEffect(() => {
    // We'll use a ref to ensure we only load once on mount
    const hasLoaded = { current: false }

    if (connection.arbitrumConnected && !hasLoaded.current) {
      hasLoaded.current = true
      console.log('Loading claims once on mount')
      // Use silent mode to prevent console logs on initial load
      loadPendingClaims({ silent: true })
    }

    return () => {
      // Clean up function
    }
  }, []) // Empty dependency array means this runs once on mount

  // Check if MetaMask is already connected when the component mounts
  useEffect(() => {
    const checkMetaMaskConnection = async () => {
      if (window.ethereum) {
        try {
          // Check if MetaMask is already connected - will fail if not authorized
          const accounts = await window.ethereum.request({ method: 'eth_accounts' })
          if (accounts && accounts.length > 0) {
            // User has already authorized the app, connect silently
            await connectArbitrum()
          }
        } catch (error) {
          console.error('Error checking MetaMask connection:', error)
          // No need to show error - just means we need explicit connect
        }
      }
    }

    checkMetaMaskConnection()
  }, [connectArbitrum])

  const handleMetaMaskConnect = async () => {
    setErrorMessage('')
    try {
      await connectArbitrum()

      // Show success toast
      createSuccessToast({
        type: 'approval',
        summary: {
          pending: 'Connecting to MetaMask',
          completed: 'Connected to MetaMask',
          failed: 'Failed to connect to MetaMask',
        },
        txHash: nanoid(),
        groupTimestamp: Date.now(),
        timestamp: Date.now(),
      })
    } catch (error: any) {
      console.error('Failed to connect MetaMask:', error)
      const errorMsg = error.message || 'Failed to connect to MetaMask'
      setErrorMessage(errorMsg)

      // Show error toast
      createErrorToast(errorMsg, false)
    }
  }

  const handleBridge = async () => {
    // Reset state
    setErrorMessage('')
    setSuccessMessage('')
    setTransactionHash('')

    if (!selectedToken || !amount || !connection.arbitrumAddress) {
      const msg = 'Please connect your wallet, select a token, and enter an amount'
      setErrorMessage(msg)
      createErrorToast(msg, false)
      return
    }

    // Validate amount is a valid number
    const amountValue = parseFloat(amount)
    if (isNaN(amountValue) || amountValue <= 0) {
      const msg = 'Please enter a valid amount greater than 0'
      setErrorMessage(msg)
      createErrorToast(msg, false)
      return
    }

    // Validate Hathor address exists from context (WalletConnect)
    if (!hathorAddress) {
      const msg = 'Please connect your Hathor wallet first'
      setErrorMessage(msg)
      createErrorToast(msg, false)
      return
    }

    // Validate token has originalAddress
    if (!selectedToken.originalAddress) {
      const msg = 'This token cannot be bridged (missing original address)'
      setErrorMessage(msg)
      createErrorToast(msg, false)
      return
    }

    setIsProcessing(true)

    // Set a safety timeout to reset the processing state if nothing happens
    const safetyTimeout = setTimeout(() => {
      if (isMounted.current && isProcessing) {
        console.log('Safety timeout triggered, resetting processing state')
        setIsProcessing(false)
      }
    }, 60000) // 1 minute

    try {
      // Bridge from Arbitrum to Hathor - using hathorAddress from WalletConnect
      const hash = await bridgeTokenToHathor(selectedToken.originalAddress || '', amount, hathorAddress).catch(
        (error) => {
          clearTimeout(safetyTimeout)

          // Direct inspection of the error
          console.log('Caught error in bridgeTokenToHathor:', error)

          // Detailed logging of the error properties
          if (error) {
            console.log('Error code:', error.code)
            console.log('Error message:', error.message)
            console.log('Error name:', error.name)
            console.log('Error has code 4001:', error.code === 4001)

            // Log all error properties
            Object.keys(error).forEach((key) => {
              console.log(`Error[${key}]:`, error[key])
            })
          }

          // Specifically check for MetaMask rejection pattern
          if (
            error &&
            (error.code === 4001 ||
              (typeof error.message === 'string' &&
                (error.message.includes('MetaMask Tx Signature') ||
                  error.message.includes('User denied') ||
                  error.message.includes('User rejected') ||
                  error.message.includes('cancelled') ||
                  error.message.includes('canceled') ||
                  error.message.toLowerCase().includes('denied') ||
                  error.message.toLowerCase().includes('reject') ||
                  error.message.toLowerCase().includes('cancel'))))
          ) {
            console.log('Identified as a MetaMask rejection')
            throw new Error('Transaction cancelled: You rejected the request in MetaMask')
          }

          // Re-throw other errors
          throw error
        }
      )

      clearTimeout(safetyTimeout)

      // If we get here, the transaction was submitted successfully
      if (isMounted.current) {
        setTransactionHash(hash)
        const msg = 'Transaction submitted! Your tokens will be available in Hathor soon.'
        setSuccessMessage(msg)
        setIsProcessing(false)

        // Show success toast
        createSuccessToast({
          type: 'send',
          summary: {
            pending: 'Bridging tokens',
            completed: 'Transaction submitted! Your tokens will be available in Hathor soon.',
            failed: 'Failed to bridge tokens',
          },
          txHash: hash || nanoid(),
          groupTimestamp: Date.now(),
          timestamp: Date.now(),
          href: hash ? `https://arbiscan.io/tx/${hash}` : undefined,
        })
      }
    } catch (error: any) {
      clearTimeout(safetyTimeout)
      console.error('Bridge operation failed:', error)

      // Only update state if the component is still mounted
      if (isMounted.current) {
        // Reset the processing state
        setIsProcessing(false)

        // Set appropriate error message
        let errorMsg = error.message || 'Bridge operation failed'
        let isCancelled = false

        // Check for various cancellation patterns
        if (
          error.code === 4001 ||
          errorMsg.includes('Transaction cancelled') ||
          errorMsg.includes('User denied') ||
          errorMsg.includes('User rejected') ||
          errorMsg.includes('MetaMask Tx Signature')
        ) {
          errorMsg = 'Transaction cancelled: You rejected the request in MetaMask'
          isCancelled = true
        } else if (errorMsg.includes('Transaction timed out') || errorMsg.includes('timeout')) {
          errorMsg = 'Transaction timed out: The transaction is taking too long. Please try again.'
        } else if (errorMsg.includes('Transaction pending')) {
          errorMsg = 'Your transaction is still processing. Please check MetaMask for status.'
        }

        setErrorMessage(errorMsg)

        // Show the appropriate toast notification
        if (isCancelled) {
          createInfoToast({
            type: 'send',
            summary: {
              pending: '',
              completed: '',
              failed: '',
              info: 'Transaction cancelled by user',
            },
            txHash: nanoid(),
            groupTimestamp: Date.now(),
            timestamp: Date.now(),
          })
        } else {
          createErrorToast(errorMsg, false)
        }
      }
    }
  }

  // Function to handle user cancellation in the UI
  const handleCancel = () => {
    setIsProcessing(false)
    const msg = 'Transaction cancelled by user'
    setErrorMessage(msg)

    // Show info toast
    createInfoToast({
      type: 'send',
      summary: {
        pending: '',
        completed: '',
        failed: '',
        info: 'Transaction cancelled by user',
      },
      txHash: nanoid(),
      groupTimestamp: Date.now(),
      timestamp: Date.now(),
    })
  }

  // New function to manually refresh pending claims
  const handleRefreshClaims = () => {
    if (connection.arbitrumConnected) {
      // When manually refreshing, we want to see logs
      loadPendingClaims({ force: true })

      // Optional: show a toast notification
      createInfoToast({
        type: 'approval',
        summary: {
          pending: '',
          completed: '',
          failed: '',
          info: 'Refreshed pending claims',
        },
        txHash: nanoid(),
        groupTimestamp: Date.now(),
        timestamp: Date.now(),
      })
    }
  }

  return (
    <Widget id="bridge" maxWidth={400}>
      <Widget.Content>
        <div className="p-3 pb-4 font-medium">
          <div className="flex items-center justify-between">
            <span className="text-xl font-semibold">Arbitrum → Hathor Bridge</span>
            <div className="flex items-center">
              <Image src={bridgeIcon} width={24} height={24} alt="Bridge" className="object-cover rounded-full" />
            </div>
          </div>
        </div>

        <div className="p-3 bg-stone-800">
          {errorMessage && (
            <div className="p-3 mb-4 border border-red-600 rounded-lg bg-red-900/20">
              <div className="flex items-start">
                <ExclamationCircleIcon className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-red-300">{errorMessage}</span>
              </div>
            </div>
          )}

          {successMessage && transactionHash && (
            <div className="p-3 mb-4 border border-green-600 rounded-lg bg-green-900/20">
              <p className="mb-2 text-sm text-green-300">{successMessage}</p>
              <p className="text-xs text-green-400">
                Transaction: {transactionHash.substring(0, 10)}...
                {transactionHash.substring(transactionHash.length - 10)}
              </p>
            </div>
          )}

          <CurrencyInput
            id={'bridge-token-input'}
            className="p-3"
            value={amount}
            onChange={setAmount}
            currency={selectedToken}
            onSelect={setSelectedToken}
            chainId={network}
            inputType={TradeType.EXACT_INPUT}
            tradeType={TradeType.EXACT_INPUT}
            prices={prices || {}}
            tokens={bridgedTokens}
          />

          {/* Inform user about using WalletConnect's Hathor address */}
          <div className="mt-4 mb-4">
            <div className="p-2 border border-blue-600 rounded-lg bg-blue-800/20">
              <p className="text-xs text-blue-300">
                {hathorAddress
                  ? `Your tokens will be sent to your connected Hathor wallet: ${hathorAddress.substring(
                      0,
                      10
                    )}...${hathorAddress.substring(hathorAddress.length - 5)}`
                  : 'Please connect your Hathor wallet first'}
              </p>
            </div>
          </div>

          <div className="mt-4">
            {!connection.arbitrumConnected ? (
              <Button fullWidth size="md" color="blue" onClick={handleMetaMaskConnect}>
                Connect MetaMask
              </Button>
            ) : (
              <Button
                fullWidth
                size="md"
                color="blue"
                onClick={handleBridge}
                disabled={!selectedToken || !amount || isProcessing || !hathorAddress}
              >
                {isProcessing ? 'Processing...' : 'Bridge Token'}
              </Button>
            )}

            {/* Add a cancel button when processing */}
            {isProcessing && (
              <Button fullWidth size="sm" color="red" className="mt-2" onClick={handleCancel}>
                Cancel
              </Button>
            )}
          </div>

          {pendingClaims.length > 0 && (
            <div className="p-3 mt-4 border border-yellow-600 rounded-lg bg-yellow-900/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-yellow-500">Pending Claims</h3>
                <button onClick={handleRefreshClaims} className="text-xs text-yellow-400 hover:text-yellow-300">
                  Refresh
                </button>
              </div>
              <p className="text-xs text-yellow-300">You have {pendingClaims.length} pending claim(s) available.</p>
              <Button fullWidth size="sm" color="yellow" className="mt-2" onClick={navigateToClaims}>
                View Claims
              </Button>
            </div>
          )}

          {pendingClaims.length === 0 && connection.arbitrumConnected && (
            <div className="p-3 mt-4 border border-stone-600 rounded-lg bg-stone-800/50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-stone-400">No Pending Claims</h3>
                <button onClick={handleRefreshClaims} className="text-xs text-blue-400 hover:text-blue-300">
                  Check for Claims
                </button>
              </div>
              <p className="text-xs text-stone-500">You don't have any pending claims right now.</p>
            </div>
          )}
        </div>
      </Widget.Content>
    </Widget>
  )
}
