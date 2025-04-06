import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react'
import Web3 from 'web3'
import { useWalletConnectClient } from './index'
import { useAccount, useNetwork } from '@dozer/zustand'
import BRIDGE_ABI from '../../abis/bridge.json'
import ERC20_ABI from '../../abis/erc20.json'
import EventEmitter from 'events'
import config from '../../config/bridge'

// Add ethereum to Window interface
declare global {
  interface Window {
    ethereum: any
  }
}

// Helper function to simplify error messages for UI display
function simplifyErrorMessage(message: string | undefined): string {
  if (!message) return 'Transaction failed'

  // Common error patterns and their simplified versions
  if (
    message.includes('User denied') ||
    message.includes('User rejected') ||
    message.includes('cancelled') ||
    message.includes('canceled')
  ) {
    return 'Transaction cancelled by user'
  }

  if (
    message.includes('Transaction reverted') ||
    message.includes('execution reverted') ||
    message.includes('has been reverted by the EVM')
  ) {
    return 'Transaction failed on blockchain'
  }

  if (message.includes('timeout') || message.includes('timed out')) {
    return 'Transaction timed out'
  }

  // Keep message short
  if (message.length > 100) {
    return message.substring(0, 100) + '...'
  }

  return message
}

// Define interface for bridge connection state
interface BridgeConnectionState {
  arbitrumProvider: any | null
  arbitrumConnected: boolean
  arbitrumAddress: string | null
  arbitrumChainId: number | null
  arbitrumBalance: Record<string, number>
  connecting: boolean
  error: string | null
}

// Define interface for bridge context
interface BridgeContextType {
  connection: BridgeConnectionState
  connectArbitrum: () => Promise<void>
  disconnectArbitrum: () => void
  loadBalances: (tokenAddresses: string[]) => Promise<void>
  bridgeTokenToHathor: (
    tokenAddress: string,
    amount: string,
    hathorAddress: string
  ) => Promise<
    | {
        status: 'approval_needed' | 'confirming' | 'confirmed'
        transactionHash?: string
      }
    | any
  > // 'any' to maintain backward compatibility
}

// Create the context
const BridgeContext = createContext<BridgeContextType | undefined>(undefined)

// Bridge contract addresses from centralized config
const BRIDGE_CONTRACT_ADDRESS = config.ethereumConfig.bridge
const HATHOR_FEDERATION_ADDRESS = config.hathorConfig.federation
const ARBITRUM_FEDERATION_HOST = config.arbitrumFederationHost

