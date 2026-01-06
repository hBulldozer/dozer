import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import Web3 from 'web3'
import { useWalletConnectClient } from './index'
import { useNetwork, useAccount } from '@dozer/zustand'
import BRIDGE_ABI from '../../abis/bridge.json'
import ERC20_ABI from '../../abis/erc20.json'
import config from '../../config/bridge'

// Add ethereum to Window interface
declare global {
  interface Window {
    ethereum: any
  }
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
const ARBITRUM_FEDERATION_HOST = config.arbitrumFederationHost

// Create a provider component
export const BridgeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { accounts } = useWalletConnectClient()
  const hathorAddress = accounts && accounts.length > 0 ? accounts[0].split(':')[2] : ''
  const [pendingClaims, setPendingClaims] = useState<any[]>([])

  // Load token balances from Arbitrum
  const loadBalances = useCallback(async (tokenAddresses: string[]) => {
    // Wait for ethereum provider to be available (browser extension might take time to inject)
    let ethereum = window.ethereum
    if (!ethereum) {
      await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
      ethereum = window.ethereum
      if (!ethereum) {
        return {}
      }
    }

    try {
      // Check if MetaMask is on the correct network
      const currentChainId = await ethereum.request({ method: 'eth_chainId' })
      const expectedChainId = config.ethereumConfig.chainIdHex

      // If wrong network, return empty balances to avoid RPC errors
      if (currentChainId !== expectedChainId) {
        return {}
      }

      const web3 = new Web3(ethereum)

      const accounts = await ethereum.request({ method: 'eth_accounts' })

      if (!accounts || accounts.length === 0) {
        return {}
      }

      const arbitrumAddress = accounts[0]
      const balances: Record<string, number> = {}

      // Pre-configured decimals for known tokens
      const knownTokenDecimals: Record<string, { decimals: number; symbol: string }> = {
        // USDC on Sepolia
        '0x3e1adb4e24a48b90ca10c28388ce733a6267bac4': { decimals: 6, symbol: 'USDC' },
        // SLT7 on Sepolia
        '0x97118caae1f773a84462490dd01fe7a3e7c4cdcd': { decimals: 18, symbol: 'SLT7' },
        // WBTC on Sepolia (example)
        '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f': { decimals: 8, symbol: 'WBTC' },
      }

      for (const address of tokenAddresses) {
        try {
          const normalizedAddress = address.toLowerCase()
          let decimals = 18
          let symbol = 'UNKNOWN'
          let rawBalance = '0'

          try {
            // Create token contract instance with error handling
            const tokenContract = new web3.eth.Contract(ERC20_ABI as any, address)

            // Check that required methods exist before calling them
            // Get token balance first - this should work even if other methods fail
            try {
              if (typeof tokenContract.methods.balanceOf === 'function') {
                rawBalance = await tokenContract.methods.balanceOf(arbitrumAddress).call()
              } else {
                // Try direct RPC call as fallback
                const data = web3.eth.abi.encodeFunctionCall(
                  {
                    name: 'balanceOf',
                    type: 'function',
                    inputs: [{ type: 'address', name: 'account' }],
                  },
                  [arbitrumAddress]
                )

                const balance = await web3.eth.call({
                  to: address,
                  data,
                })

                rawBalance = balance ? web3.utils.hexToNumberString(balance) : '0'
              }
            } catch (balanceError) {
              // Silently fail - token might not exist on this network
              rawBalance = '0'
            }

            // Try to get token symbol and decimals using the contract methods
            try {
              if (typeof tokenContract.methods.symbol === 'function') {
                const symbolResult = await tokenContract.methods.symbol().call()
                if (symbolResult) {
                  symbol = String(symbolResult)
                }
              }
            } catch (err) {
              // Silently fail - will use fallback
            }

            try {
              if (typeof tokenContract.methods.decimals === 'function') {
                const decimalResult = await tokenContract.methods.decimals().call()
                if (decimalResult) {
                  decimals = parseInt(String(decimalResult))
                }
              }
            } catch (err) {
              // Silently fail - will use default 18
            }
          } catch (contractError) {
            // Silently fail - token contract doesn't exist
          }

          // Use known token info if contract methods failed
          if (knownTokenDecimals[normalizedAddress]) {
            if (symbol === 'UNKNOWN') {
              symbol = knownTokenDecimals[normalizedAddress].symbol
            }
            if (decimals === 18) {
              decimals = knownTokenDecimals[normalizedAddress].decimals
            }
          }

          // Convert raw balance to human-readable format based on decimals
          const divisor = Math.pow(10, decimals)
          balances[address] = parseFloat(String(rawBalance)) / divisor
        } catch (error) {
          // Silently fail for individual token
          balances[address] = 0
        }
      }

      return balances
    } catch (error) {
      // Silently fail and return empty balances
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

      // Validate Hathor address format
      if (!hathorAddress || !hathorAddress.match(/^[a-zA-Z0-9]{34,42}$/)) {
        console.error('Invalid Hathor address format:', hathorAddress)
        throw new Error('Invalid Hathor address format. Please ensure you are connected with a valid Hathor wallet.')
      }

      // Use the token address provided - this should be the EVM token address (originalAddress)
      const actualTokenAddress = tokenAddress

      // Create contract instances
      const bridgeContract = new web3.eth.Contract(BRIDGE_ABI as any, BRIDGE_CONTRACT_ADDRESS)
      const tokenContract = new web3.eth.Contract(ERC20_ABI as any, actualTokenAddress)

      console.log('Using bridge contract at address:', BRIDGE_CONTRACT_ADDRESS)
      console.log('Using token contract at address:', actualTokenAddress)

      // Get token decimals (fallback to 18 if call fails)
      let decimals: number = 18
      try {
        // Check for known tokens first - USDC is always 6 decimals
        if (actualTokenAddress.toLowerCase() === '0x3e1adb4e24a48b90ca10c28388ce733a6267bac4'.toLowerCase()) {
          // This is USDC on Sepolia - always 6 decimals
          decimals = 6
          console.log('Detected USDC token, using 6 decimals')
        } else {
          // Try to get decimals from the contract
          try {
            const decimalResult = await tokenContract.methods.decimals().call()
            if (decimalResult) {
              decimals = parseInt(String(decimalResult))
              console.log('Token decimals retrieved from contract:', decimals)
            }
          } catch (error) {
            console.warn('Could not get decimals from contract method, using default or known values')

            // Last resort - check token symbol
            try {
              const symbol = await tokenContract.methods.symbol().call()
              const symbolStr = String(symbol || '')
              if (symbolStr && (symbolStr.toUpperCase() === 'USDC' || symbolStr.toUpperCase() === 'HUSDC')) {
                decimals = 6
                console.log('Detected USDC token by symbol, using 6 decimals')
              }
            } catch (symbolError) {
              console.warn('Could not determine token symbol')
            }
          }
        }
      } catch (error) {
        console.warn('Error determining token decimals, using default 18:', error)
      }

      console.log('Final token decimals being used:', decimals)

      // Convert amount to wei format based on decimals
      let amountInWei: string
      let humanReadableAmount: string
      try {
        // Parse amount to a number and handle potential errors
        const amountNumber = parseFloat(amount)
        if (isNaN(amountNumber) || amountNumber <= 0) {
          throw new Error('Invalid amount: must be a positive number')
        }

        humanReadableAmount = amount

        // Convert based on token decimals
        const factor = Math.pow(10, decimals)
        const rawAmount = Math.floor(amountNumber * factor)
        amountInWei = rawAmount.toString()

        console.log(
          `Converting amount: ${humanReadableAmount} to smallest unit: ${amountInWei} ` +
            `(${amountNumber} × 10^${decimals})`
        )
      } catch (error) {
        console.error('Error converting amount to wei:', error)
        throw new Error(`Failed to convert amount: ${error}`)
      }

      // First check token balance to ensure user has enough tokens
      try {
        const balanceWei = await tokenContract.methods.balanceOf(arbitrumAddress).call()
        const balanceWeiString = String(balanceWei || '0')

        // Convert balance to a human-readable format for error messages
        const balanceInTokens = (Number(balanceWei) / Math.pow(10, decimals)).toFixed(decimals)
        console.log(
          `Current token balance: ${balanceWeiString} (${balanceInTokens} ${humanReadableAmount.replace(/[\d.]/g, '')})`
        )

        if (BigInt(balanceWeiString) < BigInt(amountInWei)) {
          throw new Error(
            `Insufficient token balance. You have ${balanceInTokens} tokens but are trying to send ${humanReadableAmount}.`
          )
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

          // Display allowance in human-readable format
          const allowanceInTokens = (Number(allowance) / Math.pow(10, decimals)).toFixed(decimals)
          console.log(
            `Current allowance: ${allowance} (${allowanceInTokens} tokens), ` +
              `Required amount: ${amountInWei} (${humanReadableAmount} tokens)`
          )
        } catch (error) {
          console.error('Error getting allowance:', error)
          throw new Error(`Failed to check token allowance: ${error}`)
        }

        // If allowance is not enough, execute approval
        if (BigInt(allowance) < BigInt(amountInWei)) {
          try {
            console.log(`Executing approval for ${humanReadableAmount} tokens`)

            // Dispatch approval started event
            window.dispatchEvent(
              new CustomEvent('bridgeApprovalStarted', {
                detail: { tokenAddress: actualTokenAddress, amount: humanReadableAmount },
              })
            )

            // Approve only the exact amount needed for this transaction
            // This is more secure and follows best practices
            const approvalAmount = amountInWei

            console.log(`Setting approval to ${humanReadableAmount} tokens (${approvalAmount} in smallest units)`)

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

            // Execute the approval transaction with immediate feedback
            console.log('Sending approval transaction...')
            const approveTxHash = await new Promise<string>((resolve, reject) => {
              try {
                const txPromise = approveMethod.send({
                  from: arbitrumAddress,
                  gas: String(Math.floor(Number(approveGasEstimate) * 1.2)),
                  gasPrice: String(gasPriceAdjusted),
                })

                txPromise
                  .on('transactionHash', (hash: string) => {
                    console.log('Approval transaction accepted by user:', hash)
                    // Dispatch approval transaction sent event immediately when user accepts
                    window.dispatchEvent(
                      new CustomEvent('bridgeApprovalSent', {
                        detail: { txHash: hash },
                      })
                    )
                    resolve(hash)
                  })
                  .on('error', (error: any) => {
                    console.error('Approval transaction error:', error)
                    // Check if this is a user rejection
                    if (error.code === 4001 || error.message?.includes('User denied')) {
                      reject(new Error('Transaction cancelled: You rejected the request in MetaMask'))
                    } else {
                      reject(error)
                    }
                  })
                  .catch((error: any) => {
                    console.error('Approval transaction promise rejection:', error)
                    // Check if this is a user rejection
                    if (error.code === 4001 || error.message?.includes('User denied') || error.message?.includes('MetaMask Tx Signature')) {
                      reject(new Error('Transaction cancelled: You rejected the request in MetaMask'))
                    } else {
                      reject(error)
                    }
                  })
              } catch (error: any) {
                console.error('Approval transaction immediate error:', error)
                // Check if this is a user rejection
                if (error.code === 4001 || error.message?.includes('User denied') || error.message?.includes('MetaMask Tx Signature')) {
                  reject(new Error('Transaction cancelled: You rejected the request in MetaMask'))
                } else {
                  reject(error)
                }
              }
            })

            console.log('Approval transaction completed:', approveTxHash)

            // Wait for transaction confirmation and verify allowance
            await new Promise<void>((resolve, reject) => {
              const checkConfirmation = async () => {
                try {
                  const receipt = await web3.eth.getTransactionReceipt(approveTxHash)
                  if (receipt && receipt.status) {
                    // Verify the approval succeeded by checking allowance
                    const newAllowance = await tokenContract.methods
                      .allowance(arbitrumAddress, BRIDGE_CONTRACT_ADDRESS)
                      .call()
                    console.log('New allowance after approval:', newAllowance)

                    if (BigInt(String(newAllowance)) < BigInt(amountInWei)) {
                      reject(new Error('Approval transaction completed but allowance is still insufficient'))
                      return
                    }

                    // Dispatch approval confirmed event
                    window.dispatchEvent(
                      new CustomEvent('bridgeApprovalConfirmed', {
                        detail: { txHash: approveTxHash },
                      })
                    )
                    resolve()
                  } else if (receipt && !receipt.status) {
                    reject(new Error('Approval transaction failed'))
                  }
                  // If no receipt yet, keep waiting
                } catch (error) {
                  console.error('Error checking approval confirmation:', error)
                  // Keep trying
                }
              }

              // Check immediately
              checkConfirmation()
              // Then check every 3 seconds
              const interval = setInterval(checkConfirmation, 3000)

              // Cleanup after 5 minutes
              setTimeout(() => {
                clearInterval(interval)
                reject(new Error('Approval confirmation timeout'))
              }, 5 * 60 * 1000)
            })

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

        // Execute the transaction with immediate feedback
        console.log('Sending bridge transaction...')
        const bridgeTxHash = await new Promise<string>((resolve, reject) => {
          try {
            const txPromise = bridgeMethod.send({
              from: arbitrumAddress,
              gas: String(Math.floor(Number(gasEstimate) * 1.2)),
              gasPrice: String(gasPriceAdjusted),
            })

            txPromise
              .on('transactionHash', (hash: string) => {
                console.log('Bridge transaction accepted by user:', hash)
                // Dispatch bridge transaction sent event immediately when user accepts
                window.dispatchEvent(
                  new CustomEvent('bridgeTransactionSent', {
                    detail: { txHash: hash },
                  })
                )
                resolve(hash)
              })
              .on('error', (error: any) => {
                console.error('Bridge transaction error:', error)
                // Check if this is a user rejection
                if (error.code === 4001 || error.message?.includes('User denied')) {
                  reject(new Error('Transaction cancelled: You rejected the request in MetaMask'))
                } else {
                  reject(error)
                }
              })
              .catch((error: any) => {
                console.error('Bridge transaction promise rejection:', error)
                // Check if this is a user rejection
                if (error.code === 4001 || error.message?.includes('User denied') || error.message?.includes('MetaMask Tx Signature')) {
                  reject(new Error('Transaction cancelled: You rejected the request in MetaMask'))
                } else {
                  reject(error)
                }
              })
          } catch (error: any) {
            console.error('Bridge transaction immediate error:', error)
            // Check if this is a user rejection
            if (error.code === 4001 || error.message?.includes('User denied') || error.message?.includes('MetaMask Tx Signature')) {
              reject(new Error('Transaction cancelled: You rejected the request in MetaMask'))
            } else {
              reject(error)
            }
          }
        })

        console.log('Bridge transaction hash received:', bridgeTxHash)

        // Note: Removed notification creation - now using bridge stepper instead

        // Return transaction hash for tracking
        return {
          status: 'confirming' as const,
          transactionHash: bridgeTxHash,
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
