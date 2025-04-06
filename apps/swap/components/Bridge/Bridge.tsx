import { FC, useState, useEffect, useRef } from 'react'
import { useAccount, useNetwork } from '@dozer/zustand'
import { Button, Widget, classNames, createSuccessToast, createErrorToast, createInfoToast } from '@dozer/ui'
import { useBridge, useWalletConnectClient } from '@dozer/higmi'
import { Token } from '@dozer/currency'
import Image from 'next/legacy/image'
import { ExclamationCircleIcon } from '@heroicons/react/24/solid'
import { WalletIcon } from '@heroicons/react/24/outline'
import { api } from 'utils/api'
import bridgeIcon from '../../public/bridge-icon.jpeg'
import { CurrencyInput } from '../CurrencyInput'
import { TradeType } from '../utils/TradeType'
import { nanoid } from 'nanoid'
import bridgeConfig from '@dozer/higmi/config/bridge'

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
  const [txStatus, setTxStatus] = useState<string>('idle')

  // Use a ref to track mounted state to avoid state updates after unmount
  const isMounted = useRef(true)

  const { connection, connectArbitrum, disconnectArbitrum, bridgeTokenToHathor } = useBridge()

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

  useEffect(() => {
    // Set the mounted ref to true
    isMounted.current = true

    // Add event listener for bridge transaction updates
    const handleBridgeTransactionUpdate = (event: CustomEvent) => {
      if (!isMounted.current) return

      const detail = event.detail
      console.log('Bridge transaction update received:', detail)

      if (detail.status === 'confirmed' && detail.success) {
        // Handle successful transaction confirmation
        setTransactionHash(detail.transactionHash || '')
        const msg = 'Transaction confirmed! Your tokens will be available in Hathor soon.'
        setSuccessMessage(msg)
        setIsProcessing(false)
        setTxStatus('idle')

        // Show success toast
        createSuccessToast({
          type: 'send',
          summary: {
            pending: 'Bridging tokens',
            completed: 'Transaction confirmed! Your tokens will be available in Hathor soon.',
            failed: 'Failed to bridge tokens',
          },
          txHash: detail.transactionHash || nanoid(),
          groupTimestamp: Date.now(),
          timestamp: Date.now(),
          href: detail.transactionHash ? `https://arbiscan.io/tx/${detail.transactionHash}` : undefined,
        })
      } else if (detail.status === 'failed') {
        // Handle failed transaction
        setIsProcessing(false)
        setTxStatus('idle')

        // Format error message to prevent line wrapping issues
        let errorMsg = detail.error || 'Transaction failed'
        if (errorMsg.includes('Transaction reverted')) {
          errorMsg = 'Transaction failed on blockchain.'
        } else if (errorMsg.includes('Transaction has been reverted by the EVM')) {
          errorMsg = 'Transaction failed on blockchain.'
        } else if (errorMsg.length > 100) {
          // Truncate long messages
          errorMsg = errorMsg.substring(0, 100) + '...'
        }

        setErrorMessage(errorMsg)

        // Show error toast
        createErrorToast(errorMsg, false)

        // If we have a transaction hash, also store it
        if (detail.transactionHash) {
          setTransactionHash(detail.transactionHash)
        }
      }
    }

    window.addEventListener('bridgeTransactionUpdate', handleBridgeTransactionUpdate as EventListener)

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

    // Clean up function - remove event listeners and set mounted ref to false
    return () => {
      isMounted.current = false
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('bridgeTransactionUpdate', handleBridgeTransactionUpdate as EventListener)
    }
  }, [])

  useEffect(() => {
    if (initialToken) {
      setSelectedToken(initialToken)
    }
  }, [initialToken])

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
    setTxStatus('processing')

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
      const result = await bridgeTokenToHathor(selectedToken.originalAddress || '', amount, hathorAddress).catch(
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

      // Check the transaction status and hash from the result
      const txHash = result.transactionHash || ''

      // Handle different transaction statuses
      if (result.status === 'approval_needed') {
        // Handle approval needed case - let the UI continue
        if (isMounted.current) {
          // Don't clear processing state, but update status message
          setTxStatus('approval')
        }
        return // Exit early without clearing processing flag
      } else if (result.status === 'confirming') {
        // Transaction submitted, waiting for confirmation
        if (isMounted.current) {
          setTransactionHash(txHash)
          setTxStatus('confirming')

          // Show a waiting toast
          createInfoToast({
            type: 'send',
            summary: {
              pending: 'Transaction submitted',
              completed: '',
              failed: '',
              info: 'Waiting for network confirmation...',
            },
            txHash: txHash || nanoid(),
            groupTimestamp: Date.now(),
            timestamp: Date.now(),
            href: txHash ? `https://arbiscan.io/tx/${txHash}` : undefined,
          })
        }
        return // Exit without clearing processing state
      }

      // If we get here, the transaction was confirmed successfully
      if (isMounted.current) {
        setTransactionHash(txHash)
        const msg = 'Transaction confirmed! Your tokens will be available in Hathor soon.'
        setSuccessMessage(msg)
        setIsProcessing(false)

        // Show success toast
        createSuccessToast({
          type: 'send',
          summary: {
            pending: 'Bridging tokens',
            completed: 'Transaction confirmed! Your tokens will be available in Hathor soon.',
            failed: 'Failed to bridge tokens',
          },
          txHash: txHash || nanoid(),
          groupTimestamp: Date.now(),
          timestamp: Date.now(),
          href: txHash ? `https://arbiscan.io/tx/${txHash}` : undefined,
        })
      }
    } catch (error: any) {
      clearTimeout(safetyTimeout)
      console.error('Bridge operation failed:', error)

      // Only update state if the component is still mounted
      if (isMounted.current) {
        // Reset the processing state
        setIsProcessing(false)
        setTxStatus('idle')

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
          errorMsg = 'Transaction cancelled by user.'
          isCancelled = true
        } else if (errorMsg.includes('Transaction timed out') || errorMsg.includes('timeout')) {
          errorMsg = 'Transaction timed out. Please try again.'
        } else if (errorMsg.includes('Transaction pending')) {
          errorMsg = 'Transaction still processing. Check MetaMask.'
        } else if (errorMsg.includes('Transaction reverted') || errorMsg.includes('has been reverted by the EVM')) {
          // Format error message to avoid line wrap problems
          errorMsg = 'Transaction failed on blockchain.'
        } else if (errorMsg.length > 100) {
          // Truncate very long messages
          errorMsg = errorMsg.substring(0, 100) + '...'
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
    setTxStatus('idle')
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

  // Specific handler for disconnect to prevent event propagation issues
  const handleDisconnect = (e: React.MouseEvent) => {
    // Stop event propagation to prevent any parent handlers from firing
    e.stopPropagation()
    e.preventDefault()

    console.log('Disconnect handler called')
    disconnectArbitrum()
  }

  return (
    <Widget id="bridge" maxWidth={400} className="shadow-2xl shadow-blue-900/20">
      <Widget.Content>
        <div className="px-4 py-4 font-medium border-b border-stone-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Arbitrum to Hathor Bridge</h2>
              <p className="text-gray-400 text-xs mt-1">Transfer tokens from Arbitrum to Hathor Network</p>
            </div>
            <div className="flex items-center">
              {connection.arbitrumConnected && connection.arbitrumAddress && (
                <div className="flex flex-col items-end">
                  <button
                    className="flex items-center bg-green-800/30 px-3 py-1.5 rounded-md border border-green-700 hover:bg-green-700/30 cursor-pointer transition-colors w-full"
                    onClick={handleDisconnect}
                    title="Click to disconnect"
                    type="button"
                  >
                    <div className="w-2 h-2 rounded-full bg-green-400 mr-2"></div>
                    <span className="text-xs text-green-300 font-medium truncate max-w-[100px]">
                      {connection.arbitrumAddress}
                    </span>
                  </button>
                  <span className="text-xs text-gray-500 mt-1">Connected to Arbitrum</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 bg-stone-800">
          {errorMessage && (
            <div className="p-3 mb-5 border border-red-600 rounded-lg bg-red-900/20">
              <div className="flex items-start">
                <ExclamationCircleIcon className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-red-300">{errorMessage}</span>
              </div>
            </div>
          )}

          {successMessage && transactionHash && (
            <div className="p-3 mb-5 border border-green-600 rounded-lg bg-green-900/20">
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
          <div className="mt-5 mb-5">
            <div className="p-3 border border-blue-600 rounded-lg bg-blue-800/20">
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

          <div className="mt-5">
            {!connection.arbitrumConnected ? (
              <div className="flex flex-col space-y-3">
                <Button
                  fullWidth
                  size="lg"
                  color="blue"
                  onClick={handleMetaMaskConnect}
                  className="flex items-center justify-center"
                >
                  <div className="w-5 h-5 mr-2 flex-shrink-0">
                    <svg viewBox="0 0 35 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M32.9582 1L19.8241 10.7183L22.2667 5.09968L32.9582 1Z"
                        fill="#E2761B"
                        stroke="#E2761B"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M2.03311 1L15.052 10.8031L12.7335 5.09968L2.03311 1Z"
                        fill="#E4761B"
                        stroke="#E4761B"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M28.2369 23.5334L24.7456 28.8961L32.2456 30.9307L34.4064 23.6607L28.2369 23.5334Z"
                        fill="#E4761B"
                        stroke="#E4761B"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M0.603516 23.6607L2.75325 30.9307L10.2532 28.8961L6.76198 23.5334L0.603516 23.6607Z"
                        fill="#E4761B"
                        stroke="#E4761B"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M9.84198 14.5149L7.73853 17.6837L15.179 18.0229L14.9244 10.0149L9.84198 14.5149Z"
                        fill="#E4761B"
                        stroke="#E4761B"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M25.1493 14.5149L20.0034 9.93065L19.8213 18.0229L27.2513 17.6837L25.1493 14.5149Z"
                        fill="#E4761B"
                        stroke="#E4761B"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M10.2534 28.8961L14.7578 26.7192L10.8598 23.7137L10.2534 28.8961Z"
                        fill="#E4761B"
                        stroke="#E4761B"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M20.2334 26.7192L24.7471 28.8961L24.1303 23.7137L20.2334 26.7192Z"
                        fill="#E4761B"
                        stroke="#E4761B"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span>Connect MetaMask</span>
                </Button>
                <p className="text-center text-xs text-gray-400">
                  Connect your Arbitrum wallet to start bridging tokens
                </p>
              </div>
            ) : (
              <Button
                fullWidth
                size="lg"
                color="blue"
                onClick={handleBridge}
                disabled={!selectedToken || !amount || isProcessing || !hathorAddress}
              >
                {isProcessing
                  ? txStatus === 'processing'
                    ? 'Processing...'
                    : txStatus === 'approval'
                    ? 'Waiting for Approval...'
                    : txStatus === 'confirming'
                    ? 'Confirming Transaction...'
                    : 'Processing...'
                  : 'Bridge Token'}
              </Button>
            )}

            {/* Add a cancel button when processing */}
            {isProcessing && (
              <Button fullWidth size="md" color="red" className="mt-3" onClick={handleCancel}>
                {txStatus === 'confirming' ? 'Close' : 'Cancel'}
              </Button>
            )}
          </div>
        </div>
      </Widget.Content>
    </Widget>
  )
}
