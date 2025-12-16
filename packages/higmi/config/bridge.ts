import { TokenConfig, EthereumNetworkConfig, HathorNetworkConfig } from '../types'

/**
 * Bridge Configuration
 * This file centralizes all configuration related to the Arbitrum-Hathor bridge.
 * The environment (testnet vs mainnet) is automatically detected based on the
 * NEXT_PUBLIC_LOCAL_NODE_URL environment variable.
 */

// Dynamically detect if we're on testnet based on the node URL
// If the URL contains "testnet" or "self2.dozer.finance", we're on testnet
const getIsTestnet = (): boolean => {
  const nodeUrl = process.env.NEXT_PUBLIC_LOCAL_NODE_URL || ''
  const isTestnet = nodeUrl.includes('testnet') || nodeUrl.includes('self2.dozer.finance')

  // Log the detected environment for debugging
  if (typeof window !== 'undefined') {
    console.log(`Bridge config detected: ${isTestnet ? 'TESTNET' : 'MAINNET'} (from URL: ${nodeUrl})`)
  }

  return isTestnet
}

// Export as a function for runtime evaluation and as a constant for compatibility
export const IS_TESTNET = getIsTestnet()
export const isTestnet = getIsTestnet

// Ethereum/Arbitrum Network Configuration
export const ETHEREUM_CONFIG: {
  mainnet: EthereumNetworkConfig
  testnet: EthereumNetworkConfig
} = {
  // Mainnet (Arbitrum One)
  mainnet: {
    networkId: 42161,
    name: 'Arbitrum One',
    rpcUrl: 'https://arbitrum-mainnet.infura.io/v3/399500b5679b442eb991fefee1c5bfdc',
    bridge: '0xB85573bb0D1403Ed56dDF12540cc57662dfB3351',
    allowTokens: '0x140ccdea1D96EcEDAdC2CD27713f452a50942A19',
    federation: '0xE379DfB03E07ff4F1029698C219faB0B56a2bf67',
    explorer: 'https://arbiscan.io',
    explorerTokenTab: '#tokentxns',
    confirmations: 900,
    confirmationTime: '30 minutes',
    secondsPerBlock: 1,
    chainIdHex: '0xa4b1',
  },
  // Testnet (Sepolia)
  testnet: {
    networkId: 11155111,
    name: 'Sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/399500b5679b442eb991fefee1c5bfdc',
    bridge: '0xfc218f3feae75359eeb40d2490760f72faa01abd',
    allowTokens: '0x68a26d1586c2eabc05c09a90d31c93994c5954b2',
    federation: '0x91716baeca14f8d8be6c563c148ac158f23b973d',
    explorer: 'https://sepolia.etherscan.io',
    explorerTokenTab: '#tokentxns',
    confirmations: 10,
    confirmationTime: '30 minutes',
    secondsPerBlock: 5,
    chainIdHex: '0xaa36a7',
  },
}

// Hathor Network Configuration
export const HATHOR_CONFIG: {
  mainnet: HathorNetworkConfig
  testnet: HathorNetworkConfig
} = {
  // Mainnet
  mainnet: {
    networkId: 31,
    name: 'Hathor Mainnet',
    rpcChain: 'hathor:mainnet',
    federation: '0xC2d2318dEa546D995189f14a0F9d39fB1f56D966',
    explorer: 'https://explorer.hathor.network',
    explorerTokenTab: 'token_detail',
    confirmations: 2,
    confirmationTime: '30 minutes',
    secondsPerBlock: 30,
  },
  // Testnet (Golf)
  testnet: {
    networkId: 31,
    name: 'Hathor Golf Testnet',
    rpcChain: 'hathor:testnet',
    federation: '0xeB8457a67e5575FbE350b9A7084D1eEa7B5415F7',
    explorer: 'https://explorer.testnet.hathor.network',
    explorerTokenTab: 'token_detail',
    confirmations: 2,
    confirmationTime: '30 minutes',
    secondsPerBlock: 30,
  },
}

// Arbitrum Federation Host URLs
export const ARBITRUM_FEDERATION_HOST = IS_TESTNET
  ? 'https://arb-sepolia.g.alchemy.com/v2/uZC_k6qzUFbIP5MigPnBCvry-n9M-gOV'
  : 'https://arbitrum-mainnet.infura.io/v3/399500b5679b442eb991fefee1c5bfdc'

