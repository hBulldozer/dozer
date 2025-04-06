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
import { MetaMaskConnect } from '../MetaMaskConnect'
import { useSDK } from '@metamask/sdk-react'

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
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [transactionHash, setTransactionHash] = useState<string>('')
  const [txStatus, setTxStatus] = useState<string>('idle')

  // Use a ref to track mounted state to avoid state updates after unmount
  const isMounted = useRef(true)

  const { bridgeTokenToHathor } = useBridge()

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

  const handleBridge = async () => {
    // Reset state
    setErrorMessage('')
    setSuccessMessage('')
    setTransactionHash('')
    setTxStatus('processing')

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

          // Show a toast to let the user know we're asking for approval
          createInfoToast({
            type: 'send',
            summary: {
              pending: '',
              completed: '',
              failed: '',
              info: 'Please approve token access in MetaMask to continue with the bridge operation.',
            },
            txHash: nanoid(),
            groupTimestamp: Date.now(),
            timestamp: Date.now(),
          })
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Arbitrum to Hathor Bridge</h2>
              <p className="text-gray-400 text-xs mt-1">Transfer tokens from Arbitrum to Hathor Network</p>
            </div>
            <div className="flex items-center">
              {metaMaskConnected && (
                <MetaMaskConnect onConnect={handleMetaMaskConnect} onDisconnect={handleMetaMaskDisconnect} />
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
            {!metaMaskConnected ? (
              <MetaMaskConnect onConnect={handleMetaMaskConnect} onDisconnect={handleMetaMaskDisconnect} />
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
