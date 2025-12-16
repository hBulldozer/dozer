import { useAccount, WalletType } from '@dozer/zustand'

export interface WalletConnectionResult {
  success: boolean
  walletType: WalletType
  address: string
  hathorAddress: string
  error?: string
}

export interface NetworkSwitchResult {
  success: boolean
  network: 'mainnet' | 'testnet'
  error?: string
}

/**
 * Unified wallet connection service that abstracts wallet operations
 * Supports both WalletConnect and MetaMask Snap connections
 */
export class WalletConnectionService {
  private static instance: WalletConnectionService

  private constructor() {}

  public static getInstance(): WalletConnectionService {
    if (!WalletConnectionService.instance) {
      WalletConnectionService.instance = new WalletConnectionService()
    }
    return WalletConnectionService.instance
  }

  /**
   * Connect using WalletConnect (Hathor mobile wallet)
   */
  public async connectWalletConnect(
    connectFn: () => Promise<void>,
    getAccountsFn: () => string[]
  ): Promise<WalletConnectionResult> {
    try {
      await connectFn()

      const accounts = getAccountsFn()
      if (!accounts || accounts.length === 0) {
        return {
          success: false,
          walletType: 'walletconnect',
          address: '',
          hathorAddress: '',
          error: 'No accounts found after connection',
        }
      }

      const hathorAddress = accounts[0].split(':')[2]

      // Update global state
      const { setWalletConnection } = useAccount.getState()
      setWalletConnection({
        walletType: 'walletconnect',
        address: hathorAddress,
        hathorAddress: hathorAddress,
        isSnapInstalled: false,
        snapId: null,
      })

      return {
        success: true,
        walletType: 'walletconnect',
        address: hathorAddress,
        hathorAddress: hathorAddress,
      }
    } catch (error) {
      return {
        success: false,
        walletType: 'walletconnect',
        address: '',
        hathorAddress: '',
        error: error instanceof Error ? error.message : 'Connection failed',
      }
    }
  }

  /**
   * Check if Hathor snap is already installed
   */
  public async checkSnapInstallation(
    requestFn: (request: { method: string; params?: any }) => Promise<any>
  ): Promise<{ installed: boolean; snapId: string | null }> {
    try {
      const snaps = (await requestFn({ method: 'wallet_getSnaps' })) as Record<string, any>
      const snapId = 'npm:@hathor/snap'

      if (snaps && snaps[snapId]) {
        return { installed: true, snapId }
      }

      return { installed: false, snapId: null }
    } catch (error) {
      return { installed: false, snapId: null }
    }
  }

  /**
   * Get current network from snap
   */
  public async getCurrentNetwork(
    invokeSnapFn: (params: { method: string; params?: any }) => Promise<any>
  ): Promise<'mainnet' | 'testnet' | null> {
    try {
      console.log('Calling htr_getConnectedNetwork with timeout...')

      // Add a timeout to prevent hanging indefinitely
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Network check timeout')), 10000) // 10 second timeout
      })

      const networkPromise = invokeSnapFn({
        method: 'htr_getConnectedNetwork',
      })

      const result = await Promise.race([networkPromise, timeoutPromise])
      console.log('htr_getConnectedNetwork result:', result)

      // Parse network response
      if (typeof result === 'string') {
        return result.includes('testnet') ? 'testnet' : 'mainnet'
      } else if (typeof result === 'object' && result?.network) {
        return result.network.includes('testnet') ? 'testnet' : 'mainnet'
      }

