import { FC, useState, useEffect, useRef } from 'react'
import { useAccount, useNetwork } from '@dozer/zustand'
import {
  Button,
  Widget,
  classNames,
  createSuccessToast,
  createErrorToast,
  createInfoToast,
  Typography,
} from '@dozer/ui'
import { useBridge, useWalletConnectClient } from '@dozer/higmi'
import { Token } from '@dozer/currency'
import Image from 'next/legacy/image'
import { ExclamationCircleIcon } from '@heroicons/react/24/solid'
import { api } from 'utils/api'
import bridgeIcon from '../../public/bridge-icon.jpeg'
import { BridgeCurrencyInput } from '../BridgeCurrencyInput'
import { TradeType } from '../utils/TradeType'
import { nanoid } from 'nanoid'
import bridgeConfig from '@dozer/higmi/config/bridge'
import { MetaMaskConnect } from '../MetaMaskConnect'
import { useSDK } from '@metamask/sdk-react'
import { BridgeStepper } from './BridgeStepper'
import { useBridgeTransactionStore } from '@dozer/zustand'

interface BridgeProps {
  initialToken?: Token
}

export const Bridge: FC<BridgeProps> = ({ initialToken }) => {
  const network = useNetwork((state) => state.network)
  const { data: tokens } = api.getTokens.all.useQuery()
  const { data: prices } = api.getPrices.all.useQuery()
  const { accounts } = useWalletConnectClient() // Get accounts from WalletConnect
  const { connected: metaMaskConnected, account: metaMaskAccount, sdk } = useSDK()

  // Get wallet connection info from Zustand store - this has the unified Hathor address
  // for both WalletConnect and MetaMask Snap connections
  const { walletType, isSnapInstalled, hathorAddress: hathorAddressFromStore, addNotification } = useAccount()

  const [selectedToken, setSelectedToken] = useState<Token | undefined>(initialToken)
  const [amount, setAmount] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [transactionHash, setTransactionHash] = useState<string>('')
  const [txStatus, setTxStatus] = useState<string>('idle')
  const [showStepper, setShowStepper] = useState(false)

  // Use Zustand store for bridge transaction state
  const {
    // State
    isActive: isBridgeActive,
    steps,
    currentStep,
    isDismissed,
    tokenSymbol: storedTokenSymbol,

    // Actions
    startBridge,
    updateStep,
    setApprovalTxHash,
    setBridgeTxHash,
    setEvmConfirmationTime,
    setHathorReceipt,
    dismissTransaction,
    clearTransaction,
    restoreTransaction,
  } = useBridgeTransactionStore()

  // Use a ref to track mounted state to avoid state updates after unmount
  const isMounted = useRef(true)

  // Store timeout and interval refs to clear them when needed
  const evmTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const evmIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Track if we've already created the bridge notification to avoid duplicates
  const bridgeNotificationCreated = useRef(false)

  const { bridgeTokenToHathor } = useBridge()

  // Use the unified Hathor address from Zustand store
  // This works for both WalletConnect and MetaMask Snap connections
  const hathorAddress = hathorAddressFromStore || ''

  // Debug logging to help verify connection state
  useEffect(() => {
    console.log('Bridge Connection State:', {
      walletType,
      hathorAddress,
      metaMaskConnected,
      metaMaskAccount,
      isSnapInstalled,
    })
  }, [walletType, hathorAddress, metaMaskConnected, metaMaskAccount, isSnapInstalled])

  // Function to poll for EVM transaction confirmation
  const startEvmConfirmationPolling = async (txHash: string) => {
    const getWeb3Provider = async () => {
      const Web3 = (await import('web3')).default

      // First try window.ethereum (browser extension or injected provider)
      if (window.ethereum) {
        return new Web3(window.ethereum)
      }

      // Fallback to public RPC for read-only operations like getting transaction receipts
      // This is more reliable for native app scenarios since we only need to read transaction status

      // Import bridge config to get the correct RPC URL
      const bridgeConfig = (await import('@dozer/higmi/config/bridge')).default
      const publicRpcUrl = bridgeConfig.ethereumConfig.rpcUrl
      return new Web3(publicRpcUrl)
    }

    const checkConfirmation = async () => {
      try {
        const web3 = await getWeb3Provider()
        if (!web3) {
          return false // Keep polling
        }

        const receipt = await web3.eth.getTransactionReceipt(txHash)

        if (receipt && receipt.status) {
          // Transaction confirmed successfully

          if (isMounted.current) {
            setIsProcessing(false)

            const confirmationTime = Math.floor(Date.now() / 1000)

            // Update stepper - EVM confirmation complete, now checking Hathor
            // Ensure all previous steps are completed before moving to final step
            updateStep('processing', 'completed')
            updateStep('approval', 'completed')
            updateStep('approval-confirmed', 'completed')
            updateStep('bridge-tx', 'completed')
            updateStep('evm-confirming', 'completed', txHash)
            updateStep('hathor-received', 'completed') // Mark as completed immediately
            setEvmConfirmationTime(confirmationTime)

            // Clear timeout since we're done
            if (evmTimeoutRef.current) {
              clearTimeout(evmTimeoutRef.current)
              evmTimeoutRef.current = null
            }

            // Show simple success toast for EVM confirmation
            // The notification in the notification center will continue polling for Hathor confirmation
            const bridgeConfig = (await import('@dozer/higmi/config/bridge')).default
            createSuccessToast({
              type: 'bridge',
              summary: {
                pending: '',
                completed: `Bridge transaction confirmed on Arbitrum! Check the notification center for Hathor confirmation status.`,
                failed: '',
              },
              txHash: nanoid(),
              groupTimestamp: Date.now(),
              timestamp: Date.now(),
              href: `${bridgeConfig.ethereumConfig.explorer}/tx/${txHash}`,
            })
          }
          return true // Stop polling
        } else if (receipt && !receipt.status) {
          // Transaction failed
          if (isMounted.current) {
            updateStep('evm-confirming', 'failed', undefined, 'Transaction failed on blockchain')
            setIsProcessing(false)
            setErrorMessage('Transaction failed on blockchain')
            createErrorToast('Transaction failed on blockchain', false)
          }
          return true // Stop polling
        }

        // No receipt yet, keep polling
        return false // Keep polling
      } catch (error) {
        // For network errors or provider issues, keep polling
        return false // Keep polling
      }
    }

    // Initial check with a small delay to allow provider to stabilize
    setTimeout(async () => {
      const done = await checkConfirmation()
      if (done) {
        return
      }

      // Start polling every 5 seconds
      evmIntervalRef.current = setInterval(async () => {
        const done = await checkConfirmation()
        if (done && evmIntervalRef.current) {
          clearInterval(evmIntervalRef.current)
          evmIntervalRef.current = null
        }
      }, 5000)

      // Cleanup timeout after 10 minutes
      evmTimeoutRef.current = setTimeout(() => {
        if (evmIntervalRef.current) {
          clearInterval(evmIntervalRef.current)
          evmIntervalRef.current = null
        }
        if (isMounted.current) {
          updateStep('evm-confirming', 'failed', undefined, 'Transaction confirmation timed out')
          setErrorMessage('Transaction confirmation timed out. Please check your transaction manually.')
        }
        evmTimeoutRef.current = null
      }, 10 * 60 * 1000)
    }, 2000) // 2 second delay to allow app switching and provider stabilization
  }

  // Filter to only show bridged tokens
  const bridgedTokens = tokens
    ? tokens
        .filter((token) => token.bridged)
        .map((token) => {
          // Convert null values to undefined for correct Token initialization
          const { originalAddress, sourceChain, targetChain, imageUrl, ...rest } = token
          return new Token({
            ...rest,
            originalAddress: originalAddress || undefined,
            sourceChain: sourceChain || undefined,
            targetChain: targetChain || undefined,
            imageUrl: imageUrl || undefined,
          })
        })
    : []

  useEffect(() => {
    // Set the mounted ref to true
    isMounted.current = true

    // Add event listeners for real-time bridge progress
    const handleApprovalStarted = (event: CustomEvent) => {
      updateStep('approval', 'active')
    }

    const handleApprovalSent = (event: CustomEvent) => {
      setApprovalTxHash(event.detail.txHash)
      updateStep('approval', 'completed', event.detail.txHash)
      updateStep('approval-confirmed', 'active', event.detail.txHash)
    }

    const handleApprovalConfirmed = (event: CustomEvent) => {
      updateStep('approval-confirmed', 'completed', event.detail.txHash)
      updateStep('bridge-tx', 'active')
    }

    const handleBridgeTransactionSent = async (event: CustomEvent) => {
      const txHash = event.detail.txHash
      setBridgeTxHash(txHash)
      updateStep('bridge-tx', 'completed', txHash)
      updateStep('evm-confirming', 'active', txHash)

      // Create notification immediately when bridge tx is sent
      // This allows users to track the transaction even if they navigate away
      if (!bridgeNotificationCreated.current) {
        bridgeNotificationCreated.current = true

        const bridgeConfig = (await import('@dozer/higmi/config/bridge')).default

        // Create notification data for the notification center
        const notificationData = {
          type: 'bridge' as const,
          summary: {
            pending: `Bridging ${selectedToken?.symbol || 'tokens'} to Hathor network`,
            completed: `Bridge complete! ${selectedToken?.symbol || 'Tokens'} received on Hathor network.`,
            failed: 'Bridge transaction failed',
          },
          txHash: txHash,
          groupTimestamp: Math.floor(Date.now() / 1000),
          timestamp: Math.floor(Date.now() / 1000),
          promise: new Promise((resolve) => setTimeout(resolve, 500)),
          account: hathorAddress,
          href: `${bridgeConfig.ethereumConfig.explorer}/tx/${txHash}`,
          // Add bridge-specific metadata for status checking
          bridgeMetadata: {
            tokenUuid: selectedToken?.uuid || '',
            tokenSymbol: selectedToken?.symbol || '',
            evmConfirmationTime: Math.floor(Date.now() / 1000), // Will be updated when EVM confirms
            isTestnet: bridgeConfig.isTestnet,
          },
        }

        // Add to notification center
        const notificationGroup: string[] = []
        notificationGroup.push(JSON.stringify(notificationData))
        addNotification(notificationGroup)
      }

      // Start EVM polling
      startEvmConfirmationPolling(txHash)
    }

    // Add event listeners
    window.addEventListener('bridgeApprovalStarted', handleApprovalStarted as EventListener)
    window.addEventListener('bridgeApprovalSent', handleApprovalSent as EventListener)
    window.addEventListener('bridgeApprovalConfirmed', handleApprovalConfirmed as EventListener)
    window.addEventListener('bridgeTransactionSent', handleBridgeTransactionSent as unknown as EventListener)

    // Add event listener for bridge transaction updates
    const handleBridgeTransactionUpdate = (event: CustomEvent) => {
      if (!isMounted.current) return

      const detail = event.detail

      if (detail.status === 'confirmed' && detail.success) {
        // Handle successful transaction confirmation
        setTransactionHash(detail.transactionHash || '')
        setIsProcessing(false)
        setTxStatus('idle')

        // Note: Removed intermediate success toast - only showing final completion toast
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
      // Check if this is a MetaMask transaction rejection
      if (
        event.reason &&
        (event.reason.message?.includes('MetaMask Tx Signature: User denied') ||
          event.reason.message?.includes('User denied transaction signature') ||
          event.reason.code === 4001)
      ) {
        // Prevent the error from bubbling up and causing a runtime error
        event.preventDefault()

        // Reset the processing state if component is still mounted
        if (isMounted.current) {
          setIsProcessing(false)
          setErrorMessage('Transaction cancelled: You rejected the request in MetaMask')
          
          // Reset bridge state to allow retry
          clearTransaction()
          setShowStepper(false)
          setTxStatus('idle')

          // Show error toast for cancellation
          createErrorToast('Transaction cancelled: You rejected the request in MetaMask', false)
        }
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // Clean up function - remove event listeners and set mounted ref to false
    return () => {
      isMounted.current = false
      
      // Clear any ongoing EVM polling
      if (evmIntervalRef.current) {
        clearInterval(evmIntervalRef.current)
        evmIntervalRef.current = null
      }
      if (evmTimeoutRef.current) {
        clearTimeout(evmTimeoutRef.current)
        evmTimeoutRef.current = null
      }
      
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('bridgeTransactionUpdate', handleBridgeTransactionUpdate as EventListener)
      window.removeEventListener('bridgeApprovalStarted', handleApprovalStarted as EventListener)
      window.removeEventListener('bridgeApprovalSent', handleApprovalSent as EventListener)
      window.removeEventListener('bridgeApprovalConfirmed', handleApprovalConfirmed as EventListener)
      window.removeEventListener('bridgeTransactionSent', handleBridgeTransactionSent as unknown as EventListener)
    }
  }, [updateStep, setApprovalTxHash, setBridgeTxHash])

  useEffect(() => {
    if (initialToken) {
      setSelectedToken(initialToken)
    } else if (bridgedTokens && bridgedTokens.length > 0 && !selectedToken) {
      // Auto-select the first token if no token is selected
      setSelectedToken(bridgedTokens[0])
    }
  }, [initialToken, bridgedTokens, selectedToken])

  // Auto-connect MetaMask EVM when user has connected via MetaMask Snap
  useEffect(() => {
    const autoConnectMetaMask = async () => {
      // If user connected via MetaMask Snap (for Hathor) but not connected to EVM network
      if (walletType === 'metamask-snap' && isSnapInstalled && !metaMaskConnected && sdk) {
        try {
          console.log('Auto-connecting MetaMask EVM for Snap user...')
          await sdk.connect()
        } catch (error) {
          console.log('Auto-connect failed (user may have rejected):', error)
          // Don't show error - this is an automatic attempt
        }
      }
    }

    autoConnectMetaMask()
  }, [walletType, isSnapInstalled, metaMaskConnected, sdk])

  // Effect to restore persisted bridge transaction on page load
  useEffect(() => {
    if (isBridgeActive && !isDismissed) {
      setShowStepper(true)

      // If we have a bridge transaction hash but EVM confirmation is still pending, resume polling
      const evmStep = steps.find((step) => step.id === 'evm-confirming')
      if (evmStep?.status === 'active' && evmStep.txHash) {
        startEvmConfirmationPolling(evmStep.txHash)
      }
    }
  }, [isBridgeActive, isDismissed, steps])

  // Effect to auto-close stepper when all steps are finished
  useEffect(() => {
    if (isBridgeActive && !isDismissed && steps.length > 0) {
      const allCompleted = steps.every((step) => step.status === 'completed')

      if (allCompleted) {
        // Clear any remaining EVM polling timers
        if (evmIntervalRef.current) {
          clearInterval(evmIntervalRef.current)
          evmIntervalRef.current = null
        }
        if (evmTimeoutRef.current) {
          clearTimeout(evmTimeoutRef.current)
          evmTimeoutRef.current = null
        }

        // Auto-close the stepper after a short delay
        setTimeout(() => {
          if (isMounted.current) {
            setShowStepper(false)
            clearTransaction()
          }
        }, 2000)
      }
    }
  }, [steps, isBridgeActive, isDismissed, clearTransaction])

  const handleBridge = async () => {
    // Track user action for deep link handling
    if (typeof window !== 'undefined') {
      (window as any).lastUserAction = Date.now()
    }

    // Reset state
    setErrorMessage('')
    setTransactionHash('')
    setTxStatus('processing')
    bridgeNotificationCreated.current = false // Reset notification flag for new transaction

    // Initialize stepper with Zustand store
    setShowStepper(true)
    startBridge({
      tokenAddress: selectedToken?.originalAddress || '',
      tokenUuid: selectedToken?.uuid || '',
      tokenSymbol: selectedToken?.symbol || '',
      amount,
      hathorAddress,
    })

    // Start with processing step
    updateStep('processing', 'active')

    // Check if MetaMask is connected (either via SDK or Snap)
    const isMetaMaskReady = metaMaskConnected && metaMaskAccount
    if (!selectedToken || !amount || !isMetaMaskReady) {
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

          // Complete processing step and start approval
          updateStep('processing', 'completed')
          updateStep('approval', 'active')

          // Note: Removed approval info toast - stepper provides visual feedback
        }
        return // Exit early without clearing processing flag
      } else if (result.status === 'confirming') {
        // Transaction submitted, waiting for confirmation
        if (isMounted.current) {
          setTransactionHash(txHash)
          setTxStatus('confirming')

          // Update stepper - if we reach here directly, approval was already sufficient
          // Mark processing and approval steps as completed and update bridge transaction
          updateStep('processing', 'completed')
          updateStep('approval', 'completed')
          updateStep('approval-confirmed', 'completed')
          updateStep('bridge-tx', 'completed', txHash)
          updateStep('evm-confirming', 'active', txHash)
          setBridgeTxHash(txHash)

          // Note: Removed intermediate info toast - stepper provides visual feedback

          // Start polling for EVM confirmation
          startEvmConfirmationPolling(txHash)
        }
        return // Exit without clearing processing state
      }

      // If we get here, something unexpected happened (shouldn't reach here with current logic)
      console.warn('Unexpected bridge result status:', result)
    } catch (error: any) {
      console.error('Bridge operation failed:', error)
      clearTimeout(safetyTimeout)

      if (isMounted.current) {
        setIsProcessing(false)
        let errorMsg = error.message || 'Failed to bridge tokens'

        // Keep message short and readable for the UI
        if (errorMsg.length > 100) {
          errorMsg = errorMsg.substring(0, 100) + '...'
        }

        setErrorMessage(errorMsg)

        // Check if this is a user cancellation to handle differently
        const isUserCancellation = errorMsg.includes('User denied') || 
                                   errorMsg.includes('cancelled') || 
                                   errorMsg.includes('canceled') ||
                                   errorMsg.includes('rejected')
        
        if (isUserCancellation) {
          // For user cancellations, reset the entire bridge state to allow retry
          console.log('User cancelled transaction, resetting bridge state')
          clearTransaction()
          setShowStepper(false)
          setTxStatus('idle')
        } else {
          // For other errors, update stepper to show failure
          if (txStatus === 'approval') {
            updateStep('approval', 'failed', undefined, errorMsg)
          } else if (txStatus === 'processing') {
            updateStep('processing', 'failed', undefined, errorMsg)
          } else if (txStatus === 'confirming') {
            updateStep('evm-confirming', 'failed', undefined, errorMsg)
          } else {
            updateStep('bridge-tx', 'failed', undefined, errorMsg)
          }
        }

        // Show error toast
        createErrorToast(errorMsg, false)
      }
    }
  }

  const handleCancel = () => {
    setIsProcessing(false)
    setTxStatus('idle')

    if (txStatus === 'confirming') {
      // If we're in a confirming state, show a warning
      createInfoToast({
        type: 'send',
        summary: {
          pending: '',
          completed: '',
          failed: '',
          info: 'Closed transaction status view. Your transaction may still be processing.',
        },
        txHash: nanoid(),
        groupTimestamp: Date.now(),
        timestamp: Date.now(),
      })
    }
  }

  const handleMetaMaskConnect = (accounts: string[]) => {
    console.log('MetaMask connected:', accounts[0])
    // We don't need to do anything here as the SDK handles connection state
  }

  const handleMetaMaskDisconnect = () => {
    console.log('MetaMask disconnected')
    // We don't need to do anything here as the SDK handles connection state
  }

  return (
    <Widget id="bridge" maxWidth={400} className="shadow-2xl shadow-blue-900/20">
      <Widget.Content>
        <div className="px-4 py-4 font-medium border-b border-stone-700">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Arbitrum to Hathor Bridge</h2>
              <p className="mt-1 text-xs text-gray-400">Transfer tokens from Arbitrum to Hathor Network</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-stone-800">
          {errorMessage && (
            <div className="p-3 mb-5 rounded-lg border border-red-600 bg-red-900/20">
              <div className="flex items-start">
                <ExclamationCircleIcon className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-red-300">{errorMessage}</span>
              </div>
            </div>
          )}

          <BridgeCurrencyInput
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

          {/* Bridge Transaction Stepper */}
          {(showStepper || (isBridgeActive && !isDismissed)) && (
            <div className="mt-5 mb-5">
              <BridgeStepper
                steps={steps}
                currentStep={currentStep}
                onClose={() => {
                  const isCompleted = steps.every((step) => step.status === 'completed')
                  if (isCompleted || !isProcessing) {
                    setShowStepper(false)
                    if (isCompleted) {
                      clearTransaction()
                    } else {
                      dismissTransaction()
                    }
                  }
                }}
              />
            </div>
          )}

          <div className="mt-5">
            {/*
              Show Bridge Button when MetaMask is connected to EVM network
              This works for both:
              1. Users who connected directly via MetaMask for bridge
              2. Users who connected via MetaMask Snap (for Hathor) - auto-connect will handle EVM connection
            */}
            {metaMaskConnected ? (
              <Button
                fullWidth
                size="lg"
                color="blue"
                onClick={handleBridge}
                disabled={
                  !selectedToken || !amount || isProcessing || !hathorAddress || (isBridgeActive && !isDismissed)
                }
              >
                {isProcessing || (isBridgeActive && !isDismissed)
                  ? txStatus === 'processing'
                    ? 'Processing...'
                    : txStatus === 'approval'
                    ? 'Waiting for Approval...'
                    : txStatus === 'confirming'
                    ? 'Confirming Transaction...'
                    : steps.every((step) => step.status === 'completed')
                    ? 'Bridge Complete'
                    : 'Bridge in Progress...'
                  : 'Bridge Token'}
              </Button>
            ) : walletType === 'metamask-snap' && isSnapInstalled ? (
              // User has MetaMask Snap but EVM not connected - show loading/connect state
              <Button
                fullWidth
                size="lg"
                color="blue"
                onClick={async () => {
                  // Track user action for deep link handling
                  if (typeof window !== 'undefined') {
                    (window as any).lastUserAction = Date.now()
                  }

                  if (sdk) {
                    try {
                      console.log('Manually connecting MetaMask to EVM network...')
                      const accounts = await sdk.connect()
                      console.log('Connected to EVM accounts:', accounts)
                      if (accounts && accounts.length > 0) {
                        createSuccessToast({
                          type: 'approval',
                          summary: {
                            pending: '',
                            completed: 'Connected to Arbitrum network',
                            failed: '',
                          },
                          txHash: nanoid(),
                          groupTimestamp: Date.now(),
                          timestamp: Date.now(),
                        })
                      }
                    } catch (error: any) {
                      console.error('Failed to connect MetaMask EVM:', error)
                      const errorMsg = error?.message || 'Failed to connect to Arbitrum network'
                      setErrorMessage(errorMsg)
                      createErrorToast(errorMsg, false)
                    }
                  } else {
                    const msg = 'MetaMask SDK not initialized. Please refresh the page.'
                    setErrorMessage(msg)
                    createErrorToast(msg, false)
                  }
                }}
                disabled={false}
              >
                Connect MetaMask to Arbitrum
              </Button>
            ) : (
              // No MetaMask connection at all - show MetaMask Connect button
              <MetaMaskConnect
                onConnect={handleMetaMaskConnect}
                onDisconnect={handleMetaMaskDisconnect}
                buttonProps={{
                  fullWidth: true,
                  size: 'lg',
                }}
                hideText={false}
              />
            )}

            {/* Add a cancel button when processing */}
            {isProcessing && (
              <Button fullWidth size="md" color="red" className="mt-3" onClick={handleCancel}>
                {txStatus === 'confirming' ? 'Close' : 'Cancel'}
              </Button>
            )}

            {/* Show connection status for MetaMask EVM network */}
            {metaMaskConnected && metaMaskAccount && (
              <div className="flex gap-1 justify-center items-center mt-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-400">
                  Arbitrum Connected:{' '}
                  {`${metaMaskAccount.substring(0, 6)}...${metaMaskAccount.substring(metaMaskAccount.length - 4)}`}
                </span>
              </div>
            )}

            {/* Show helpful message if user has Snap but not EVM connected */}
            {walletType === 'metamask-snap' && isSnapInstalled && !metaMaskConnected && (
              <div className="flex gap-1 justify-center items-center mt-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-yellow-400">
                  Connect MetaMask to Arbitrum network to bridge tokens
                </span>
              </div>
            )}
          </div>
        </div>
      </Widget.Content>
    </Widget>
  )
}
