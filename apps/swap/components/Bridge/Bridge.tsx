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
  const { connected: metaMaskConnected, account: metaMaskAccount } = useSDK()

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

  const { bridgeTokenToHathor } = useBridge()

  // Get hathorAddress from WalletConnect accounts
  const hathorAddress = accounts && accounts.length > 0 ? accounts[0].split(':')[2] : ''

  // Function to poll for EVM transaction confirmation
  const startEvmConfirmationPolling = async (txHash: string) => {
    console.log('Starting EVM confirmation polling for tx:', txHash)
    
    const getWeb3Provider = async () => {
      const Web3 = (await import('web3')).default
      
      // First try window.ethereum (browser extension or injected provider)
      if (window.ethereum) {
        console.log('Using window.ethereum provider')
        return new Web3(window.ethereum)
      }
      
      // Fallback to public RPC for read-only operations like getting transaction receipts
      // This is more reliable for native app scenarios since we only need to read transaction status
      console.log('window.ethereum not available, using public RPC endpoint for transaction confirmation')
      
      // Import bridge config to get the correct RPC URL
      const bridgeConfig = (await import('@dozer/higmi/config/bridge')).default
      const publicRpcUrl = bridgeConfig.ethereumConfig.rpcUrl
      console.log('Using RPC URL:', publicRpcUrl)
      return new Web3(publicRpcUrl)
    }

    const checkConfirmation = async () => {
      try {
        const web3 = await getWeb3Provider()
        if (!web3) {
          console.warn('No Web3 provider available, retrying...')
          return false // Keep polling
        }

        console.log('Checking confirmation for tx:', txHash)
        const receipt = await web3.eth.getTransactionReceipt(txHash)
        console.log('Transaction receipt:', receipt)

        if (receipt && receipt.status) {
          // Transaction confirmed successfully
          console.log('EVM transaction confirmed:', receipt)

          if (isMounted.current) {
            setIsProcessing(false)

            // Update stepper - EVM confirmation complete, now checking Hathor
            updateStep('evm-confirming', 'completed', txHash)
            updateStep('hathor-received', 'active')
            setEvmConfirmationTime(Math.floor(Date.now() / 1000))

            // Note: Removed intermediate success toast - only showing final completion toast
          }
          return true // Stop polling
        } else if (receipt && !receipt.status) {
          // Transaction failed
          console.error('EVM transaction failed:', receipt)
          if (isMounted.current) {
            updateStep('evm-confirming', 'failed', undefined, 'Transaction failed on blockchain')
            setIsProcessing(false)
            setErrorMessage('Transaction failed on blockchain')
            createErrorToast('Transaction failed on blockchain', false)
          }
          return true // Stop polling
        }

        // No receipt yet, keep polling
        console.log('Transaction not confirmed yet, continuing to poll...')
        return false // Keep polling
      } catch (error) {
        console.error('Error checking EVM confirmation:', error)
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
      const interval = setInterval(async () => {
        const done = await checkConfirmation()
        if (done) {
          clearInterval(interval)
        }
      }, 5000)

      // Cleanup timeout after 10 minutes
      setTimeout(() => {
        clearInterval(interval)
        console.warn('EVM confirmation polling timed out after 10 minutes')
        if (isMounted.current) {
          updateStep('evm-confirming', 'failed', undefined, 'Transaction confirmation timed out')
          setErrorMessage('Transaction confirmation timed out. Please check your transaction manually.')
        }
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
      console.log('Approval started:', event.detail)
      updateStep('approval', 'active')
    }

    const handleApprovalSent = (event: CustomEvent) => {
      console.log('Approval sent:', event.detail)
      setApprovalTxHash(event.detail.txHash)
      updateStep('approval', 'completed', event.detail.txHash)
      updateStep('approval-confirmed', 'active', event.detail.txHash)
    }

    const handleApprovalConfirmed = (event: CustomEvent) => {
      console.log('Approval confirmed:', event.detail)
      updateStep('approval-confirmed', 'completed', event.detail.txHash)
      updateStep('bridge-tx', 'active')
    }

    const handleBridgeTransactionSent = (event: CustomEvent) => {
      console.log('Bridge transaction sent:', event.detail)
      setBridgeTxHash(event.detail.txHash)
      updateStep('bridge-tx', 'completed', event.detail.txHash)
      updateStep('evm-confirming', 'active', event.detail.txHash)

      // Start EVM polling
      startEvmConfirmationPolling(event.detail.txHash)
    }

    // Add event listeners
    window.addEventListener('bridgeApprovalStarted', handleApprovalStarted as EventListener)
    window.addEventListener('bridgeApprovalSent', handleApprovalSent as EventListener)
    window.addEventListener('bridgeApprovalConfirmed', handleApprovalConfirmed as EventListener)
    window.addEventListener('bridgeTransactionSent', handleBridgeTransactionSent as EventListener)

    // Add event listener for bridge transaction updates
    const handleBridgeTransactionUpdate = (event: CustomEvent) => {
      if (!isMounted.current) return

      const detail = event.detail
      console.log('Bridge transaction update received:', detail)

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
      console.log('Unhandled promise rejection:', event)

      // Check if this is a MetaMask transaction rejection
      if (
        event.reason &&
        (event.reason.message?.includes('MetaMask Tx Signature: User denied') ||
          event.reason.message?.includes('User denied transaction signature') ||
          event.reason.code === 4001)
      ) {
        console.log('Detected MetaMask transaction rejection via global handler')
        
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
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('bridgeTransactionUpdate', handleBridgeTransactionUpdate as EventListener)
      window.removeEventListener('bridgeApprovalStarted', handleApprovalStarted as EventListener)
      window.removeEventListener('bridgeApprovalSent', handleApprovalSent as EventListener)
      window.removeEventListener('bridgeApprovalConfirmed', handleApprovalConfirmed as EventListener)
      window.removeEventListener('bridgeTransactionSent', handleBridgeTransactionSent as EventListener)
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

  // Effect to show completion notification when all steps are finished
  useEffect(() => {
    if (isBridgeActive && !isDismissed && steps.length > 0) {
      const allCompleted = steps.every((step) => step.status === 'completed')
      const hasAnyCompleted = steps.some((step) => step.status === 'completed')

      if (allCompleted && hasAnyCompleted) {
        // Show simple completion toast without adding to transaction list
        const hathorTxHash = steps.find((step) => step.id === 'hathor-received')?.txHash
        const explorerUrl = hathorTxHash
          ? `https://explorer.${
              bridgeConfig.isTestnet ? 'bravo.nano-testnet.' : ''
            }hathor.network/transaction/${hathorTxHash}`
          : undefined

        // Create a simple completion toast that won't add to transaction list
        createSuccessToast({
          type: 'send',
          summary: {
            pending: '',
            completed: `🎉 Bridge Complete! Your ${
              storedTokenSymbol || 'tokens'
            } have been successfully transferred to your Hathor wallet.`,
            failed: '',
          },
          txHash: nanoid(), // Use random ID to avoid transaction tracking
          groupTimestamp: Date.now(),
          timestamp: Date.now(),
          href: explorerUrl,
        })

        // Automatically clear the transaction after showing notification
        setTimeout(() => {
          clearTransaction()
        }, 2000)
      }
    }
  }, [steps, isBridgeActive, isDismissed, storedTokenSymbol, clearTransaction])

  const handleBridge = async () => {
    // Track user action for deep link handling
    if (typeof window !== 'undefined') {
      (window as any).lastUserAction = Date.now()
    }
    
    // Reset state
    setErrorMessage('')
    setTransactionHash('')
    setTxStatus('processing')

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

    if (!selectedToken || !amount || !metaMaskAccount) {
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
            {metaMaskConnected ? (
              // Show Bridge Button when connected
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
            ) : (
              // Show MetaMask Connect button when not connected
              <MetaMaskConnect
                onConnect={handleMetaMaskConnect}
                onDisconnect={handleMetaMaskDisconnect}
                buttonProps={{
                  fullWidth: true,
                  size: 'lg',
                  // removed custom color to use default blue from MetaMaskConnect
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

            {/* Add a small status indicator for MetaMask when connected */}
            {metaMaskConnected && (
              <div className="flex gap-1 justify-center items-center mt-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-400">
                  MetaMask Connected:{' '}
                  {metaMaskAccount &&
                    `${metaMaskAccount.substring(0, 6)}...${metaMaskAccount.substring(metaMaskAccount.length - 4)}`}
                </span>
              </div>
            )}
          </div>
        </div>
      </Widget.Content>
    </Widget>
  )
}
