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
   * Connect using MetaMask Snap
   */
  public async connectMetaMaskSnap(
    requestFn: (request: { method: string; params?: any[] }) => Promise<any>,
    requestSnapFn: (snapId: string) => Promise<{ id: string }>,
    invokeSnapFn: (params: { snapId: string; method: string; params: any }) => Promise<any>
  ): Promise<WalletConnectionResult> {
    try {
      // Step 1: Connect to MetaMask
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

      // Step 2: Install Hathor snap
      const snapId = 'local:http://localhost:8089'
      const snap = await requestSnapFn(snapId)

      // Step 3: Get Hathor address from snap
      const addressResult = await invokeSnapFn({
        snapId: snap.id,
        method: 'htr_getAddress',
        params: { type: 'index', index: 0 },
      })

      // Parse Hathor address response
      const hathorAddress = this.parseHathorAddress(addressResult)

      if (!hathorAddress) {
        return {
          success: false,
          walletType: 'metamask-snap',
          address: ethAddress,
          hathorAddress: '',
          error: 'Unable to retrieve Hathor address from snap',
        }
      }

      // Update global state
      const { setWalletConnection } = useAccount.getState()
      setWalletConnection({
        walletType: 'metamask-snap',
        address: ethAddress,
        hathorAddress: hathorAddress,
        isSnapInstalled: true,
        snapId: snap.id,
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
        if (error.message.includes('User rejected')) {
          errorMessage = 'Connection cancelled by user'
        } else if (error.message.includes('Snap not found')) {
          errorMessage = 'Hathor snap not available. Please ensure the snap is running on localhost:8089.'
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
   * Switch network for MetaMask Snap
   */
  public async switchSnapNetwork(
    network: 'mainnet' | 'testnet',
    invokeSnapFn: (params: { snapId: string; method: string; params: any }) => Promise<any>
  ): Promise<NetworkSwitchResult> {
    const { snapId } = useAccount.getState()

    if (!snapId) {
      return {
        success: false,
        network,
        error: 'No snap installed',
      }
    }

    try {
      await invokeSnapFn({
        snapId,
        method: 'htr_changeNetwork',
        params: { newNetwork: network },
      })

      // Get new address for the network
      const addressResult = await invokeSnapFn({
        snapId,
        method: 'htr_getAddress',
        params: { type: 'index', index: 0 },
      })

      const hathorAddress = this.parseHathorAddress(addressResult)

      // Update global state
      const { setWalletConnection } = useAccount.getState()
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
   * Helper method to parse Hathor address from snap response
   */
  private parseHathorAddress(result: any): string | null {
    if (typeof result === 'string') {
      try {
        const parsed = JSON.parse(result)
        return parsed?.response?.address || parsed?.address || null
      } catch {
        // If parsing fails, assume the string itself is the address
        return result
      }
    } else if (typeof result === 'object') {
      return result?.response?.address || result?.address || null
    }
    return null
  }
}