// Create a provider component
export const BridgeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { accounts } = useWalletConnectClient()
  const hathorAddress = accounts && accounts.length > 0 ? accounts[0].split(':')[2] : ''
  const network = useNetwork((state) => state.network)

  const [connection, setConnection] = useState<BridgeConnectionState>({
    arbitrumProvider: null,
    arbitrumConnected: false,
    arbitrumAddress: null,
    arbitrumChainId: null,
    arbitrumBalance: {},
    connecting: false,
    error: null,
  })

  // Add a ref to track if cleanup is in progress
  const cleanupInProgress = useRef(false)

  // Use a single function for both setup and cleanup
  const manageEventListeners = useCallback((action: 'setup' | 'cleanup', provider?: Web3) => {
    if (action === 'cleanup' && (!provider || cleanupInProgress.current)) return

    if (action === 'cleanup') {
      cleanupInProgress.current = true
    }

    try {
      if (provider && provider.currentProvider) {
        if (action === 'setup' && provider.currentProvider instanceof EventEmitter) {
          // Set max listeners higher to avoid warnings
          provider.currentProvider.setMaxListeners(150)
        } else if (action === 'cleanup') {
          // For cleanup, we need to be careful with types
          const ethProvider = provider.currentProvider
          if (ethProvider && typeof ethProvider.removeListener === 'function') {
            // Rather than using removeAllListeners, we're just setting maxListeners higher
            // This avoids the need to remove specific listeners
            if (ethProvider instanceof EventEmitter) {
              ethProvider.setMaxListeners(150)
            }
          }
        }
      }
    } catch (error) {
      // Silent error handling
    } finally {
      if (action === 'cleanup') {
        cleanupInProgress.current = false
      }
    }
  }, [])

  // Load connection state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedConnection = localStorage.getItem('arbitrumConnection')
      if (savedConnection) {
        try {
          const parsedConnection = JSON.parse(savedConnection)
          // We don't restore the provider since it's not serializable
          // Just try to auto-connect if we were previously connected
          if (parsedConnection.arbitrumConnected && window.ethereum) {
            // Try to silently reconnect
            connectArbitrum().catch((error) => {
              console.error('Failed to reconnect to Arbitrum:', error)
              // Clear stored connection on failure
              localStorage.removeItem('arbitrumConnection')
            })
          }
        } catch (error) {
          console.error('Error parsing saved connection state:', error)
          localStorage.removeItem('arbitrumConnection')
        }
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps - we want this to run only once on mount

  // Save connection state to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && connection.arbitrumConnected) {
      const connectionToSave = {
        arbitrumConnected: connection.arbitrumConnected,
        arbitrumAddress: connection.arbitrumAddress,
        arbitrumChainId: connection.arbitrumChainId,
      }
      localStorage.setItem('arbitrumConnection', JSON.stringify(connectionToSave))
    } else if (typeof window !== 'undefined' && !connection.arbitrumConnected) {
      // Clear saved connection when disconnected
      localStorage.removeItem('arbitrumConnection')
    }
  }, [connection.arbitrumConnected, connection.arbitrumAddress, connection.arbitrumChainId])

  // Connect to Arbitrum via MetaMask
  const connectArbitrum = async () => {
    if (!window.ethereum) {
      setConnection((prev) => ({
        ...prev,
        error: 'MetaMask not installed',
      }))
      return
    }

    try {
      // Prevent additional connection attempts while already connecting
      if (connection.connecting) return

      setConnection((prev) => ({ ...prev, connecting: true, error: null }))

      // Create new Web3 provider
      const provider = new Web3(window.ethereum)

      // Set up listeners - simplified approach
      manageEventListeners('setup', provider)

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })

      // Get chainId and ensure it's a number
      const rawChainId = await provider.eth.getChainId()
      const chainId =
        typeof rawChainId === 'string'
          ? parseInt(rawChainId, 10)
          : typeof rawChainId === 'bigint'
          ? Number(rawChainId)
          : (rawChainId as number)

      // Get target chain config based on testnet/mainnet mode
      const targetChainId = config.ethereumConfig.networkId
      const targetChainIdHex = config.ethereumConfig.chainIdHex
      const chainName = config.ethereumConfig.name

      // Check if connected to the correct network
      if (chainId !== targetChainId) {
        try {
          // Try to switch to the correct network
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetChainIdHex }],
          })
        } catch (switchError: any) {
          // If the network is not added yet, prompt user to add it
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: targetChainIdHex,
                    chainName: chainName,
                    nativeCurrency: {
                      name: 'Ether',
                      symbol: 'ETH',
                      decimals: 18,
                    },
                    rpcUrls: [config.ethereumConfig.rpcUrl],
                    blockExplorerUrls: [config.ethereumConfig.explorer],
                  },
                ],
              })
            } catch (addError) {
              throw addError
            }
          } else {
            throw switchError
          }
        }
      }

      setConnection({
        arbitrumProvider: provider,
        arbitrumConnected: true,
        arbitrumAddress: accounts[0],
        arbitrumChainId: chainId,
        arbitrumBalance: {},
        connecting: false,
        error: null,
      })
    } catch (error: any) {
      console.error('Error connecting to Arbitrum:', error)
      setConnection((prev) => ({
        ...prev,
        connecting: false,
        error: error.message || 'Failed to connect to Arbitrum',
      }))
      throw error // Re-throw to allow caller to handle
    }
  }

  // Disconnect from Arbitrum
  const disconnectArbitrum = () => {
    console.log('Disconnect Arbitrum called')

    // Clean up the provider before disconnecting - simplified approach
    if (connection.arbitrumProvider) {
      console.log('Cleaning up provider')
      manageEventListeners('cleanup', connection.arbitrumProvider as Web3)
    }

    console.log('Setting connection state to disconnected')
    setConnection({
      arbitrumProvider: null,
      arbitrumConnected: false,
      arbitrumAddress: null,
      arbitrumChainId: null,
      arbitrumBalance: {},
      connecting: false,
      error: null,
    })

    // Clear stored connection
    if (typeof window !== 'undefined') {
      console.log('Removing from localStorage')
      localStorage.removeItem('arbitrumConnection')
    }

    console.log('Disconnect complete')
  }

  // Load token balances from Arbitrum
  const loadBalances = useCallback(
    async (tokenAddresses: string[]) => {
      if (!connection.arbitrumConnected || !connection.arbitrumProvider || !connection.arbitrumAddress) return

      const balances: Record<string, number> = {}
      const web3 = connection.arbitrumProvider as Web3

      for (const address of tokenAddresses) {
        try {
          // Create token contract instance
          const tokenContract = new web3.eth.Contract(ERC20_ABI as any, address)

          // Get token decimals
          const decimalsResult = await tokenContract.methods.decimals().call()
          const decimals = decimalsResult ? parseInt(String(decimalsResult)) : 18

          // Get token balance
          const rawBalance = await tokenContract.methods.balanceOf(connection.arbitrumAddress).call()

          // Convert raw balance to human-readable format based on decimals
          if (decimals === 18) {
            balances[address] = parseFloat(web3.utils.fromWei(String(rawBalance), 'ether'))
          } else {
            // Manual conversion for non-standard decimals
            const divisor = Math.pow(10, decimals)
            balances[address] = parseFloat(String(rawBalance)) / divisor
          }
        } catch (error) {
          console.error(`Error loading balance for token ${address}:`, error)
          balances[address] = 0
        }
      }

      setConnection((prev) => ({
        ...prev,
        arbitrumBalance: balances,
      }))
    },
    [connection.arbitrumConnected, connection.arbitrumProvider, connection.arbitrumAddress]
  )

  // Bridge a token from Arbitrum to Hathor
  const bridgeTokenToHathor = useCallback(
    async (tokenAddress: string, amount: string, hathorAddress: string) => {
      if (!connection.arbitrumConnected || !connection.arbitrumProvider || !connection.arbitrumAddress) {
        throw new Error('Not connected to Arbitrum')
      }

      const web3 = connection.arbitrumProvider as Web3

      // In testnet mode, always use the SLT7 token address for bridging
      // This ensures we use a token that actually exists on Sepolia
      let actualTokenAddress = tokenAddress
      if (config.isTestnet) {
        // Use the SLT7 token address for Sepolia
        actualTokenAddress = '0x97118caaE1F773a84462490Dd01FE7a3e7C4cdCd' // SLT7 Sepolia address
        console.log('Using SLT7 token for testnet bridge operation instead of:', tokenAddress)
      }

      // Create contract instances
      const bridgeContract = new web3.eth.Contract(BRIDGE_ABI as any, BRIDGE_CONTRACT_ADDRESS)
      const tokenContract = new web3.eth.Contract(ERC20_ABI as any, actualTokenAddress)

      // Get token decimals (fallback to 18 if call fails)
      let decimals: number = 18
      try {
        // First check if the decimals method exists on the contract
        if (!tokenContract.methods.decimals) {
          console.warn('Token contract does not have decimals method, using default 18')
        } else {
          const decimalResult = await tokenContract.methods.decimals().call()
          if (decimalResult) {
            decimals = parseInt(String(decimalResult))
          }
        }
      } catch (error) {
        console.warn('Could not get token decimals, using default 18', error)
      }

      // Convert amount to wei format based on decimals
      let amountInWei: string
      let humanReadableAmount: string
      try {
        // Parse amount to a number and handle potential errors
        const amountNumber = parseFloat(amount)
        if (isNaN(amountNumber) || amountNumber <= 0) {
          throw new Error('Invalid amount: must be a positive number')
        }

        // For 18 decimals tokens, use Web3's toWei
        if (decimals === 18) {
          amountInWei = web3.utils.toWei(amount, 'ether')
          humanReadableAmount = amount
        } else {
          // For other decimals, do manual conversion
          // Convert to smallest unit by multiplying by 10^decimals
          const factor = Math.pow(10, decimals)
          const rawAmount = Math.floor(amountNumber * factor)
          amountInWei = rawAmount.toString()
          humanReadableAmount = amountNumber.toString()
        }

        console.log('Converting amount:', humanReadableAmount, 'to wei:', amountInWei, 'with decimals:', decimals)
      } catch (error) {
        console.error('Error converting amount to wei:', error)
        throw new Error(`Failed to convert amount: ${error}`)
      }

      // Check token allowance
      let allowance: string = '0'
      try {
        // Make sure tokenAddress is not null
        if (!actualTokenAddress) {
          throw new Error('Token address is required')
        }

        const allowanceResult = await tokenContract.methods
          .allowance(connection.arbitrumAddress, BRIDGE_CONTRACT_ADDRESS)
          .call()
        if (allowanceResult) {
          allowance = String(allowanceResult)
        }
      } catch (error) {
        console.error('Error getting allowance:', error)
        throw new Error(`Failed to check token allowance: ${error}`)
      }

      // If allowance is not enough, approve the token spending
      if (BigInt(allowance) < BigInt(amountInWei)) {
        try {
          // Ensure we have an address
          if (!connection.arbitrumAddress) {
            throw new Error('No wallet address connected')
          }

          // Return approval status to update UI button
          return { status: 'approval_needed' }

          // Use the exact amount for approval, not a very large value
          // Calculate gas price - use 30% more than current to ensure faster processing
          const gasPrice = await web3.eth.getGasPrice()
          const gasPriceAdjusted = Math.floor(Number(gasPrice) * 1.3) // 30% more than current gas price
          const gasPriceHex = web3.utils.toHex(gasPriceAdjusted)

          console.log(`Requesting approval for ${humanReadableAmount} tokens with gas price ${gasPriceHex}`)

          // Create the transaction object first
          const approveMethod = tokenContract.methods.approve(BRIDGE_CONTRACT_ADDRESS, amountInWei)
          const approveGasEstimate = await approveMethod
            .estimateGas({
              from: connection.arbitrumAddress as string,
            })
            .catch((err) => {
              console.warn('Gas estimation failed for approval, using fallback:', err)
              return 100000 // Fallback gas estimate if estimation fails
            })

          // Create a variable to track if the transaction was canceled by user
          let transactionCanceled = false

          // Request user to confirm the transaction in MetaMask
          // Use send with a promise to get the transaction hash immediately
          const approvalTx = await new Promise((resolve, reject) => {
            let hasTimedOut = false
            let hasResolved = false

            // Set a timeout for the transaction (2 minutes)
            const timeoutId = setTimeout(() => {
              hasTimedOut = true
              if (!hasResolved) {
                reject(new Error('Transaction timeout: The approval request timed out. Please try again.'))
              }
            }, 120000) // 2 minutes timeout

            approveMethod
              .send({
                from: connection.arbitrumAddress as string,
                gasPrice: gasPriceHex,
                gas: String(approveGasEstimate), // Convert to string for Web3
              })
              .on('transactionHash', (hash: string) => {
                console.log('Approval transaction hash:', hash)
                // Clear the timeout once we have a hash
                clearTimeout(timeoutId)

                // Return the hash immediately instead of waiting for confirmation
                hasResolved = true
                resolve({ transactionHash: hash, status: true })
              })
              .on('receipt', (receipt: any) => {
                console.log('Approval transaction receipt:', receipt)
                hasResolved = true
                resolve({ ...receipt, status: receipt.status })
              })
              .on('error', (error: any) => {
                console.error('Approval transaction error:', error)
                // Clear the timeout
                clearTimeout(timeoutId)
                hasResolved = true

                // Check if user rejected the transaction
                if (
                  error.code === 4001 ||
                  error.message.includes('User denied transaction') ||
                  error.message.includes('User rejected') ||
                  error.message.includes('MetaMask Tx Signature') ||
                  error.message.includes('cancel') ||
                  error.message.includes('denied') ||
                  error.message.includes('rejected')
                ) {
                  transactionCanceled = true
                  reject(new Error('Transaction rejected by user'))
                } else if (hasTimedOut) {
                  reject(new Error('Transaction timeout: The approval request timed out. Please try again.'))
                } else {
                  reject(error)
                }
              })
          })

          // Check if transaction was canceled by user
          if (transactionCanceled) {
            throw new Error('Transaction cancelled: You rejected the approval request')
          }

          console.log('Approval transaction completed:', approvalTx)
        } catch (error: any) {
          console.error('Approval failed:', error)

          // Handle specific error cases
          if (
            error.message.includes('User denied') ||
            error.message.includes('User rejected') ||
            error.code === 4001 ||
            error.message.includes('MetaMask Tx Signature') ||
            error.message.includes('cancel') ||
            error.message.includes('denied') ||
            error.message.includes('rejected')
          ) {
            throw new Error('Transaction cancelled: You rejected the approval request')
          } else if (error.message.includes('Transaction was not mined within') || error.message.includes('timeout')) {
            throw new Error(
              'Transaction timed out: The approval transaction is taking longer than expected. Please check your MetaMask and try again.'
            )
          } else {
            throw new Error(`Failed to approve token: ${error.message}`)
          }
        }
      }

      try {
        // Calculate gas price - use higher gas price for faster processing
        const gasPrice = await web3.eth.getGasPrice()
        const gasPriceAdjusted = Math.floor(Number(gasPrice) * 1.3) // 30% more than current gas price
        const gasPriceHex = web3.utils.toHex(gasPriceAdjusted)

        console.log(`Sending bridge transaction with amount ${humanReadableAmount} to address ${hathorAddress}`)

        // Validate the tokenAddress and connection.arbitrumAddress
        if (!actualTokenAddress) {
          throw new Error('Token address is required')
        }

        if (!connection.arbitrumAddress) {
          throw new Error('No wallet address connected')
        }

        // Create the bridge method first with updated parameter names
        const bridgeMethod = bridgeContract.methods.receiveTokensTo(
          config.hathorConfig.networkId,
          actualTokenAddress, // tokenToUse parameter (previously tokenAddress)
          hathorAddress, // hathorTo parameter (previously to)
          amountInWei
        )

        // Estimate gas for the bridge transaction
        const bridgeGasEstimate = await bridgeMethod
          .estimateGas({
            from: connection.arbitrumAddress as string,
          })
          .catch((err) => {
            console.warn('Gas estimation failed for bridge, using fallback:', err)
            return 600000 // Fallback gas estimate if estimation fails
          })

        // Create a variable to track if the transaction was canceled by user
        let transactionCanceled = false
        let txHash = ''

        // Send the bridge transaction and return the hash immediately
        const receipt = await new Promise((resolve, reject) => {
          let hasTimedOut = false
          let hasResolved = false
          let receiptReceived = false

          // Set a timeout for the transaction (3 minutes)
          const timeoutId = setTimeout(() => {
            hasTimedOut = true
            if (!hasResolved) {
              reject(new Error('Transaction timeout: The bridge request timed out. Please try again.'))
            }
          }, 180000) // 3 minutes timeout

          bridgeMethod
            .send({
              from: connection.arbitrumAddress as string,
              gasPrice: gasPriceHex,
              gas: String(bridgeGasEstimate), // Convert to string for Web3
            })
            .on('transactionHash', (hash: string) => {
              console.log('Bridge transaction hash:', hash)
              txHash = hash

              // Store the hash but don't resolve yet - we'll track progress in the UI
              // Just return a status update with confirming status
              resolve({ transactionHash: hash, status: 'confirming' })

              // Clear the timeout since we've started tracking the transaction
              clearTimeout(timeoutId)
            })
            .on('receipt', (receipt: any) => {
              console.log('Bridge transaction receipt:', receipt)
              receiptReceived = true

              // Check if the transaction was successful using type-safe comparison
              let isSuccess = false

              // Handle all possible status types safely
              const status = receipt.status
              if (typeof status === 'boolean') {
                isSuccess = status === true
              } else if (typeof status === 'string') {
                isSuccess = status === '0x1'
              } else if (typeof status === 'number') {
                isSuccess = status === 1
              } else if (typeof status === 'bigint') {
                // Handle bigint case by converting to string first
                isSuccess = status.toString() === '1'
              }

              if (isSuccess) {
                // Log success for debugging
                console.log('Transaction confirmed successful')

                // Create a new event to notify frontend
                if (window && window.dispatchEvent) {
                  const event = new CustomEvent('bridgeTransactionUpdate', {
                    detail: {
                      status: 'confirmed',
                      transactionHash: txHash || receipt.transactionHash,
                      success: true,
                    },
                  })
                  window.dispatchEvent(event)
                }

                // Don't need to resolve again - already resolved with 'confirming'
              } else {
                // Transaction reverted
                console.error('Transaction reverted. Receipt:', receipt)

                // Create a new event to notify frontend
                if (window && window.dispatchEvent) {
                  const event = new CustomEvent('bridgeTransactionUpdate', {
                    detail: {
                      status: 'failed',
                      transactionHash: txHash || receipt.transactionHash,
                      error: simplifyErrorMessage('Transaction reverted on blockchain'),
                      receipt: receipt,
                    },
                  })
                  window.dispatchEvent(event)
                }
              }
            })
            .on('error', (error: any) => {
              console.error('Bridge transaction error:', error)

              // Clear the timeout
              clearTimeout(timeoutId)

              // Don't set hasResolved if we already received a receipt
              // This handles the case where we get both an error and a receipt
              if (!receiptReceived) {
                hasResolved = true
              }

              // Check if we have a transaction hash but still got an error
              // This usually means the transaction was mined but reverted
              if (txHash && !receiptReceived) {
                // Try to manually get the receipt
                web3.eth.getTransactionReceipt(txHash).then((manualReceipt) => {
                  if (manualReceipt) {
                    console.log('Manually retrieved receipt for reverted transaction:', manualReceipt)

                    // Fix type comparison - handle status type safely
                    let isFailed = false

                    // Handle all possible status types safely
                    const status = manualReceipt.status
                    if (typeof status === 'boolean') {
                      isFailed = status === false
                    } else if (typeof status === 'string') {
                      isFailed = status === '0x0'
                    } else if (typeof status === 'number') {
                      isFailed = status === 0
                    } else if (typeof status === 'bigint') {
                      // Handle bigint case by converting to string first
                      isFailed = status.toString() === '0'
                    }

                    if (isFailed) {
                      // Create error event to notify frontend
                      if (window && window.dispatchEvent) {
                        const event = new CustomEvent('bridgeTransactionUpdate', {
                          detail: {
                            status: 'failed',
                            transactionHash: txHash,
                            error: simplifyErrorMessage('Transaction failed on blockchain'),
                            receipt: manualReceipt,
                          },
                        })
                        window.dispatchEvent(event)
                      }
                    } else {
                      // Create success event to notify frontend
                      if (window && window.dispatchEvent) {
                        const event = new CustomEvent('bridgeTransactionUpdate', {
                          detail: {
                            status: 'confirmed',
                            transactionHash: txHash,
                            success: true,
                          },
                        })
                        window.dispatchEvent(event)
                      }
                    }
                  } else {
                    // Dispatch generic error event if we couldn't get a receipt
                    if (window && window.dispatchEvent) {
                      const event = new CustomEvent('bridgeTransactionUpdate', {
                        detail: {
                          status: 'failed',
                          transactionHash: txHash,
                          error: simplifyErrorMessage('Transaction failed on blockchain'),
                        },
                      })
                      window.dispatchEvent(event)
                    }
                  }
                })
              } else {
                // User rejection or other error before getting a transaction hash
                // Create a new event to notify frontend
                if (window && window.dispatchEvent) {
                  const event = new CustomEvent('bridgeTransactionUpdate', {
                    detail: {
                      status: 'failed',
                      error: simplifyErrorMessage(error.message),
                      code: error.code,
                    },
                  })
                  window.dispatchEvent(event)
                }
              }
            })
        })

        // Check if transaction was canceled by user
        if (transactionCanceled) {
          throw new Error('Transaction cancelled: You rejected the bridge request')
        }

        // Return the more detailed receipt information
        return receipt
      } catch (error: any) {
        console.error('Bridge failed:', error)

        // Handle specific error cases
        if (
          error.message.includes('User denied') ||
          error.message.includes('User rejected') ||
          error.code === 4001 ||
          error.message.includes('MetaMask Tx Signature') ||
          error.message.includes('cancel') ||
          error.message.includes('denied') ||
          error.message.includes('rejected')
        ) {
          throw new Error('Transaction cancelled: You rejected the bridge request')
        } else if (error.message.includes('Transaction was not mined within') || error.message.includes('timeout')) {
          throw new Error(
            'Transaction timed out: The bridge transaction is taking longer than expected. Please try again.'
          )
        } else if (
          error.message.includes('Transaction reverted') ||
          error.message.includes('Transaction failed on blockchain') ||
          error.message.includes('execution reverted') ||
          error.message.includes('contract rejected')
        ) {
          // Get any additional details from the error object
          const receiptDetails = error.receipt ? `\nTransaction Hash: ${error.receipt.transactionHash}` : ''
          throw new Error(
            `Transaction reverted: The bridge operation failed on the blockchain. This may be due to incomplete bridge configuration or contract restrictions.${receiptDetails}`
          )
        } else {
          throw new Error(`Failed to bridge token: ${error.message}`)
        }
      }
    },
    [connection.arbitrumConnected, connection.arbitrumProvider, connection.arbitrumAddress]
  )

  // Add a cleanup function in the component to ensure proper cleanup on unmount
  useEffect(() => {
    return () => {
      if (connection.arbitrumProvider) {
        manageEventListeners('cleanup', connection.arbitrumProvider as Web3)
      }
    }
  }, [connection.arbitrumProvider, manageEventListeners])

  // Use a single effect to handle listening for account and chain changes
  // This effect should only run when the provider actually changes, not on every render
  useEffect(() => {
    if (!window.ethereum || !connection.arbitrumProvider) return

    // Get a stable reference to the provider
    const provider = connection.arbitrumProvider

    // Store handler references so we can remove the same handlers later
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts && accounts.length > 0) {
        setConnection((prev) => ({
          ...prev,
          arbitrumAddress: accounts[0],
        }))
      } else {
        // If accounts array is empty, the user has disconnected their wallet
        disconnectArbitrum()
      }
    }

    const handleChainChanged = (chainId: string) => {
      // chainId is in hex, convert to number
      const numericChainId = parseInt(chainId, 16)
      setConnection((prev) => ({
        ...prev,
        arbitrumChainId: numericChainId,
      }))
    }

    // We only add window.ethereum listeners here, not provider listeners
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged) // Remove first to prevent duplicates
      window.ethereum.removeListener('chainChanged', handleChainChanged) // Remove first to prevent duplicates

      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)
    }

    // Return cleanup function
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [connection.arbitrumProvider, disconnectArbitrum])

  const contextValue = {
    connection,
    connectArbitrum,
    disconnectArbitrum,
    loadBalances,
    bridgeTokenToHathor,
  }

  return <BridgeContext.Provider value={contextValue}>{children}</BridgeContext.Provider>
}

// Custom hook to use the bridge context
export const useBridge = () => {
  const context = useContext(BridgeContext)
  if (context === undefined) {
    throw new Error('useBridge must be used within a BridgeProvider')
  }
  return context
}
