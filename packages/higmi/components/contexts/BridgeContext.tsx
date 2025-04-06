import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import Web3 from 'web3'
import { useWalletConnectClient } from './index'
import { useNetwork } from '@dozer/zustand'
import BRIDGE_ABI from '../../abis/bridge.json'
import ERC20_ABI from '../../abis/erc20.json'
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

// Define interface for bridge context
interface BridgeContextType {
  bridgeTokenToHathor: (
    tokenAddress: string,
    amount: string,
    hathorAddress: string,
    skipApproval?: boolean
  ) => Promise<
    | {
        status: 'approval_needed' | 'confirming' | 'confirmed'
        transactionHash?: string
      }
    | any
  >
  loadBalances: (tokenAddresses: string[]) => Promise<Record<string, number> | undefined>
  pendingClaims: any[]
  loadPendingClaims: (options?: { silent?: boolean; force?: boolean }) => Promise<void>
  claimTokenFromArbitrum: (
    receiver: string,
    amount: string,
    transactionHash: string,
    logIndex: number,
    originChainId: number
  ) => Promise<any>
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
  const [pendingClaims, setPendingClaims] = useState<any[]>([])

  // Load token balances from Arbitrum
  const loadBalances = useCallback(async (tokenAddresses: string[]) => {
    if (!window.ethereum) return {}

    try {
      const web3 = new Web3(window.ethereum)
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (!accounts || accounts.length === 0) return {}

      const arbitrumAddress = accounts[0]
      const balances: Record<string, number> = {}

      for (const address of tokenAddresses) {
        try {
          // Create token contract instance
          const tokenContract = new web3.eth.Contract(ERC20_ABI as any, address)

          // Get token decimals
          const decimalsResult = await tokenContract.methods.decimals().call()
          const decimals = decimalsResult ? parseInt(String(decimalsResult)) : 18

          // Get token balance
          const rawBalance = await tokenContract.methods.balanceOf(arbitrumAddress).call()

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

      return balances
    } catch (error) {
      console.error('Error loading balances:', error)
      return {}
    }
  }, [])

  // Load pending claims from the bridge
  const loadPendingClaims = useCallback(async (options?: { silent?: boolean; force?: boolean }) => {
    const silent = options?.silent || false
    const force = options?.force || false

    try {
      if (!window.ethereum) return

      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (!accounts || accounts.length === 0) return

      // Create a simple endpoint URL to get claims
      const arbitrumAddress = accounts[0]
      const federationUrl = `${ARBITRUM_FEDERATION_HOST}/claims/${arbitrumAddress}`

      // Fetch claims from the federation server
      const response = await fetch(federationUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch claims: ${response.statusText}`)
      }

      const data = await response.json()
      setPendingClaims(data.claims || [])

      if (!silent && data.claims && data.claims.length > 0) {
        console.log(`Found ${data.claims.length} pending claims for ${arbitrumAddress}`)
      } else if (!silent && force) {
        console.log(`No pending claims found for ${arbitrumAddress}`)
      }
    } catch (error) {
      console.error('Error loading pending claims:', error)
      if (!silent) {
        throw error
      }
    }
  }, [])

  // Claim tokens from Arbitrum bridge
  const claimTokenFromArbitrum = useCallback(
    async (receiver: string, amount: string, transactionHash: string, logIndex: number, originChainId: number) => {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed')
      }

      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (!accounts || accounts.length === 0) {
          throw new Error('No wallet connected')
        }

        // Create federation claim endpoint URL
        const federationUrl = `${ARBITRUM_FEDERATION_HOST}/claim`

        // Create POST request to claim tokens
        const response = await fetch(federationUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            receiver,
            amount,
            transactionHash,
            logIndex,
            originChainId,
            arbitrumAddress: accounts[0],
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Failed to claim tokens: ${errorText}`)
        }

        const result = await response.json()
        console.log('Claim result:', result)

        return result
      } catch (error) {
        console.error('Error claiming tokens:', error)
        throw error
      }
    },
    []
  )

  // Bridge a token from Arbitrum to Hathor
  const bridgeTokenToHathor = useCallback(
    async (tokenAddress: string, amount: string, hathorAddress: string, skipApproval = false) => {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed')
      }

      // Verify we have an account connected
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (!accounts || accounts.length === 0) {
        throw new Error('No wallet connected')
      }

      const arbitrumAddress = accounts[0]
      const web3 = new Web3(window.ethereum)

      console.log(
        'Starting bridge process with token:',
        tokenAddress,
        'amount:',
        amount,
        'hathor address:',
        hathorAddress
      )

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

      console.log('Using bridge contract at address:', BRIDGE_CONTRACT_ADDRESS)
      console.log('Using token contract at address:', actualTokenAddress)

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
        console.log('Token decimals retrieved:', decimals)
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

      // First check token balance to ensure user has enough tokens
      try {
        const balanceWei = await tokenContract.methods.balanceOf(arbitrumAddress).call()
        console.log('Current token balance:', balanceWei)

        const balanceWeiString = String(balanceWei || '0')
        if (BigInt(balanceWeiString) < BigInt(amountInWei)) {
          throw new Error('Insufficient token balance. Please check your balance and try again.')
        }
      } catch (error: any) {
        console.error('Error checking token balance:', error)
        if (error.message && error.message.includes('Insufficient')) {
          throw error
        }
        // For other errors, continue with the transaction
      }

      // Check token allowance only if not skipping approval
      if (!skipApproval) {
        let allowance: string = '0'
        try {
          // Make sure tokenAddress is not null
          if (!actualTokenAddress) {
            throw new Error('Token address is required')
          }

          const allowanceResult = await tokenContract.methods.allowance(arbitrumAddress, BRIDGE_CONTRACT_ADDRESS).call()
          if (allowanceResult) {
            allowance = String(allowanceResult)
          }
          console.log('Current allowance:', allowance, 'Required amount:', amountInWei)
        } catch (error) {
          console.error('Error getting allowance:', error)
          throw new Error(`Failed to check token allowance: ${error}`)
        }

        // If allowance is not enough, execute approval
        if (BigInt(allowance) < BigInt(amountInWei)) {
          try {
            console.log(`Executing approval for ${humanReadableAmount} tokens`)

            // Use a higher amount for approval to avoid needing to approve again - use the exact token's decimal system
            let approvalAmount: string
            if (decimals === 18) {
              approvalAmount = web3.utils.toWei('1000000000', 'ether') // Very large amount for 18 decimals
            } else {
              // For non-standard decimals, create a suitable large approval
              const factor = Math.pow(10, decimals)
              approvalAmount = (1000000000 * factor).toString()
            }

            console.log('Approval amount:', approvalAmount)

            // Create approve method
            const approveMethod = tokenContract.methods.approve(BRIDGE_CONTRACT_ADDRESS, approvalAmount)

            // Estimate gas for approval
            const approveGasEstimate = await approveMethod
              .estimateGas({
                from: arbitrumAddress,
              })
              .catch((err) => {
                console.warn('Gas estimation failed for approval, using fallback:', err)
                return 100000 // Fallback gas estimate
              })

            console.log('Estimated gas for approval:', approveGasEstimate)

            // Calculate gas price
            const gasPrice = await web3.eth.getGasPrice()
            const gasPriceAdjusted = Math.floor(Number(gasPrice) * 1.1) // 10% more than current
            console.log('Gas price for approval:', gasPriceAdjusted)

            // Execute the approval transaction
            console.log('Sending approval transaction...')
            const approveTx = await approveMethod.send({
              from: arbitrumAddress,
              gas: String(Math.floor(Number(approveGasEstimate) * 1.2)),
              gasPrice: String(gasPriceAdjusted),
            })

            console.log('Approval transaction completed:', approveTx.transactionHash)

            // Verify the approval succeeded by checking allowance again
            const newAllowance = await tokenContract.methods.allowance(arbitrumAddress, BRIDGE_CONTRACT_ADDRESS).call()
            console.log('New allowance after approval:', newAllowance)

            if (BigInt(String(newAllowance)) < BigInt(amountInWei)) {
              throw new Error('Approval transaction completed but allowance is still insufficient')
            }

            // After successful approval, try bridging
            return bridgeTokenToHathor(tokenAddress, amount, hathorAddress, true)
          } catch (error) {
            console.error('Error during token approval:', error)
            throw error
          }
        }
      }

      // If we reach here, either the allowance was already sufficient or approval succeeded
      try {
        // Bridge the token
        // Use the exact amount and hathor address
        const bridgeParams = {
          token: actualTokenAddress,
          amountWei: amountInWei,
          hathorAddress: hathorAddress,
        }

        console.log('Executing bridge transaction with params:', bridgeParams)

        // Verify the token contract exists and has proper balance to transfer
        try {
          const balance = await tokenContract.methods.balanceOf(arbitrumAddress).call()
          console.log('Current balance before bridge:', balance)
          if (BigInt(String(balance)) < BigInt(bridgeParams.amountWei)) {
            throw new Error(
              `Insufficient token balance. You have ${balance} but trying to send ${bridgeParams.amountWei}`
            )
          }

          // Check allowance one more time to be sure
          const currentAllowance = await tokenContract.methods
            .allowance(arbitrumAddress, BRIDGE_CONTRACT_ADDRESS)
            .call()
          console.log('Current allowance before bridge:', currentAllowance)
          if (BigInt(String(currentAllowance)) < BigInt(bridgeParams.amountWei)) {
            throw new Error('Insufficient allowance. Please try again or increase token approval.')
          }
        } catch (error) {
          console.error('Error in pre-bridge verification:', error)
          throw error
        }

        // Create method call parameters with correct order and types
        const bridgeMethod = bridgeContract.methods.receiveTokensTo(
          config.hathorConfig.networkId,
          bridgeParams.token,
          bridgeParams.hathorAddress,
          bridgeParams.amountWei
        )

        // Log the method being called for debugging
        console.log('Bridge method:', bridgeMethod)
        console.log('Using networkId:', config.hathorConfig.networkId)

        // Estimate gas
        console.log('Estimating gas for bridge operation...')
        const gasEstimate = await bridgeMethod
          .estimateGas({
            from: arbitrumAddress,
          })
          .catch((err) => {
            console.error('Gas estimation failed:', err)
            throw new Error(`Gas estimation failed: ${err.message}`)
          })

        console.log('Estimated gas for bridge:', gasEstimate)

        // Calculate gas price
        const gasPrice = await web3.eth.getGasPrice()
        const gasPriceAdjusted = Math.floor(Number(gasPrice) * 1.1) // 10% more than current
        console.log('Gas price for bridge:', gasPriceAdjusted)

        // Execute the transaction
        console.log('Sending bridge transaction...')
        const bridgeTx = await bridgeMethod.send({
          from: arbitrumAddress,
          gas: String(Math.floor(Number(gasEstimate) * 1.2)), // Convert to string
          gasPrice: String(gasPriceAdjusted), // Convert to string
        })

        console.log('Bridge transaction completed:', bridgeTx.transactionHash)

        // Return transaction hash for tracking
        return {
          status: 'confirming' as const,
          transactionHash: bridgeTx.transactionHash,
        }
      } catch (error) {
        console.error('Error during bridge operation:', error)
        throw error
      }
    },
    []
  )

  const contextValue = {
    bridgeTokenToHathor,
    loadBalances,
    pendingClaims,
    loadPendingClaims,
    claimTokenFromArbitrum,
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
