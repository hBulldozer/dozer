import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import Web3 from 'web3'
import { useWalletConnectClient } from './index'
import { useAccount, useNetwork } from '@dozer/zustand'

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
  loadPendingClaims: () => Promise<void>
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
      setConnection((prev) => ({ ...prev, connecting: true, error: null }))
      
      const provider = new Web3(window.ethereum)
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const chainId = await provider.eth.getChainId()
      
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
    }
  }

  // Disconnect from Arbitrum
  const disconnectArbitrum = () => {
    setConnection({
      arbitrumProvider: null,
      arbitrumConnected: false,
      arbitrumAddress: null,
      arbitrumChainId: null,
      arbitrumBalance: {},
      connecting: false,
      error: null,
    })
  }

  // Load token balances from Arbitrum
  const loadBalances = useCallback(async (tokenAddresses: string[]) => {
    if (!connection.arbitrumConnected || !connection.arbitrumProvider) return
    
    // TODO: Implement ERC20 balance loading for each token
    // This is a placeholder for now
    const balances: Record<string, number> = {}
    
    for (const address of tokenAddresses) {
      // Fetch balance using Web3
      // This will need to be implemented with actual ERC20 contract calls
      balances[address] = 0
    }
    
    setConnection((prev) => ({
      ...prev,
      arbitrumBalance: balances,
    }))
  }, [connection.arbitrumConnected, connection.arbitrumProvider])

  // Bridge a token from Arbitrum to Hathor
  const bridgeTokenToHathor = useCallback(async (tokenAddress: string, amount: string, hathorAddress: string) => {
    if (!connection.arbitrumConnected || !connection.arbitrumProvider) {
      throw new Error('Not connected to Arbitrum')
    }
    
    // This is a placeholder - actual implementation will need:
    // 1. Load Bridge & ERC20 ABIs
    // 2. Create contract instances
    // 3. Approve token spending if needed
    // 4. Call bridge contract's receiveTokensTo method
    
    return 'transaction-hash-placeholder'
  }, [connection.arbitrumConnected, connection.arbitrumProvider])

  // Claim tokens that were sent from Arbitrum
  const claimTokenFromArbitrum = useCallback(async (
    to: string,
    amount: string,
    blockHash: string,
    logIndex: string,
    originChainId: string
  ) => {
    if (!connection.arbitrumConnected || !connection.arbitrumProvider) {
      throw new Error('Not connected to Arbitrum')
    }
    
    // This is a placeholder - actual implementation will need:
    // 1. Load Bridge ABI
    // 2. Create contract instance
    // 3. Call claim method with appropriate parameters
    
    return 'transaction-hash-placeholder'
  }, [connection.arbitrumConnected, connection.arbitrumProvider])

  // Load pending claims that the user can claim
  const loadPendingClaims = useCallback(async () => {
    if (!hathorAddress || !connection.arbitrumConnected) return
    
    // This is a placeholder - actual implementation will need:
    // 1. Query bridge events to find unclaimed tokens for the user
    // 2. Format the data for UI display
    
    setPendingClaims([])
  }, [hathorAddress, connection.arbitrumConnected])

  // Effect to listen for account changes in MetaMask
  useEffect(() => {
    if (window.ethereum && connection.arbitrumConnected) {
      const handleAccountsChanged = (accounts: string[]) => {
        setConnection((prev) => ({
          ...prev,
          arbitrumAddress: accounts[0],
        }))
      }

      const handleChainChanged = (chainId: string) => {
        // chainId is in hex, convert to number
        const numericChainId = parseInt(chainId, 16)
        setConnection((prev) => ({
          ...prev,
          arbitrumChainId: numericChainId,
        }))
      }

      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [connection.arbitrumConnected])

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