// Current Network Settings (determined by IS_TESTNET)
export const CURRENT_ETHEREUM_CONFIG = IS_TESTNET ? ETHEREUM_CONFIG.testnet : ETHEREUM_CONFIG.mainnet

export const CURRENT_HATHOR_CONFIG = IS_TESTNET ? HATHOR_CONFIG.testnet : HATHOR_CONFIG.mainnet

// Cross-network references
CURRENT_ETHEREUM_CONFIG.crossToNetwork = CURRENT_HATHOR_CONFIG
CURRENT_HATHOR_CONFIG.crossToNetwork = CURRENT_ETHEREUM_CONFIG

// Bridge title based on environment
export const BRIDGE_TITLE = IS_TESTNET
  ? 'Hathor Golf Testnet bridge with Sepolia'
  : 'Hathor Mainnet Bridge with Arbitrum One'

// Create separate token configurations for testnet and mainnet to avoid conditional logic
// USDC Token Configuration
const usdcToken: TokenConfig = {
  token: 'USDC',
  name: 'USDC',
  icon: 'https://assets.coingecko.com/coins/images/6319/standard/usdc.png?1696506694',
  // Arbitrum One USDC
  [ETHEREUM_CONFIG.mainnet.networkId]: {
    symbol: 'USDC',
    address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
    decimals: 6,
  },
  // Sepolia USDC
  [ETHEREUM_CONFIG.testnet.networkId]: {
    symbol: 'USDC',
    address: '0x3E1Adb4e24a48B90ca10c28388cE733a6267BAc4',
    decimals: 6,
  },
  // Hathor USDC - This has a fixed networkId of 31 for both testnet and mainnet
  [HATHOR_CONFIG.mainnet.networkId]: IS_TESTNET
    ? {
        symbol: 'hUSDC',
        address: '0xA3FBbF66380dEEce7b7f7dC4BEA6267c05bB383D',
        hathorAddr: '0x000000005c3e8f7118140bcfbf2032a1a0abbca3b47205731880bba6b87cba8f',
        pureHtrAddress: '000000005c3e8f7118140bcfbf2032a1a0abbca3b47205731880bba6b87cba8f',
        decimals: 6,
      }
    : {
        symbol: 'hUSDC',
        address: '0x66981C5a01db0Df1De03A5Af4493437B98F5D49c',
        hathorAddr: '0x00003b17e8d656e4612926d5d2c5a4d5b3e4536e6bebc61c76cb71a65b81986f',
        pureHtrAddress: '00003b17e8d656e4612926d5d2c5a4d5b3e4536e6bebc61c76cb71a65b81986f',
        decimals: 6,
      },
}

// TestNet-only SLT7 Token
const slt7Token: TokenConfig = {
  token: 'SLT7',
  name: 'Storm Labs Token 7',
  icon: 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png?1696501628',
  // Only available on Sepolia testnet
  [ETHEREUM_CONFIG.testnet.networkId]: {
    symbol: 'SLT7',
    address: '0x97118caaE1F773a84462490Dd01FE7a3e7C4cdCd',
    decimals: 18,
  },
  // Hathor SLT7 (only in testnet) - default empty
  [HATHOR_CONFIG.mainnet.networkId]: {
    symbol: 'hSLT7',
    address: '0xAF8aD2C33c2c9a48CD906A4c5952A835FeB25696',
    hathorAddr: '0x000002c993795c9ef5b894571af2277aaf344438c2f8608a50daccc6ace7c0a1',
    pureHtrAddress: '000002c993795c9ef5b894571af2277aaf344438c2f8608a50daccc6ace7c0a1',
    decimals: 18,
  },
}

// Token Configuration - conditionally include SLT7 token only for testnet
export const BRIDGE_TOKENS: TokenConfig[] = IS_TESTNET ? [usdcToken, slt7Token] : [usdcToken]

export default {
  isTestnet: IS_TESTNET,
  ethereumConfig: CURRENT_ETHEREUM_CONFIG,
  hathorConfig: CURRENT_HATHOR_CONFIG,
  arbitrumFederationHost: ARBITRUM_FEDERATION_HOST,
  bridgeTitle: BRIDGE_TITLE,
  bridgeTokens: BRIDGE_TOKENS,
}