      return null
    } catch (error) {
      console.warn('Error getting network from snap:', error)
      return null
    }
  }

  /**
   * Enhanced MetaMask Snap connection with smart detection
   */
  public async connectMetaMaskSnapEnhanced(
    requestFn: (request: { method: string; params?: any }) => Promise<any>,
    invokeSnapFn: (params: { method: string; params?: any }) => Promise<any>,
    onStatusUpdate?: (status: string) => void
  ): Promise<WalletConnectionResult> {
    try {
      // Step 1: Connect to MetaMask
      onStatusUpdate?.('Connecting to MetaMask...')
      const accounts = await requestFn({ method: 'eth_requestAccounts' })

      if (!accounts || accounts.length === 0) {
        return {
          success: false,
          walletType: 'metamask-snap',
          address: '',
          hathorAddress: '',
          error: 'No MetaMask accounts found',
        }
      }

      const ethAddress = accounts[0]
      onStatusUpdate?.('MetaMask connected! Checking Hathor snap...')

      // Step 2: Check if Hathor snap is already installed
      const snapCheck = await this.checkSnapInstallation(requestFn)
      let snapId: string = ''

      if (snapCheck.installed && snapCheck.snapId) {
        // Snap already installed - use it
        onStatusUpdate?.('Hathor snap found! Checking network...')
        snapId = snapCheck.snapId
      } else {
        // Install snap
        onStatusUpdate?.('Installing Hathor snap...')
        const defaultSnapId = 'npm:@hathor/snap'

        console.log('Attempting to connect to local snap:', defaultSnapId)
        const snaps = await requestFn({
          method: 'wallet_requestSnaps',
          params: {
            [defaultSnapId]: {},
          },
        })

        // Debug log to see what we got back
        console.log('Snap installation response:', snaps)
        console.log('Snap exists?', snaps?.[defaultSnapId])

        // Check if snap installation was cancelled or failed
        if (!snaps) {
          return {
            success: false,
            walletType: 'metamask-snap',
            address: ethAddress,
            hathorAddress: '',
            error: 'User cancelled snap installation',
          }
        }

        // Try to find the snap ID - it might be returned with a different format
        const availableSnapIds = Object.keys(snaps)
        console.log('Available snap IDs:', availableSnapIds)

        // Look for our snap - check for exact match
        const foundSnapId = availableSnapIds.find((id) => id === defaultSnapId)

        if (!foundSnapId) {
          console.error('Snap not found in response. Available IDs:', availableSnapIds)
          return {
            success: false,
            walletType: 'metamask-snap',
            address: ethAddress,
            hathorAddress: '',
            error: `Hathor snap not found. Please install the snap from the MetaMask Snap directory.
Available snap IDs: ${availableSnapIds.join(', ') || 'none'}`,
          }
        }

        snapId = foundSnapId
        console.log('Using snap ID:', snapId)
        onStatusUpdate?.('Hathor snap installed! Configuring...')
      }

      // Step 3: Get Hathor wallet information (address and network)
      // Note: We get wallet info first, which includes the network, then switch if needed
      onStatusUpdate?.('Requesting wallet information...')
      let walletInfoResult
      try {
        walletInfoResult = await invokeSnapFn({
          method: 'htr_getWalletInformation',
          // Don't pass params - the method doesn't need any
        })
        console.log('Raw wallet info result:', walletInfoResult)
      } catch (error) {
        console.error('Error calling htr_getWalletInformation:', error)
        throw error
      }

      // Parse wallet information response
      const walletInfo = this.parseWalletInformation(walletInfoResult)
      console.log('Parsed wallet info:', walletInfo)
      const hathorAddress = walletInfo?.address
      const currentNetwork = walletInfo?.network

      if (!hathorAddress) {
        return {
          success: false,
          walletType: 'metamask-snap',
          address: ethAddress,
          hathorAddress: '',
          error: 'Unable to retrieve Hathor address from snap',
        }
      }

      // Step 4: Check if we need to switch networks
      const { targetNetwork, setWalletConnection, setCurrentNetwork } = useAccount.getState()
      console.log('Current network:', currentNetwork, 'Target network:', targetNetwork)

      // Track the final network and address we'll be on
      let finalNetwork = currentNetwork
      let finalHathorAddress = hathorAddress

      if (currentNetwork && currentNetwork !== targetNetwork) {
        console.log(`Network mismatch. Need to switch from ${currentNetwork} to ${targetNetwork}`)
        onStatusUpdate?.(`Switching to ${targetNetwork}...`)

        try {
          await invokeSnapFn({
            method: 'htr_changeNetwork',
            params: { newNetwork: targetNetwork },
          })
          console.log('Network switched successfully')
          finalNetwork = targetNetwork

          // Get wallet info again after network switch to get the correct address
          const newWalletInfoResult = await invokeSnapFn({
            method: 'htr_getWalletInformation',
          })
          const newWalletInfo = this.parseWalletInformation(newWalletInfoResult)
          if (newWalletInfo?.address) {
            console.log('New address after network switch:', newWalletInfo.address)
            finalHathorAddress = newWalletInfo.address
          }
        } catch (error) {
          console.warn('Failed to switch network, continuing with current network:', error)
          // Keep finalNetwork as currentNetwork if switch failed
        }
      }

      // Update current network in the store
      if (finalNetwork) {
        setCurrentNetwork(finalNetwork as 'mainnet' | 'testnet')
      }

      // Update global state with network info (using the updated address after network switch)
      setWalletConnection({
        walletType: 'metamask-snap',
        address: ethAddress,
        hathorAddress: finalHathorAddress,
        isSnapInstalled: true,
        snapId: snapId,
        selectedNetwork: (finalNetwork as 'mainnet' | 'testnet') || targetNetwork,
      })

      return {
        success: true,
        walletType: 'metamask-snap',
        address: ethAddress,
        hathorAddress: hathorAddress,
      }
    } catch (error) {
      let errorMessage = 'Connection failed'
      if (error instanceof Error) {
        if (
          error.message.includes('User rejected') ||
          error.message.includes('User denied') ||
          error.message.includes('cancelled')
        ) {
          errorMessage = 'User cancelled snap installation'
        } else if (error.message.includes('Snap not found')) {
          errorMessage = 'Hathor snap not available. Please install the snap from the MetaMask Snap directory.'
        } else {
          errorMessage = error.message
        }
      }

      return {
        success: false,
        walletType: 'metamask-snap',
        address: '',
        hathorAddress: '',
        error: errorMessage,
      }
    }
  }

  /**
   * Connect using MetaMask Snap (legacy method for backward compatibility)
   */
  public async connectMetaMaskSnap(
    requestFn: (request: { method: string; params?: any }) => Promise<any>,
    invokeSnapFn: (params: { snapId: string; method: string; params: any }) => Promise<any>
  ): Promise<WalletConnectionResult> {
    // Wrap invokeSnapFn to match the enhanced method signature (without snapId)
    const wrappedInvokeSnapFn = (params: { method: string; params?: any }) => {
      // The snapId will be determined by the enhanced method, so we pass a placeholder
      return invokeSnapFn({ snapId: '', ...params, params: params.params || {} })
    }

    // Use the enhanced method
    return this.connectMetaMaskSnapEnhanced(requestFn, wrappedInvokeSnapFn)
  }

  /**
   * Switch network for MetaMask Snap
   */
  public async switchSnapNetwork(
    network: 'mainnet' | 'testnet',
    invokeSnapFn: (params: { method: string; params?: any }) => Promise<any>
  ): Promise<NetworkSwitchResult> {
    try {
      await invokeSnapFn({
        method: 'htr_changeNetwork',
        params: { newNetwork: network },
      })

      // Get wallet information for the new network
      const walletInfoResult = await invokeSnapFn({
        method: 'htr_getWalletInformation',
      })

      const walletInfo = this.parseWalletInformation(walletInfoResult)
      const hathorAddress = walletInfo?.address

      // Update global state
      const { setWalletConnection, setCurrentNetwork } = useAccount.getState()

      // Update current network
      setCurrentNetwork(network)

      // Update wallet connection
      setWalletConnection({
        selectedNetwork: network,
        hathorAddress: hathorAddress || '',
      })

      return {
        success: true,
        network,
      }
    } catch (error) {
      return {
        success: false,
        network,
        error: error instanceof Error ? error.message : 'Network switch failed',
      }
    }
  }

  /**
   * Set wallet connection state directly
   */
  public async setWalletConnection(
    connection: Partial<{
      walletType: WalletType
      address: string
      hathorAddress: string
      isSnapInstalled: boolean
      snapId: string | null
      selectedNetwork: 'mainnet' | 'testnet'
    }>
  ): Promise<void> {
    const { setWalletConnection } = useAccount.getState()
    setWalletConnection(connection)
  }

  /**
   * Disconnect current wallet
   */
  public async disconnectWallet(): Promise<void> {
    const { disconnectWallet } = useAccount.getState()
    disconnectWallet()
  }

  /**
   * Get current wallet connection info
   */
  public getConnectionInfo() {
    const state = useAccount.getState()
    return {
      walletType: state.walletType,
      address: state.address,
      hathorAddress: state.hathorAddress,
      isSnapInstalled: state.isSnapInstalled,
      snapId: state.snapId,
      selectedNetwork: state.selectedNetwork,
      isConnected: !!state.walletType && !!state.hathorAddress,
    }
  }

  /**
   * Helper method to parse wallet information from snap response
   * Handles the new htr_getWalletInformation response format
   */
  private parseWalletInformation(result: any): { address: string; network: string } | null {
    try {
      if (typeof result === 'string') {
        const parsed = JSON.parse(result)
        // New format: { type: 'GetWalletInformationResponse', response: { network: string, address0: string } }
        if (parsed?.response?.address0) {
          return {
            address: parsed.response.address0,
            network: parsed.response.network || 'mainnet',
          }
        }
        // Fallback for older format
        if (parsed?.address) {
          return {
            address: parsed.address,
            network: parsed.network || 'mainnet',
          }
        }
      } else if (typeof result === 'object') {
        // Direct object response
        if (result?.response?.address0) {
          return {
            address: result.response.address0,
            network: result.response.network || 'mainnet',
          }
        }
        if (result?.address) {
          return {
            address: result.address,
            network: result.network || 'mainnet',
          }
        }
      }
    } catch (error) {
      console.error('Error parsing wallet information:', error)
    }
    return null
  }
}
