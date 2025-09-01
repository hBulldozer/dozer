import { ChevronLeftIcon, ArrowPathIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/solid'
import { Button, Currency, Dialog, IconButton, NetworkIcon, SlideIn, Typography, Loader } from '@dozer/ui'
import React, { Dispatch, FC, SetStateAction, useEffect, useState, useCallback } from 'react'
import { ProfileView } from './Profile'
import { client, toToken } from '@dozer/api'
import { TokenBalance, useAccount, useNetwork } from '@dozer/zustand'
import { getTokens, Token } from '@dozer/currency'
import { useBridge } from '../../../components/contexts/BridgeContext'
import Web3 from 'web3'
import { useSDK } from '@metamask/sdk-react'
import Image from 'next/image'
import bridgeConfig, { IS_TESTNET } from '../../../config/bridge'

interface TokensEVMProps {
  setView: Dispatch<SetStateAction<ProfileView>>
  client: typeof client
}

export const TokensEVM: FC<TokensEVMProps> = ({ setView, client }) => {
  const { session } = useWalletConnectClient()
  const { connected: metaMaskConnected, connecting, account: metaMaskAccount, sdk } = useSDK()
  const { loadBalances } = useBridge()
  const [isLoading, setIsLoading] = useState(false)
  const [tokenBalances, setTokenBalances] = useState<Record<string, number>>({})
  const [error, setError] = useState<string>('')
  const [currentNetwork, setCurrentNetwork] = useState<string>('')
  const { data: prices } = client.getPrices.all.useQuery()


  // Get the correct network configuration based on test environment
  const networkConfig = IS_TESTNET ? bridgeConfig.ethereumConfig.name : 'Arbitrum One'

  // Check network on component mount
  useEffect(() => {
    const checkNetwork = async () => {
      if (window.ethereum && metaMaskConnected) {
        try {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' })
          const networkId = parseInt(chainId, 16)

          // Expected chain ID based on config
          const expectedChainId = IS_TESTNET ? bridgeConfig.ethereumConfig.networkId : 42161 // Arbitrum One

          if (networkId !== expectedChainId) {
            setError(`Please connect to ${networkConfig} in MetaMask`)
            console.warn(`Wrong network detected. Expected: ${expectedChainId}, Got: ${networkId}`)
            setCurrentNetwork(`Wrong network (${networkId})`)
          } else {
            setError('')
            setCurrentNetwork(networkConfig)
          }
        } catch (err) {
          console.error('Error checking network:', err)
          setCurrentNetwork('Unknown')
        }
      }
    }

    checkNetwork()
  }, [metaMaskConnected, networkConfig])

  // Get bridged tokens from the same source as Bridge component (database API)
  const { data: tokens } = client.getTokens.all.useQuery()
  
  const bridgedTokens = React.useMemo(() => {
    if (!tokens) return []
    
    // Filter tokens that are bridged (same logic as Bridge component)
    return tokens
      .filter((token) => token.bridged)
      .map((token) => {
        // Convert null values to undefined for correct Token initialization (same as Bridge component)
        const { originalAddress, sourceChain, targetChain, imageUrl, ...rest } = token
        return new Token({
          ...rest,
          originalAddress: originalAddress || undefined,
          sourceChain: sourceChain || undefined,
          targetChain: targetChain || undefined,
          imageUrl: imageUrl || undefined,
        })
      })
  }, [tokens])

  // Extract fetchBalances to a separate function to avoid duplication
  const fetchBalances = useCallback(async () => {
    setIsLoading(true)
    try {
      // Check if we're on the correct network first
      if (window.ethereum) {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' })
        const networkId = parseInt(chainId, 16)

        // Expected chain ID based on config
        const expectedChainId = IS_TESTNET ? bridgeConfig.ethereumConfig.networkId : 42161 // Arbitrum One

        if (networkId !== expectedChainId) {
          throw new Error(`Please switch to ${networkConfig} network in MetaMask to view balances`)
        }
      }

      // Load balances for each token individually (same as BridgeBalancePanel)
      const newBalances: Record<string, number> = {}
      
      for (const token of bridgedTokens) {
        if (token.originalAddress) {
          try {
            const balances = await loadBalances([token.originalAddress])
            const balance = balances?.[token.originalAddress] || 0
            newBalances[token.originalAddress] = balance
          } catch (error) {
            console.error(`TokensEVM: Error loading balance for ${token.symbol}:`, error)
            newBalances[token.originalAddress] = 0
          }
        }
      }
      
      setTokenBalances(newBalances)
    } catch (error: any) {
      console.error('Error loading EVM token balances:', error)
      setError(error.message || 'Failed to load token balances')
    } finally {
      setIsLoading(false)
    }
  }, [bridgedTokens, loadBalances, networkConfig])

  // Load token balances when MetaMask is connected
  useEffect(() => {
    if (metaMaskConnected && metaMaskAccount && bridgedTokens.length > 0 && !error) {
      // Clear existing balances first to avoid showing stale data
      setTokenBalances({})
      fetchBalances()
    }
  }, [metaMaskConnected, metaMaskAccount, bridgedTokens, error, fetchBalances])

  // Add a separate effect for immediate refresh on mount if connected
  useEffect(() => {
    if (metaMaskConnected && metaMaskAccount && !error) {
      fetchBalances()
    } else if (!metaMaskConnected) {
      // Clear balances when disconnected
      setTokenBalances({})
    }
  }, [metaMaskConnected, metaMaskAccount, error, fetchBalances])

  // Connect to MetaMask
  const connectMetaMask = async () => {
    if (!sdk) return

    setError('')
    try {
      await sdk.connect()

      // Check if we're on the correct network after connecting
      if (window.ethereum) {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' })
        const networkId = parseInt(chainId, 16)

        // Expected chain ID based on config
        const expectedChainId = IS_TESTNET ? bridgeConfig.ethereumConfig.networkId : 42161 // Arbitrum One

        if (networkId !== expectedChainId) {
          try {
            // Try to switch to the correct network
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x' + expectedChainId.toString(16) }],
            })
            console.log(`Switched to ${networkConfig}`)
          } catch (switchError: any) {
            // This error code indicates that the chain has not been added to MetaMask
            if (switchError.code === 4902) {
              setError(`Please add the ${networkConfig} network to your MetaMask and try again`)
            } else {
              setError(`Please switch to ${networkConfig} in your MetaMask`)
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Failed to connect to MetaMask:', error)
      setError(error.message || 'Failed to connect to MetaMask')
    }
  }

  // Disconnect from MetaMask
  const disconnectMetaMask = () => {
    if (!sdk) return

    try {
      sdk.terminate()
      // Clear balances to prevent showing stale data
      setTokenBalances({})
      setError('')
    } catch (error) {
      console.error('Error disconnecting from MetaMask:', error)
    }
  }

  // Refresh balances function simplified
  const refreshBalances = () => {
    fetchBalances()
  }

  // Determine overall loading state
  const loading = isLoading

  return (
    <div className="">
      <div className="grid items-center h-12 grid-cols-3 px-2 border-b border-stone-200/20">
        <div className="flex items-center">
          <IconButton onClick={() => setView(ProfileView.Default)}>
            <ChevronLeftIcon width={24} height={24} className="text-stone-400" />
          </IconButton>
        </div>
        <Typography weight={600} className="ml-5 text-stone-400">
          Tokens (EVM)
        </Typography>
        <div className="flex items-center justify-end gap-2">
          {currentNetwork && (
            <Typography variant="xs" className="mr-1 text-stone-400">
              {currentNetwork}
            </Typography>
          )}
          {metaMaskConnected && (
            <>
              <IconButton onClick={refreshBalances} disabled={loading} className="mr-1">
                <ArrowPathIcon width={20} height={20} className={`text-stone-400 ${loading ? 'animate-spin' : ''}`} />
              </IconButton>
              <IconButton onClick={disconnectMetaMask} className="mr-2">
                <ArrowRightOnRectangleIcon width={20} height={20} className="text-stone-400" />
              </IconButton>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col max-h-[300px] scroll">
        {!metaMaskConnected ? (
          <div className="flex flex-col items-center justify-center p-8">
            <Typography variant="sm" className="mb-3 text-center text-stone-400">
              Connect to MetaMask to view your EVM token balances
            </Typography>
            <Button
              size="sm"
              onClick={connectMetaMask}
              disabled={connecting}
              className="flex items-center justify-center gap-2 mt-2"
            >
              {connecting ? (
                <>
                  <Loader size={16} /> Connecting...
                </>
              ) : (
                <>
                  <Image src="/images/MetaMask-icon-fox.svg" width={20} height={20} alt="MetaMask" />
                  Connect MetaMask
                </>
              )}
            </Button>
            {error && (
              <Typography variant="xs" className="mt-3 text-red-500">
                {error}
              </Typography>
            )}
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader className="w-8 h-8 mb-2 text-stone-400" />
            <Typography variant="xs" className="text-center text-stone-500">
              Loading tokens...
            </Typography>
          </div>
        ) : error ? (
          <div className="p-4 m-3 border border-red-600 rounded-lg bg-red-900/20">
            <Typography variant="xs" className="text-center text-red-400">
              {error}
            </Typography>
          </div>
        ) : bridgedTokens.length === 0 ? (
          <Typography variant="xs" className="py-5 text-center text-stone-500">
            No bridged tokens found for {IS_TESTNET ? 'testnet' : 'mainnet'} environment
          </Typography>
        ) : (
          <div>
            {bridgedTokens
              .filter((token) => {
                const balance = token.originalAddress ? tokenBalances[token.originalAddress] : 0
                return balance > 0
              })
              .map((token) => {
                const balance = token.originalAddress ? tokenBalances[token.originalAddress] : 0
                const price = prices?.[token.uuid]
                const balanceUSD = price ? balance * price : undefined

                return (
                  <div
                    className="flex items-center justify-between px-1 mx-3 border-b border-stone-600/20"
                    key={token.uuid}
                  >
                    <div className="flex flex-row items-center gap-3 py-2.5">
                      <div className="w-7 h-7">
                        <Currency.Icon currency={token} width={28} height={28} />
                      </div>
                      <div className="flex flex-col">
                        <Typography variant="xs" weight={500} className="text-stone-300">
                          {token.symbol}
                        </Typography>
                        <Typography variant="xxs" className="text-stone-400">
                          {token.name}
                        </Typography>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="flex flex-col">
                        <Typography variant="xs" weight={500} className="text-right text-stone-200">
                          {balance !== undefined ? balance.toFixed(4) : '0.0000'}
                        </Typography>
                        <Typography variant="xxs" className="text-right text-stone-400">
                          {balanceUSD ? `$${balanceUSD.toFixed(2)}` : '-'}
                        </Typography>
                      </div>
                    </div>
                  </div>
                )
              })}

            {/* Bridge link at the bottom */}
            <div className="p-3 mx-3 mt-2">
              <Button
                as="a"
                href="/bridge"
                size="xs"
                color="blue"
                className="flex items-center justify-center w-full gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M9 6L15 12L9 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Go to Bridge
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
