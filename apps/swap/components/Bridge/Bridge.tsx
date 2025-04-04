import { FC, useState, useEffect } from 'react'
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
    if (initialToken) {
      setSelectedToken(initialToken)
    }
  }, [initialToken])

  // Load pending claims when component mounts or when Arbitrum connection status changes
  useEffect(() => {
    if (connection.arbitrumConnected) {
      loadPendingClaims()
    }
  }, [connection.arbitrumConnected, loadPendingClaims])

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
    try {
      // Bridge from Arbitrum to Hathor - using hathorAddress from WalletConnect
      const hash = await bridgeTokenToHathor(selectedToken.originalAddress || '', amount, hathorAddress)

      // If we get here, the transaction was submitted successfully
      setTransactionHash(hash)
      const msg = 'Transaction submitted! Your tokens will be available in Hathor soon.'
      setSuccessMessage(msg)

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

      // Don't clear the form to allow the user to see what they submitted
    } catch (error: any) {
      console.error('Bridge operation failed:', error)

      // Reset the processing state
      setIsProcessing(false)

      // Set appropriate error message
      let errorMsg = error.message || 'Bridge operation failed'

      if (
        error.message.includes('Transaction cancelled') ||
        error.message.includes('User rejected') ||
        error.message.includes('User denied') ||
        error.code === 4001
      ) {
        errorMsg = 'Transaction cancelled: You rejected the request in MetaMask'
      } else if (error.message.includes('Transaction timed out') || error.message.includes('timeout')) {
        errorMsg = 'Transaction timed out: The transaction is taking too long. Please try again.'
      } else if (error.message.includes('Transaction pending')) {
        errorMsg = 'Your transaction is still processing. Please check MetaMask for status.'
      }

      setErrorMessage(errorMsg)
      createErrorToast(errorMsg, false)
      return
    }

    // Set processing to false only if we didn't hit an error
    setIsProcessing(false)
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
              <h3 className="mb-2 text-sm font-bold text-yellow-500">Pending Claims</h3>
              <p className="text-xs text-yellow-300">You have {pendingClaims.length} pending claim(s) available.</p>
              <Button fullWidth size="sm" color="yellow" className="mt-2" onClick={navigateToClaims}>
                View Claims
              </Button>
            </div>
          )}
        </div>
      </Widget.Content>
    </Widget>
  )
}
