// Network configuration interfaces
export interface NetworkConfig {
  networkId: number
  name: string
  explorer: string
  explorerTokenTab: string
  confirmations: number
  confirmationTime: string
  secondsPerBlock: number
  crossToNetwork?: NetworkConfig
}

// Ethereum specific configuration
export interface EthereumNetworkConfig extends NetworkConfig {
  rpcUrl: string
  bridge: string
  allowTokens: string
  federation: string
  chainIdHex: string
}

// Hathor specific configuration
export interface HathorNetworkConfig extends NetworkConfig {
  rpcChain: string
  federation: string
}

// Token-specific details on a network
export interface TokenNetworkDetails {
  symbol: string
  address: string
  decimals: number
  hathorAddr?: string
  pureHtrAddress?: string
}

// Configuration for a token that can be bridged
export interface TokenConfig {
  token: string
  name: string
  icon: string
  [networkId: number]: TokenNetworkDetails
}
