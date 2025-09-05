# Hathor Snap Implementation Guide

This guide explains how to implement Hathor network snap integration using the `@dozer/snap-utils` package in your Dozer Protocol applications.

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Available Hooks](#available-hooks)
5. [Connection Flow](#connection-flow)
6. [Network Management](#network-management)
7. [Dozer Operations](#dozer-operations)
8. [Production Integration](#production-integration)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)
11. [Demo Page](#demo-page)

## Overview

The `@dozer/snap-utils` package provides production-ready React hooks and utilities for integrating Hathor network snaps into your Dozer Protocol applications. It handles wallet connection, snap installation, network switching, and Hathor-specific blockchain operations with comprehensive error handling and state management.

### Key Features

- 🔗 **Seamless Connection**: MetaMask wallet connection with automatic address access
- 🌐 **Network Management**: Switch between testnet/mainnet with proper state handling
- 🧩 **Snap Management**: Install, manage, and interact with MetaMask snaps
- 🏛️ **Hathor Integration**: Complete Hathor network operations including nano contracts
- 💱 **Dozer Operations**: Ready-to-use swap and liquidity operations
- 🔄 **State Management**: Automatic state synchronization and caching
- 🎯 **TypeScript Support**: Full TypeScript support with proper type definitions
- 🚀 **Production Ready**: Tested patterns from working Dozer applications

## Installation

The package is already configured in your monorepo. To use it in your apps:

```bash
# The package is already installed and configured
pnpm install
```

## Quick Start

### 1. Wrap your app with MetaMaskProvider

```tsx
import { MetaMaskProvider } from '@dozer/snap-utils'

function App() {
  return (
    <MetaMaskProvider>
      <YourApp />
    </MetaMaskProvider>
  )
}
```

### 2. Create a Hathor wallet component

```tsx
import React, { useState, useCallback, useEffect } from 'react'
import { useMetaMaskContext, useRequest, useRequestSnap, useInvokeSnap } from '@dozer/snap-utils'

function HathorWallet() {
  const { provider, installedSnap, error, setInstalledSnap } = useMetaMaskContext()
  const request = useRequest()
  const requestSnap = useRequestSnap()
  const invokeSnap = useInvokeSnap()
  
  const [isConnected, setIsConnected] = useState(false)
  const [account, setAccount] = useState<string | null>(null)
  const [hathorAddress, setHathorAddress] = useState<string | null>(null)
  const [selectedNetwork, setSelectedNetwork] = useState<'mainnet' | 'testnet'>('testnet')
  const [loading, setLoading] = useState(false)

  const connectWallet = async () => {
    try {
      setLoading(true)
      const accounts = await request({ method: 'eth_requestAccounts' })
      if (accounts && Array.isArray(accounts) && accounts.length > 0) {
        setIsConnected(true)
        setAccount(accounts[0] as string)
      }
    } catch (err) {
      console.error('Connection failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const installSnap = async () => {
    try {
      setLoading(true)
      const result = await requestSnap('local:http://localhost:8089')
      setInstalledSnap(result)
    } catch (err) {
      console.error('Snap installation failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const getHathorAddress = async () => {
    if (!installedSnap) return
    
    try {
      setLoading(true)
      const result = await invokeSnap({
        snapId: installedSnap.id,
        method: 'htr_getAddress',
        params: { type: 'index', index: 0 },
      })

      // Parse the response - handle both string and object formats
      let parsedResult = result
      if (typeof result === 'string') {
        try {
          parsedResult = JSON.parse(result)
        } catch (parseErr) {
          console.error('Failed to parse address response:', parseErr)
          return
        }
      }

      // Extract the address from the parsed response
      const address = parsedResult?.response?.address || parsedResult?.address
      if (address) {
        setHathorAddress(address)
      }
    } catch (err) {
      console.error('Get address failed:', err)
    } finally {
      setLoading(false)
    }
  }

  // Automatically get address after snap installation
  useEffect(() => {
    if (installedSnap && !hathorAddress) {
      getHathorAddress()
    }
  }, [installedSnap])

  return (
    <div className="space-y-4">
      <h2>Hathor Wallet</h2>
      
      {!provider && (
        <p className="text-red-500">MetaMask not detected. Please install MetaMask.</p>
      )}
      
      {error && (
        <p className="text-red-500">Error: {error.message}</p>
      )}
      
      <div className="space-x-2">
        <button onClick={connectWallet} disabled={loading}>
          {isConnected ? 'Connected' : 'Connect Wallet'}
        </button>
        
        <button onClick={installSnap} disabled={!isConnected || loading}>
          {installedSnap ? 'Snap Installed' : 'Install Hathor Snap'}
        </button>
        
        <button onClick={getHathorAddress} disabled={!installedSnap || loading}>
          Get Address
        </button>
      </div>
      
      {hathorAddress && (
        <div>
          <p><strong>Hathor Address:</strong> {hathorAddress}</p>
          <p><strong>Network:</strong> {selectedNetwork}</p>
        </div>
      )}
    </div>
  )
}
```

## Available Hooks

### useMetaMaskContext()
Provides access to the MetaMask provider and snap state.

```tsx
const { provider, installedSnap, error, setInstalledSnap } = useMetaMaskContext()
```

### useRequest()
Wrapper for MetaMask RPC requests.

```tsx
const request = useRequest()

// Connect wallet
const accounts = await request({ method: 'eth_requestAccounts' })

// Get chain ID
const chainId = await request({ method: 'eth_chainId' })
```

### useRequestSnap()
Install and manage snaps.

```tsx
const requestSnap = useRequestSnap()

// Install Hathor snap
await requestSnap('local:http://localhost:8089')
```

### useInvokeSnap()
Invoke snap methods.

```tsx
const invokeSnap = useInvokeSnap()

// Call Hathor snap method
const result = await invokeSnap({
  snapId: 'local:http://localhost:8089',
  method: 'htr_getAddress',
  params: { type: 'index', index: 0 }
})
```

## Connection Flow

### Complete Connection Flow with Address Access

```tsx
import React, { useState, useEffect } from 'react'
import { useMetaMaskContext, useRequest, useRequestSnap, useInvokeSnap } from '@dozer/snap-utils'

function HathorConnection() {
  const { provider, installedSnap, setInstalledSnap } = useMetaMaskContext()
  const request = useRequest()
  const requestSnap = useRequestSnap()
  const invokeSnap = useInvokeSnap()
  
  const [isConnected, setIsConnected] = useState(false)
  const [hathorAddress, setHathorAddress] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Complete connection flow
  const connectAndSetup = async () => {
    try {
      setLoading(true)
      
      // Step 1: Connect to MetaMask
      const accounts = await request({ method: 'eth_requestAccounts' })
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts connected')
      }
      setIsConnected(true)

      // Step 2: Install Hathor snap
      const snap = await requestSnap('local:http://localhost:8089')
      setInstalledSnap(snap)

      // Step 3: Get Hathor address automatically
      await getHathorAddressAfterInstall(snap.id)
      
    } catch (err) {
      console.error('Connection setup failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const getHathorAddressAfterInstall = async (snapId: string) => {
    try {
      const result = await invokeSnap({
        snapId,
        method: 'htr_getAddress',
        params: { type: 'index', index: 0 }
      })

      // Parse response with proper error handling
      let address = result
      if (typeof result === 'string') {
        try {
          const parsed = JSON.parse(result)
          address = parsed?.response?.address || parsed?.address
        } catch {
          // If parsing fails, assume the string itself is the address
          address = result
        }
      } else if (typeof result === 'object') {
        address = result?.response?.address || result?.address
      }

      if (address) {
        setHathorAddress(address as string)
      }
    } catch (err) {
      console.error('Failed to get Hathor address:', err)
    }
  }

  return (
    <div>
      <button onClick={connectAndSetup} disabled={loading}>
        {loading ? 'Connecting...' : 'Connect Hathor Wallet'}
      </button>
      
      {hathorAddress && (
        <p>Connected: {hathorAddress}</p>
      )}
    </div>
  )
}
```

## Network Management

### Network Switching Implementation

```tsx
import React, { useState } from 'react'
import { useInvokeSnap } from '@dozer/snap-utils'

function NetworkManager({ installedSnap, onNetworkChange }) {
  const invokeSnap = useInvokeSnap()
  const [selectedNetwork, setSelectedNetwork] = useState<'mainnet' | 'testnet'>('testnet')
  const [loading, setLoading] = useState(false)

  const switchNetwork = async (network: 'mainnet' | 'testnet') => {
    if (!installedSnap) return

    try {
      setLoading(true)
      const result = await invokeSnap({
        snapId: installedSnap.id,
        method: 'htr_changeNetwork',
        params: { newNetwork: network }
      })
      
      setSelectedNetwork(network)
      onNetworkChange?.(network)
      
    } catch (err) {
      console.error('Network switch failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-x-2">
      <button 
        onClick={() => switchNetwork('testnet')}
        disabled={loading || selectedNetwork === 'testnet'}
        className={selectedNetwork === 'testnet' ? 'active' : ''}
      >
        Testnet
      </button>
      
      <button 
        onClick={() => switchNetwork('mainnet')}
        disabled={loading || selectedNetwork === 'mainnet'}
        className={selectedNetwork === 'mainnet' ? 'active' : ''}
      >
        Mainnet
      </button>
      
      <span>Current: {selectedNetwork}</span>
    </div>
  )
}
```

## Dozer Operations

### Swap Implementation

```tsx
import React, { useState } from 'react'
import { useInvokeSnap } from '@dozer/snap-utils'

function DozerSwap({ installedSnap, hathorAddress }) {
  const invokeSnap = useInvokeSnap()
  const [loading, setLoading] = useState(false)

  const executeSwap = async () => {
    if (!installedSnap || !hathorAddress) return

    try {
      setLoading(true)
      
      const poolManagerId = process.env.NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID
      const htrToken = '00' // HTR token UUID
      const dzrToken = process.env.NEXT_PUBLIC_BRIDGED_TOKEN_UUIDS?.split(',')[0]
      const amountIn = 1000 // 10.00 HTR (in cents)
      const fee = 100 // 1% fee (in basis points)

      const result = await invokeSnap({
        snapId: installedSnap.id,
        method: 'htr_sendNanoContractTx',
        params: {
          nc_id: poolManagerId,
          method: 'swap_exact_tokens_for_tokens',
          actions: [
            {
              type: 'deposit',
              token: htrToken,
              amount: amountIn,
              address: hathorAddress,
              changeAddress: hathorAddress,
            },
            {
              type: 'withdrawal',
              token: dzrToken,
              amount: 900, // Minimum 9.00 DZR out
              address: hathorAddress,
              changeAddress: hathorAddress,
            }
          ],
          args: [fee],
        },
      })

      console.log('Swap transaction sent:', result)
    } catch (err) {
      console.error('Swap failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={executeSwap} disabled={loading || !hathorAddress}>
      {loading ? 'Swapping...' : 'Swap HTR → DZR'}
    </button>
  )
}
```

### Add Liquidity Implementation

```tsx
import React, { useState } from 'react'
import { useInvokeSnap } from '@dozer/snap-utils'

function DozerAddLiquidity({ installedSnap, hathorAddress }) {
  const invokeSnap = useInvokeSnap()
  const [loading, setLoading] = useState(false)

  const addLiquidity = async () => {
    if (!installedSnap || !hathorAddress) return

    try {
      setLoading(true)
      
      const poolManagerId = process.env.NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID
      const htrToken = '00'
      const dzrToken = process.env.NEXT_PUBLIC_BRIDGED_TOKEN_UUIDS?.split(',')[0]
      const amountA = 1000 // 10.00 HTR
      const amountB = 1000 // 10.00 DZR
      const fee = 100 // 1% fee

      const result = await invokeSnap({
        snapId: installedSnap.id,
        method: 'htr_sendNanoContractTx',
        params: {
          nc_id: poolManagerId,
          method: 'add_liquidity',
          actions: [
            {
              type: 'deposit',
              token: htrToken,
              amount: amountA,
              address: hathorAddress,
              changeAddress: hathorAddress,
            },
            {
              type: 'deposit',
              token: dzrToken,
              amount: amountB,
              address: hathorAddress,
              changeAddress: hathorAddress,
            }
          ],
          args: [fee],
        },
      })

      console.log('Add liquidity transaction sent:', result)
    } catch (err) {
      console.error('Add liquidity failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={addLiquidity} disabled={loading || !hathorAddress}>
      {loading ? 'Adding...' : 'Add Liquidity'}
    </button>
  )
}
```

### Faucet Integration

```tsx
import React, { useState } from 'react'
import { api } from 'utils/api' // Your tRPC API import

function HathorFaucet({ hathorAddress, selectedNetwork }) {
  const [loading, setLoading] = useState(false)
  const faucetMutation = api.getFaucet.sendHTR.useMutation()

  const requestFaucet = async () => {
    if (!hathorAddress) return
    if (selectedNetwork !== 'testnet') {
      alert('Faucet only available on testnet')
      return
    }

    try {
      setLoading(true)
      const data = await faucetMutation.mutateAsync({ 
        address: hathorAddress 
      })

      if (data.success) {
        console.log('Faucet transaction sent:', data.hash)
      } else {
        console.error('Faucet failed:', data.message)
      }
    } catch (err) {
      console.error('Faucet request failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button 
      onClick={requestFaucet} 
      disabled={loading || !hathorAddress || selectedNetwork !== 'testnet'}
    >
      {loading ? 'Requesting...' : 'Request Testnet HTR'}
    </button>
  )
}
```

## Production Integration

### Complete Production-Ready Hathor Wallet Hook

```tsx
import { useState, useEffect, useCallback } from 'react'
import { useMetaMaskContext, useRequest, useRequestSnap, useInvokeSnap } from '@dozer/snap-utils'

interface HathorWalletState {
  isConnected: boolean
  account: string | null
  hathorAddress: string | null
  selectedNetwork: 'mainnet' | 'testnet'
  loading: boolean
  error: string | null
}

export function useHathorWallet() {
  const { provider, installedSnap, error, setInstalledSnap } = useMetaMaskContext()
  const request = useRequest()
  const requestSnap = useRequestSnap()
  const invokeSnap = useInvokeSnap()

  const [state, setState] = useState<HathorWalletState>({
    isConnected: false,
    account: null,
    hathorAddress: null,
    selectedNetwork: 'testnet',
    loading: false,
    error: null
  })

  // Connect wallet and install snap in one flow
  const connect = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      // Step 1: Connect MetaMask
      const accounts = await request({ method: 'eth_requestAccounts' })
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts connected')
      }

      setState(prev => ({ 
        ...prev, 
        isConnected: true, 
        account: accounts[0] as string 
      }))

      // Step 2: Install Hathor snap
      const snap = await requestSnap('local:http://localhost:8089')
      setInstalledSnap(snap)

      // Step 3: Get Hathor address automatically
      const result = await invokeSnap({
        snapId: snap.id,
        method: 'htr_getAddress',
        params: { type: 'index', index: 0 }
      })

      // Parse address response
      let address = result
      if (typeof result === 'string') {
        try {
          const parsed = JSON.parse(result)
          address = parsed?.response?.address || parsed?.address
        } catch {
          address = result
        }
      } else if (typeof result === 'object') {
        address = result?.response?.address || result?.address
      }

      if (address) {
        setState(prev => ({ ...prev, hathorAddress: address as string }))
      }

    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Connection failed' 
      }))
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [request, requestSnap, invokeSnap, setInstalledSnap])

  // Switch network
  const switchNetwork = useCallback(async (network: 'mainnet' | 'testnet') => {
    if (!installedSnap) return

    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      await invokeSnap({
        snapId: installedSnap.id,
        method: 'htr_changeNetwork',
        params: { newNetwork: network }
      })

      setState(prev => ({ 
        ...prev, 
        selectedNetwork: network,
        hathorAddress: null // Clear address as it may change
      }))

      // Get new address for the network
      const result = await invokeSnap({
        snapId: installedSnap.id,
        method: 'htr_getAddress',
        params: { type: 'index', index: 0 }
      })

      let address = result
      if (typeof result === 'string') {
        try {
          const parsed = JSON.parse(result)
          address = parsed?.response?.address || parsed?.address
        } catch {
          address = result
        }
      } else if (typeof result === 'object') {
        address = result?.response?.address || result?.address
      }

      if (address) {
        setState(prev => ({ ...prev, hathorAddress: address as string }))
      }

    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Network switch failed' 
      }))
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [installedSnap, invokeSnap])

  // Disconnect
  const disconnect = useCallback(() => {
    setState({
      isConnected: false,
      account: null,
      hathorAddress: null,
      selectedNetwork: 'testnet',
      loading: false,
      error: null
    })
    setInstalledSnap(null)
  }, [setInstalledSnap])

  return {
    ...state,
    connect,
    disconnect,
    switchNetwork,
    installedSnap
  }
}
```

## Best Practices

### 1. State Management Pattern

Use proper state management for wallet connection and addresses:

```tsx
const [walletState, setWalletState] = useState({
  isConnected: false,
  address: null,
  isConnecting: false,
  currentNetwork: 'mainnet'
})

// Cache addresses to avoid repeated calls
const [addressCache, setAddressCache] = useState<Record<string, string>>({})
```

### 2. Address Parsing with Fallback

Handle different address response formats:

```tsx
const parseAddress = (response: any): string | null => {
  if (typeof response === 'string') return response
  if (response?.address) return response.address
  if (response?.data?.address) return response.data.address
  return null
}

const getAddress = async (type: string, index: number) => {
  const cacheKey = `${type}-${index}`
  if (addressCache[cacheKey]) {
    return addressCache[cacheKey]
  }
  
  try {
    const response = await invokeSnap({
      snapId: 'local:http://localhost:8089',
      method: 'htr_getAddress',
      params: { type, index }
    })
    
    const address = parseAddress(response)
    if (address) {
      setAddressCache(prev => ({ ...prev, [cacheKey]: address }))
    }
    return address
  } catch (error) {
    console.error('Failed to get address:', error)
    return null
  }
}
```

### 3. Error Handling with User Feedback

Provide meaningful error messages and recovery options:

```tsx
const handleSnapError = (error: any, operation: string) => {
  console.error(`${operation} failed:`, error)
  
  if (error.code === 4001) {
    setError('User rejected the operation')
  } else if (error.code === -32603) {
    setError('Snap not available. Please install the Hathor snap.')
  } else {
    setError(`${operation} failed. Please try again.`)
  }
}
```

### 4. Network Management

Implement proper network switching with validation:

```tsx
const switchNetwork = async (targetNetwork: 'mainnet' | 'testnet') => {
  try {
    await invokeSnap({
      snapId: 'local:http://localhost:8089',
      method: 'htr_changeNetwork',
      params: { newNetwork: targetNetwork }
    })
    
    setCurrentNetwork(targetNetwork)
    // Clear address cache when switching networks
    setAddressCache({})
  } catch (error) {
    handleSnapError(error, 'Network switch')
  }
}
```

### 5. Production Hook Pattern

Use a comprehensive hook for production applications:

```tsx
const useHathorWallet = () => {
  const { provider, installedSnap } = useMetaMaskContext()
  const [state, setState] = useState(initialState)
  
  // Auto-connect on mount if snap is installed
  useEffect(() => {
    if (installedSnap && !state.isConnected) {
      connectWallet()
    }
  }, [installedSnap])
  
  return {
    ...state,
    connectWallet,
    disconnectWallet,
    getAddress,
    sendTransaction,
    switchNetwork,
    // Export all methods needed
  }
}
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Snap Installation Issues

**Problem**: Snap installation fails or snap not detected
```
Error: Snap not found or not installed
```

**Solutions**:
- Ensure MetaMask Flask is installed (required for snap development)
- Verify the Hathor snap is running locally on `http://localhost:8089`
- Check browser console for specific error messages
- Try reinstalling the snap using the connect button

#### 2. Address Retrieval Problems

**Problem**: `htr_getAddress` returns unexpected format or fails
```
Error: Cannot read properties of undefined
```

**Solution**: Use proper address parsing with fallback handling
```tsx
const parseAddress = (response: any): string | null => {
  if (typeof response === 'string') return response
  if (response?.address) return response.address
  if (response?.data?.address) return response.data.address
  console.warn('Unexpected address response format:', response)
  return null
}
```

#### 3. Network Switching Failures

**Problem**: Network switching doesn't work or throws errors
```
Error: Method 'htr_changeNetwork' not found
```

**Solutions**:
- Use correct parameter name: `newNetwork` (not `network`)
- Ensure the snap supports network switching
- Clear address cache after network changes

#### 4. Transaction Signing Issues

**Problem**: Nano contract transactions fail with signing errors

**Solutions**:
- Verify transaction data format matches nano contract expectations
- Check that amounts are properly formatted (multiply by 100 for cents)
- Ensure all required transaction fields are present
- Use proper error handling for user rejections

#### 5. Faucet Integration Problems

**Problem**: Faucet requests fail or return insufficient funds

**Solutions**:
- Ensure you're on testnet network before requesting faucet funds
- Implement proper network validation before faucet calls
- Add retry logic for failed faucet requests
- Check if address has sufficient balance before operations

### Debug Checklist

Before reporting issues, verify:

1. **Environment Setup**:
   - [ ] MetaMask Flask installed and unlocked
   - [ ] Hathor snap running on localhost:8089
   - [ ] Correct network selected (testnet for faucet)

2. **Code Implementation**:
   - [ ] Using latest @dozer/snap-utils package
   - [ ] Proper error handling in place
   - [ ] Address parsing with fallback logic
   - [ ] Network switching using `newNetwork` parameter

3. **Transaction Issues**:
   - [ ] Amounts formatted correctly (cents for nano contracts)
   - [ ] All required transaction fields present
   - [ ] Proper nano contract ID and method names
   - [ ] User has sufficient balance

4. **Network Connectivity**:
   - [ ] Browser console shows no CORS errors
   - [ ] Hathor network accessible
   - [ ] Local snap server responding

### Development Tips

1. **Use Browser DevTools**: Enable MetaMask developer mode for detailed logs
2. **Test with Demo Page**: Use `/swap/dev/snap-utils` to verify functionality
3. **Check Snap Logs**: Monitor the local snap server console for errors
4. **Validate Responses**: Always parse and validate snap method responses

## API Integration Patterns

### Faucet Integration with Network Validation

The demo implementation shows how to integrate faucet functionality with proper network validation:

```tsx
// Check network before faucet request
const requestFaucet = async () => {
  if (currentNetwork !== 'testnet') {
    setError('Please switch to testnet to use the faucet')
    return
  }
  
  const address = await getAddress('p2pkh', 0)
  if (!address) {
    setError('Could not get wallet address')
    return
  }
  
  try {
    const result = await faucetMutation.mutateAsync({ address })
    setSuccess(`Faucet request successful! Tx: ${result.txId}`)
  } catch (error) {
    setError('Faucet request failed')
  }
}
```

### tRPC Integration Pattern

Use proper tRPC mutation hooks for API calls:

```tsx
import { api } from '@dozer/api/react'

const MyComponent = () => {
  const faucetMutation = api.faucet.requestFunds.useMutation()
  
  const handleFaucetRequest = async (address: string) => {
    try {
      const result = await faucetMutation.mutateAsync({ address })
      // Handle success
    } catch (error) {
      // Handle error
    }
  }
  
  return (
    <button 
      onClick={() => handleFaucetRequest(walletAddress)}
      disabled={faucetMutation.isLoading}
    >
      {faucetMutation.isLoading ? 'Requesting...' : 'Request Faucet'}
    </button>
  )
}
```

## Demo Page

Visit `/swap/dev/snap-utils` to see a comprehensive demo of all Hathor snap functionality.

The demo includes:

- Complete wallet connection flow
- Network management (testnet/mainnet switching)
- Address retrieval with caching
- Nano contract transaction examples
- Faucet integration with validation
- Real-time balance checking
- Error handling patterns
- Production-ready code examples

## Quick Integration Checklist

To integrate Hathor snap into your Dozer app:

1. **Install Dependencies**:
   
   ```bash
   pnpm add @dozer/snap-utils
   ```

2. **Setup MetaMask Context**:
   
   ```tsx
   import { MetaMaskProvider } from '@dozer/snap-utils'
   
   function App() {
     return (
       <MetaMaskProvider>
         {/* Your app components */}
       </MetaMaskProvider>
     )
   }
   ```

3. **Use the Hook**:
   
   ```tsx
   import { useHathorWallet } from '@dozer/snap-utils'
   
   function WalletComponent() {
     const { 
       isConnected, 
       address, 
       connectWallet, 
       sendTransaction 
     } = useHathorWallet()
     
     // Implementation
   }
   ```

4. **Handle Network Configuration**:
   - Add network switcher component
   - Validate network for testnet-only features
   - Clear cache on network changes

5. **Implement Error Boundaries**:
   - Add proper error handling for all snap methods
   - Provide user feedback for failures
   - Implement retry mechanisms

## Production Considerations

### Performance Optimization

1. **Address Caching**: Cache addresses to avoid repeated snap calls
2. **Lazy Loading**: Load snap functionality only when needed
3. **Error Boundaries**: Prevent snap errors from crashing the app
4. **Loading States**: Provide feedback during async operations

### Security Best Practices

1. **Input Validation**: Validate all transaction parameters
2. **Amount Formatting**: Ensure proper decimal handling for nano contracts
3. **Network Verification**: Validate network before sensitive operations
4. **Error Sanitization**: Don't expose sensitive error details to users

### User Experience

1. **Progressive Enhancement**: App should work without snap installed
2. **Clear Instructions**: Guide users through snap installation
3. **Fallback Options**: Provide alternatives when snap is unavailable
4. **Responsive Feedback**: Show loading, success, and error states

## Support and Resources

### Documentation

- **MetaMask Snaps**: [MetaMask Snaps Developer Documentation](https://docs.metamask.io/snaps/)
- **Hathor Network**: [Hathor Network Documentation](https://docs.hathor.network/)
- **Dozer Protocol**: Project-specific documentation in repository

### Development Resources

- **Demo Implementation**: `/apps/swap/pages/dev/snap-utils.tsx`
- **Snap Utils Package**: `/packages/snap-utils/`
- **Working Examples**: All code examples in this guide are from production code

### Getting Help

- Check the demo page for working examples
- Review browser console for detailed error messages
- Test with the development tools in MetaMask Flask
- Refer to the troubleshooting section for common issues
