import { FC, useState, useEffect, useRef, useMemo } from 'react'
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
  const [evmBalance, setEvmBalance] = useState<number>(0)

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

  // Track if we've created the Hathor notification to prevent duplicates
  const hathorNotificationCreated = useRef(false)

  const { bridgeTokenToHathor, loadBalances } = useBridge()

  // Use the unified Hathor address from Zustand store
  // This works for both WalletConnect and MetaMask Snap connections
  const hathorAddress = hathorAddressFromStore || ''


  // Listen for wallet disconnect events and reload the page
  useEffect(() => {
    const handleWalletDisconnect = () => {
      // Check if the flag was set
      const justDisconnected = sessionStorage.getItem('metamask-just-disconnected')
      if (justDisconnected === 'true') {
        sessionStorage.removeItem('metamask-just-disconnected')
        // Small delay to ensure storage operations complete
        setTimeout(() => {
          window.location.reload()
        }, 100)
      }
    }

    // Also check on mount in case user refreshed or navigated to this page after disconnect
    const justDisconnected = sessionStorage.getItem('metamask-just-disconnected')
    if (justDisconnected === 'true') {
      sessionStorage.removeItem('metamask-just-disconnected')
      setTimeout(() => {
        window.location.reload()
      }, 100)
    }

    // Listen for custom disconnect event
    window.addEventListener('walletDisconnected', handleWalletDisconnect)

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('walletDisconnected', handleWalletDisconnect)
    }
  }, [])

  // Function to poll for EVM transaction confirmation
  const startEvmConfirmationPolling = async (txHash: string) => {
    // Create Web3 instance once to avoid memory leaks from multiple instances
    const Web3 = (await import('web3')).default
    let web3: InstanceType<typeof Web3>

    // First try window.ethereum (browser extension or injected provider)
    if (window.ethereum) {
      web3 = new Web3(window.ethereum)
    } else {
      // Fallback to public RPC for read-only operations like getting transaction receipts
      const bridgeConfig = (await import('@dozer/higmi/config/bridge')).default
      const publicRpcUrl = bridgeConfig.ethereumConfig.rpcUrl
      web3 = new Web3(publicRpcUrl)
    }

    const checkConfirmation = async () => {
      try {
        const receipt = await web3.eth.getTransactionReceipt(txHash)

        if (receipt && receipt.status) {
          // Transaction confirmed successfully

          if (isMounted.current) {
            setIsProcessing(false)

            const confirmationTime = Math.floor(Date.now() / 1000)

            // Update stepper - EVM confirmation complete
            // All bridge steps are now done (Hathor tracking happens in notification center)
            updateStep('processing', 'completed')
            updateStep('approval', 'completed')
            updateStep('approval-confirmed', 'completed')
            updateStep('bridge-tx', 'completed')
            updateStep('evm-confirming', 'completed', txHash)
            setEvmConfirmationTime(confirmationTime)

            // Clear timeout since EVM confirmation is done
            if (evmTimeoutRef.current) {
              clearTimeout(evmTimeoutRef.current)
              evmTimeoutRef.current = null
            }

            // Create a new notification in the notification center for Hathor polling
            // This allows tracking token receipt on Hathor network
            // Only create once to prevent duplicates on re-renders or multiple confirmations
            if (!hathorNotificationCreated.current) {
              hathorNotificationCreated.current = true

              // Get token info from bridge transaction store (more reliable than component state)
              const bridgeState = useBridgeTransactionStore.getState()
              const tokenSymbol = bridgeState.tokenSymbol || 'tokens'
              const tokenUuid = bridgeState.tokenUuid || ''
              const hathorAddr = bridgeState.hathorAddress || ''

              const bridgeConfig = (await import('@dozer/higmi/config/bridge')).default
              const hathorNotificationData = {
                type: 'bridge' as const,
                summary: {
                  pending: `Waiting for ${tokenSymbol} on Hathor network`,
                  completed: `Bridge complete! ${tokenSymbol} received on Hathor network.`,
                  failed: 'Failed to receive tokens on Hathor network',
                },
                txHash: txHash, // Use same txHash for correlation
                groupTimestamp: confirmationTime,
                timestamp: confirmationTime,
                promise: new Promise((resolve) => setTimeout(resolve, 500)),
                account: hathorAddr,
                href: `${bridgeConfig.ethereumConfig.explorer}/tx/${txHash}`,
                // Bridge metadata for Hathor polling
                bridgeMetadata: {
                  tokenUuid: tokenUuid,
                  tokenSymbol: tokenSymbol,
                  evmConfirmationTime: confirmationTime, // When EVM was confirmed
                  isTestnet: bridgeConfig.isTestnet,
                },
              }

              const hathorNotificationGroup: string[] = []
              hathorNotificationGroup.push(JSON.stringify(hathorNotificationData))
              addNotification(hathorNotificationGroup)

              // Show success toast for EVM confirmation
              createSuccessToast({
                type: 'bridge',
                summary: {
                  pending: '',
                  completed: `EVM confirmed! Waiting for ${tokenSymbol} on Hathor network...`,
                  failed: '',
                },
                txHash: txHash,
                groupTimestamp: Date.now(),
                timestamp: Date.now(),
                href: `${bridgeConfig.ethereumConfig.explorer}/tx/${txHash}`,
              })
            }
          }
          return true // Stop EVM polling (Hathor polling starts in notification center)
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
  const bridgedTokens = useMemo(() => {
    // Process tokens from API
    const apiBridgedTokens = tokens
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

    // Process tokens from local config (fallback/ensure existence)
    const configTokens = bridgeConfig.bridgeTokens
      .map((tokenConfig) => {
        const hathorConfig = tokenConfig[bridgeConfig.hathorConfig.networkId]
        const evmConfig = tokenConfig[bridgeConfig.ethereumConfig.networkId]

        if (!hathorConfig) return null

        // If no Hathor Address / UUID is defined, we can't use it
        if (!hathorConfig.hathorAddr) return null

        return new Token({
          uuid: hathorConfig.hathorAddr,
          symbol: hathorConfig.symbol,
          name: tokenConfig.name,
          decimals: hathorConfig.decimals,
          chainId: bridgeConfig.hathorConfig.networkId,
          bridged: true,
          originalAddress: evmConfig?.address,
          sourceChain: bridgeConfig.ethereumConfig.name,
          targetChain: 'Hathor',
          imageUrl: tokenConfig.icon,
        })
      })
      .filter((t): t is Token => t !== null)

    // Merge lists, preferring API tokens if they exist (to get dynamic data?),
    // or properly handling duplicates by UUID
    const tokenMap = new Map<string, Token>()

    // Add config tokens first
    configTokens.forEach((token) => {
      tokenMap.set(token.uuid, token)
    })

    // Override with API tokens if present (assuming API might have more up-to-date dynamic info)
    apiBridgedTokens.forEach((token) => {
      tokenMap.set(token.uuid, token)
    })

    return Array.from(tokenMap.values())
  }, [tokens])

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

      // Start EVM polling (notification will be created after EVM confirmation)
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
    // Empty dependency array - event listeners should only be set up once on mount
    // The handlers use refs and Zustand actions that don't need to be in dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (initialToken) {
      setSelectedToken(initialToken)
    } else if (bridgedTokens && bridgedTokens.length > 0 && !selectedToken) {
      // Auto-select the first token if no token is selected
      setSelectedToken(bridgedTokens[0])
    }
  }, [initialToken, bridgedTokens, selectedToken])

  // Load EVM balance when selected token changes
  useEffect(() => {
    const loadEvmBalance = async () => {
      if (!selectedToken?.originalAddress || !metaMaskConnected) {
        setEvmBalance(0)
        return
      }
      try {
        const balances = await loadBalances([selectedToken.originalAddress])
        const balance = balances?.[selectedToken.originalAddress] || 0
        setEvmBalance(balance)
      } catch (error) {
        console.error('Error loading EVM balance:', error)
        setEvmBalance(0)
      }
    }
    loadEvmBalance()
  }, [selectedToken?.originalAddress, metaMaskConnected, loadBalances])

  // Compute validation state for button text and disabled state
  const getButtonValidation = (): { isDisabled: boolean; message: string } => {
    const isMetaMaskReady = metaMaskConnected && metaMaskAccount

    if (!selectedToken) {
      return { isDisabled: true, message: 'Select a token' }
    }
    if (!amount) {
      return { isDisabled: true, message: 'Enter an amount' }
    }

    const minAmount = bridgeConfig.isTestnet ? 1 : 5

    const amountValue = parseFloat(amount)
    if (isNaN(amountValue) || amountValue <= 0) {
      return { isDisabled: true, message: 'Enter a valid amount' }
    }
    if (amountValue < minAmount) {
      return { isDisabled: true, message: `Minimum amount is ${minAmount}` }
    }
    if (amountValue > evmBalance) {
      return { isDisabled: true, message: 'Insufficient balance' }
    }
    if (!hathorAddress) {
      return { isDisabled: true, message: 'Connect Hathor wallet' }
    }
    if (!isMetaMaskReady) {
      return { isDisabled: true, message: 'Connect MetaMask' }
    }

    return { isDisabled: false, message: 'Bridge Token' }
  }

  const buttonValidation = getButtonValidation()

  // Auto-connect MetaMask EVM when user has connected via MetaMask Snap
  useEffect(() => {
    const autoConnectMetaMask = async () => {
      // If user connected via MetaMask Snap (for Hathor) but not connected to EVM network
      if (walletType === 'metamask-snap' && isSnapInstalled && !metaMaskConnected && sdk) {
        try {
          await sdk.connect()

          // After connecting, check and switch to the correct network (Sepolia for testnet)
          if (window.ethereum) {
            try {
              const chainId = await window.ethereum.request({ method: 'eth_chainId' })
              const networkId = parseInt(chainId, 16)

              // Expected chain ID from bridge config (Sepolia for testnet, Arbitrum for mainnet)
              const expectedChainId = bridgeConfig.ethereumConfig.networkId
              const expectedChainIdHex = bridgeConfig.ethereumConfig.chainIdHex

              if (networkId !== expectedChainId) {
                console.log(
                  `Wrong network detected during auto-connect. Switching from ${networkId} to ${expectedChainId} (${bridgeConfig.ethereumConfig.name})`
                )

                try {
                  // Try to switch to the correct network
                  await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: expectedChainIdHex }],
                  })
                  console.log(`Successfully switched to ${bridgeConfig.ethereumConfig.name}`)

                  // Show success toast
                  createSuccessToast({
                    type: 'approval',
                    summary: {
                      pending: '',
                      completed: `Connected to ${bridgeConfig.ethereumConfig.name}`,
                      failed: '',
                    },
                    txHash: '',
                    groupTimestamp: Date.now(),
                    timestamp: Date.now(),
                  })
                } catch (switchError: any) {
                  // This error code indicates that the chain has not been added to MetaMask
                  if (switchError.code === 4902) {
                    const errorMsg = `Please add the ${bridgeConfig.ethereumConfig.name} network to your MetaMask`
                    setErrorMessage(errorMsg)
                    createErrorToast(errorMsg, false)
                  } else if (switchError.code === 4001) {
                    // User rejected the request
                    const errorMsg = `Please switch to ${bridgeConfig.ethereumConfig.name} network to use the bridge`
                    setErrorMessage(errorMsg)
                  }
                }
              }
            } catch (networkError: any) {
              // Silently fail - network switch is optional
            }
          }
        } catch (error) {
          // Auto-connect failed - user may have rejected, don't show error
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
      ;(window as any).lastUserAction = Date.now()
    }

    // Reset state
    setErrorMessage('')
    setTransactionHash('')
    setTxStatus('processing')
    hathorNotificationCreated.current = false // Reset notification flag for new transaction

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

    // Amount validation is now handled by buttonValidation
    // These checks are kept as safety guards in case button validation is bypassed
    const amountValue = parseFloat(amount)
    if (isNaN(amountValue) || amountValue <= 0 || amountValue < 1) {
      return
    }
    if (evmBalance > 0 && amountValue > evmBalance) {
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
    } catch (error: any) {
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
        const isUserCancellation =
          errorMsg.includes('User denied') ||
          errorMsg.includes('cancelled') ||
          errorMsg.includes('canceled') ||
          errorMsg.includes('rejected')

        if (isUserCancellation) {
          // For user cancellations, reset the entire bridge state to allow retry
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
        txHash: transactionHash,
        groupTimestamp: Date.now(),
        timestamp: Date.now(),
      })
    }
  }

  const handleMetaMaskConnect = (accounts: string[]) => {
    // SDK handles connection state
  }

  const handleMetaMaskDisconnect = () => {
    // SDK handles connection state
  }

  return (
    <Widget id="bridge" maxWidth={400} className="shadow-2xl shadow-blue-900/20">
      <Widget.Content>
        <div className="px-4 py-4 font-medium border-b border-stone-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">{bridgeConfig.ethereumConfig.name} to Hathor Bridge</h2>
              <p className="mt-1 text-xs text-gray-400">
                Transfer tokens from {bridgeConfig.ethereumConfig.name} to Hathor Network
              </p>
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
              We also check !manuallyDisconnected to handle the case where user clicked disconnect
              but the SDK hasn't updated its state yet
            */}
            {(() => {
              const hasHathorWallet = walletType !== null // User has connected a Hathor wallet (either Snap or WalletConnect)

              if (metaMaskConnected) {
                return (
                  <Button
                    fullWidth
                    size="lg"
                    color="blue"
                    onClick={handleBridge}
                    disabled={buttonValidation.isDisabled || isProcessing || (isBridgeActive && !isDismissed)}
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
                      : buttonValidation.message}
                  </Button>
                )
              } else if ((hasHathorWallet || walletType === 'metamask-snap') && isSnapInstalled && !metaMaskConnected) {
                return (
                  // User has MetaMask Snap but EVM not connected - show loading/connect state
                  <Button
                    fullWidth
                    size="lg"
                    color="blue"
                    onClick={async () => {
                      // Track user action for deep link handling
                      if (typeof window !== 'undefined') {
                        ;(window as any).lastUserAction = Date.now()
                      }

                      if (sdk) {
                        try {
                          const accounts = await sdk.connect()

                          // After connecting, check and switch to the correct network
                          if (window.ethereum && accounts && accounts.length > 0) {
                            try {
                              const chainId = await window.ethereum.request({ method: 'eth_chainId' })
                              const networkId = parseInt(chainId, 16)

                              // Expected chain ID from bridge config
                              const expectedChainId = bridgeConfig.ethereumConfig.networkId
                              const expectedChainIdHex = bridgeConfig.ethereumConfig.chainIdHex

                              if (networkId !== expectedChainId) {
                                console.log(
                                  `Wrong network detected. Switching from ${networkId} to ${expectedChainId} (${bridgeConfig.ethereumConfig.name})`
                                )

                                try {
                                  await window.ethereum.request({
                                    method: 'wallet_switchEthereumChain',
                                    params: [{ chainId: expectedChainIdHex }],
                                  })
                                  console.log(`Successfully switched to ${bridgeConfig.ethereumConfig.name}`)
                                } catch (switchError: any) {
                                  if (switchError.code === 4902) {
                                    const errorMsg = `Please add the ${bridgeConfig.ethereumConfig.name} network to your MetaMask`
                                    setErrorMessage(errorMsg)
                                    createErrorToast(errorMsg, false)
                                    return
                                  } else if (switchError.code === 4001) {
                                    const errorMsg = `Please switch to ${bridgeConfig.ethereumConfig.name} network to use the bridge`
                                    setErrorMessage(errorMsg)
                                    return
                                  }
                                }
                              }
                            } catch (networkError: any) {
                              console.error('Error checking/switching network:', networkError)
                            }
                          }
                        } catch (error: any) {
                          console.error('Failed to connect MetaMask EVM:', error)
                          const errorMsg = error?.message || `Failed to connect to ${bridgeConfig.ethereumConfig.name}`
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
                    Connect MetaMask to {bridgeConfig.ethereumConfig.name}
                  </Button>
                )
              } else {
                return (
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
                )
              }
            })()}

            {/* Add a cancel button when processing */}
            {isProcessing && (
              <Button fullWidth size="md" color="red" className="mt-3" onClick={handleCancel}>
                {txStatus === 'confirming' ? 'Close' : 'Cancel'}
              </Button>
            )}

            {/* Show connection status for MetaMask EVM network */}
            {metaMaskConnected && metaMaskAccount && (
              <div className="flex items-center justify-center gap-1 mt-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-400">
                  {bridgeConfig.ethereumConfig.name} Connected:{' '}
                  {`${metaMaskAccount.substring(0, 6)}...${metaMaskAccount.substring(metaMaskAccount.length - 4)}`}
                </span>
              </div>
            )}

            {/* Show helpful message if user has Snap but not EVM connected */}
            {walletType === 'metamask-snap' && isSnapInstalled && !metaMaskConnected && (
              <div className="flex items-center justify-center gap-1 mt-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-yellow-400">
                  Connect MetaMask to {bridgeConfig.ethereumConfig.name} to bridge tokens
                </span>
              </div>
            )}
          </div>
        </div>
      </Widget.Content>
    </Widget>
  )
}
