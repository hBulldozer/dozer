export interface TokenConfig {
  name: string
  symbol: string
  totalSupply: number
  about: string
  bridged?: boolean
  sourceChain?: string
  targetChain?: string
  originalAddress?: string
}

export interface PoolConfig {
  tokenSymbol: string
  htrQuantity: number
  tokenQuantity: number
  fee: number
  protocolFee: number
  // Optional fields for non-HTR pools
  dzrQuantity?: number
  isNonHTRPool?: boolean
  pairTokenSymbol?: string
}

export interface OasisConfig {
  tokenSymbol: string
  htrQuantity: number
}

export interface SeedConfig {
  tokens: TokenConfig[]
  pools: PoolConfig[]
  oasis: OasisConfig[]
}

export const seedConfig: SeedConfig = {
  tokens: [
    {
      name: 'Dozer',
      symbol: 'DZR',
      totalSupply: 14000000000,
      about:
        'DZR is the native utility token of Dozer Finance, a decentralized finance (DeFi) platform built on the Hathor Network.',
    },
    {
      name: 'USDC',
      symbol: 'hUSDC',
      totalSupply: 28000000000,
      about: 'hUSDC is the bridged version of USDC on the Hathor Network.',
      bridged: true,
      sourceChain: 'Sepolia',
      targetChain: 'Hathor',
      originalAddress: '0x3E1Adb4e24a48B90ca10c28388cE733a6267BAc4',
    },
    {
      name: 'Bitcoin',
      symbol: 'hBTC',
      totalSupply: 10000000000,
      about:
        'Bitcoin (BTC) is a decentralized digital currency. hBTC is the bridged version of BTC on the Hathor Network.',
      bridged: true,
      sourceChain: 'Sepolia',
      targetChain: 'Hathor',
      originalAddress: '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f',
    },
    // {
    //   name: 'Storm Labs Token 7',
    //   symbol: 'hSLT7',
    //   totalSupply: 5000000000,
    //   about: 'SLT7 is a test token used for bridging between Sepolia and Hathor.',
    //   bridged: true,
    //   sourceChain: 'Sepolia',
    //   targetChain: 'Hathor',
    //   originalAddress: '0x97118caaE1F773a84462490Dd01FE7a3e7C4cdCd',
    // },
  ],
  pools: [
    {
      tokenSymbol: 'DZR',
      htrQuantity: 25000000, // 25M HTR worth $500k (at $0.02/HTR)
      tokenQuantity: 1000000, // 1M DZR worth $500k (at $0.50/DZR) - balanced pool
      fee: 0.005, // 0.5% -> converts to 5 basis points (matches contract pathfinding)
      protocolFee: 0.01,
    },
    {
      tokenSymbol: 'hUSDC',
      htrQuantity: 25000000, // 25M HTR worth $500k (at $0.02/HTR)
      tokenQuantity: 500000, // 500k USDC worth $500k (at $1.00/USDC) - balanced pool
      fee: 0.005, // 0.5% -> converts to 5 basis points (matches contract pathfinding)
      protocolFee: 0.01,
    },
    {
      tokenSymbol: 'hBTC',
      htrQuantity: 20000000, // 20M HTR worth $400k (at $0.02/HTR)
      tokenQuantity: 4, // 4 BTC worth $400k (at $100k/BTC) - balanced pool
      fee: 0.005, // 0.5% -> converts to 5 basis points (matches contract pathfinding)
      protocolFee: 0.01,
    },
    // Non-HTR pool for multi-hop testing: DZR/hUSDC
    {
      tokenSymbol: 'hUSDC', // will be paired with DZR (instead of HTR)
      htrQuantity: 0, // No HTR in this pool - this will be handled specially in seed script
      tokenQuantity: 250000, // 250k USDC worth $250k (increased liquidity)
      dzrQuantity: 500000, // 500k DZR worth $250k (at $0.50/DZR) - balanced pool
      fee: 0.005, // 0.5% -> converts to 5 basis points
      protocolFee: 0.01,
      isNonHTRPool: true, // Flag to identify this as a non-HTR pool
      pairTokenSymbol: 'DZR', // The other token in the pair
    },
    // {
    //   tokenSymbol: 'hSLT7',
    //   htrQuantity: 50000,
    //   tokenQuantity: 5000,
    //   fee: 0.05,
    //   protocolFee: 0.01,
    // },
  ],
  oasis: [
    {
      tokenSymbol: 'hUSDC',
      htrQuantity: 10_000_000,
    },
    {
      tokenSymbol: 'hBTC',
      htrQuantity: 50_000_000,
    },
    // {
    //   tokenSymbol: 'hSLT7',
    //   htrQuantity: 500_000,
    // },
  ],
}
