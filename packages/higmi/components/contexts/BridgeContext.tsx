import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react'
import Web3 from 'web3'
import { useWalletConnectClient } from './index'
import { useAccount, useNetwork } from '@dozer/zustand'
import BRIDGE_ABI from '../../abis/bridge.json'
import ERC20_ABI from '../../abis/erc20.json'
import EventEmitter from 'events'

// Add ethereum to Window interface
declare global {
  interface Window {
    ethereum: any
  }
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
  bridgeTokenToHathor: (tokenAddress: string, amount: string, hathorAddress: string) => Promise<string>
  claimTokenFromArbitrum: (
    to: string,
    amount: string,
    blockHash: string,
    logIndex: string,
    originChainId: string
  ) => Promise<string>
  pendingClaims: any[]
  loadPendingClaims: (options?: { force?: boolean; silent?: boolean }) => Promise<any[] | void>
}

// Create the context
const BridgeContext = createContext<BridgeContextType | undefined>(undefined)

// Bridge contract addresses - these should come from a config
const BRIDGE_CONTRACT_ADDRESS = '0xB85573bb0D1403Ed56dDF12540cc57662dfB3351'
const HATHOR_FEDERATION_ADDRESS = '0xC2d2318dEa546D995189f14a0F9d39fB1f56D966'

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

  const [pendingClaims, setPendingClaims] = useState<any[]>([])

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

      // Check if connected to Arbitrum (chainId 42161)
      if (chainId !== 42161) {
        try {
          // Try to switch to Arbitrum
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xa4b1' }], // 42161 in hex
          })
        } catch (switchError: any) {
          // If Arbitrum network is not added yet, prompt user to add it
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: '0xa4b1',
                    chainName: 'Arbitrum One',
                    nativeCurrency: {
                      name: 'Ether',
                      symbol: 'ETH',
                      decimals: 18,
                    },
                    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
                    blockExplorerUrls: ['https://arbiscan.io/'],
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
    // Clean up the provider before disconnecting - simplified approach
    if (connection.arbitrumProvider) {
      manageEventListeners('cleanup', connection.arbitrumProvider as Web3)
    }

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
      localStorage.removeItem('arbitrumConnection')
    }
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

      // Create contract instances
      const bridgeContract = new web3.eth.Contract(BRIDGE_ABI as any, BRIDGE_CONTRACT_ADDRESS)
      const tokenContract = new web3.eth.Contract(ERC20_ABI as any, tokenAddress)

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
        if (!tokenAddress) {
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
        if (!tokenAddress) {
          throw new Error('Token address is required')
        }

        if (!connection.arbitrumAddress) {
          throw new Error('No wallet address connected')
        }

        // Create the bridge method first
        const bridgeMethod = bridgeContract.methods.receiveTokensTo(31, tokenAddress, hathorAddress, amountInWei)

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

        // Send the bridge transaction and return the hash immediately
        const receipt = await new Promise((resolve, reject) => {
          let hasTimedOut = false
          let hasResolved = false

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
              // Clear the timeout once we have a hash
              clearTimeout(timeoutId)

              // Return the hash immediately instead of waiting for confirmation
              hasResolved = true
              resolve({ transactionHash: hash, status: true })
            })
            .on('receipt', (receipt: any) => {
              console.log('Bridge transaction receipt:', receipt)
              hasResolved = true
              resolve({ ...receipt, status: receipt.status })
            })
            .on('error', (error: any) => {
              console.error('Bridge transaction error:', error)
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
                reject(new Error('Transaction timeout: The bridge request timed out. Please try again.'))
              } else {
                reject(error)
              }
            })
        })

        // Check if transaction was canceled by user
        if (transactionCanceled) {
          throw new Error('Transaction cancelled: You rejected the bridge request')
        }

        return (receipt as any).transactionHash
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
        } else {
          throw new Error(`Failed to bridge token: ${error.message}`)
        }
      }
    },
    [connection.arbitrumConnected, connection.arbitrumProvider, connection.arbitrumAddress]
  )

  // Claim tokens that were sent from Arbitrum
  const claimTokenFromArbitrum = useCallback(
    async (to: string, amount: string, blockHash: string, logIndex: string, originChainId: string) => {
      if (!connection.arbitrumConnected || !connection.arbitrumProvider || !connection.arbitrumAddress) {
        throw new Error('Not connected to Arbitrum')
      }

      const web3 = connection.arbitrumProvider as Web3
      const bridgeContract = new web3.eth.Contract(BRIDGE_ABI as any, BRIDGE_CONTRACT_ADDRESS)

      try {
        // Calculate gas price
        const gasPrice = await web3.eth.getGasPrice()
        const gasPriceHex = web3.utils.toHex(Math.floor(Number(gasPrice) * 1.1)) // 10% more than current gas price

        // Claim the token
        const receipt = await bridgeContract.methods
          .claim({
            to: to,
            amount: amount,
            blockHash: blockHash,
            transactionHash: blockHash, // Using blockHash as transactionHash as per reference implementation
            logIndex: parseInt(logIndex),
            originChainId: parseInt(originChainId),
          })
          .send({
            from: connection.arbitrumAddress,
            gasPrice: gasPriceHex,
            gas: '400000', // Gas limit as string
          })

        if (!receipt.status) {
          throw new Error('Claim transaction failed')
        }

        return receipt.transactionHash
      } catch (error: any) {
        console.error('Claim failed:', error)
        throw new Error(`Failed to claim token: ${error.message}`)
      }
    },
    [connection.arbitrumConnected, connection.arbitrumProvider, connection.arbitrumAddress]
  )

  // Load pending claims that the user can claim
  const loadPendingClaims = useCallback(
    async (options?: { force?: boolean; silent?: boolean }) => {
      const { force = false, silent = false } = options || {}

      // Skip if required data is missing
      if (
        !hathorAddress ||
        !connection.arbitrumConnected ||
        !connection.arbitrumProvider ||
        !connection.arbitrumAddress
      ) {
        if (!silent) {
          console.log('Cannot load pending claims - missing required data')
        }
        return
      }

      try {
        const web3 = connection.arbitrumProvider as Web3
        const bridgeContract = new web3.eth.Contract(BRIDGE_ABI as any, BRIDGE_CONTRACT_ADDRESS)

        // Only log when force is true or in development and not silent
        if ((force || process.env.NODE_ENV === 'development') && !silent) {
          console.log('Loading pending claims for Hathor address:', hathorAddress.substring(0, 8) + '...')
        }

        // In a real implementation, we would query the bridge contract for events related to token transfers
        // that have not yet been claimed. For now, we'll simulate this with a placeholder implementation.

        // This is just a placeholder for demonstration - in a real implementation, you would:
        // 1. Query bridge contract events for AcceptedCrossTransfer events
        // 2. Filter for events with the user's address
        // 3. Check if they've been claimed already
        // 4. Format the data for UI display

        // Simulate a small delay to make the user experience feel more authentic
        // This helps the user know something happened when they click refresh
        await new Promise((resolve) => setTimeout(resolve, 500))

        // For now, just set an empty array
        setPendingClaims([])

        // Example format for a pending claim:
        /*
      setPendingClaims([
        {
          transactionHash: '0x123abc...',
          tokenSymbol: 'USDC',
          amount: '100.00',
          sender: '0xabc123...',
          status: 'pending'
        }
      ])
      */

        // Log once when claims are loaded, but only when forced or in development and not silent
        if ((force || process.env.NODE_ENV === 'development') && !silent) {
          console.log('Pending claims loaded:', 0)
        }

        return []
      } catch (error) {
        if (!silent) {
          console.error('Error loading pending claims:', error)
        }
        setPendingClaims([])
        return []
      }
    },
    [hathorAddress, connection.arbitrumConnected, connection.arbitrumProvider, connection.arbitrumAddress]
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
    claimTokenFromArbitrum,
    pendingClaims,
    loadPendingClaims,
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
