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
  poolFee: number // Pool fee in basis points (e.g., 100 = 1%)
  protocolFee: number // Protocol fee in thousandths (e.g., 50 = 5%)
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
      totalSupply: 14_000_000_00,
      about:
        'DZR is the native utility token of Dozer Finance, a decentralized finance (DeFi) platform built on the Hathor Network.',
    },
    {
      name: 'USDC',
      symbol: 'hUSDC',
      totalSupply: 28_000_000_00,
      about: 'hUSDC is the bridged version of USDC on the Hathor Network.',
      bridged: true,
      sourceChain: 'Sepolia',
      targetChain: 'Hathor',
      originalAddress: '0x3E1Adb4e24a48B90ca10c28388cE733a6267BAc4',
    },
    {
      name: 'NileSwap Token',
      symbol: 'NST',
      totalSupply: 550_000_00,
      about: 'NileSwap Token is the designated rewards token for the NileSwap platform.',
      bridged: true,
      sourceChain: 'Sepolia',
      targetChain: 'Hathor',
      originalAddress: '0xa1b2c3d4e5f6789012345678901234567890abcd',
    },
    {
      name: 'Cathor',
      symbol: 'CTHOR',
      totalSupply: 30_000_00,
      about: 'Cathor is the original Hathor Network community coin.',
      bridged: true,
      sourceChain: 'Sepolia',
      targetChain: 'Hathor',
      originalAddress: '0x1234567890abcdef1234567890abcdef12345678',
    },
  ],
  pools: [
    {
      tokenSymbol: 'DZR',
      htrQuantity: 25_000_000, // 25M HTR worth $500k (at $0.02/HTR)
      tokenQuantity: 1_000_000, // 1M DZR worth $500k (at $0.50/DZR) - balanced pool
      fee: 0.005, // 0.5% -> converts to 5 basis points (matches contract pathfinding)
      protocolFee: 0.01,
    },
    {
      tokenSymbol: 'hUSDC',
      htrQuantity: 25_000_000, // 25M HTR worth $500k (at $0.02/HTR)
      tokenQuantity: 500_000, // 500k USDC worth $500k (at $1.00/USDC) - balanced pool
      fee: 0.005, // 0.5% -> converts to 5 basis points (matches contract pathfinding)
      protocolFee: 0.01,
    },
    {
      tokenSymbol: 'NST',
      htrQuantity: 3_000_000, // 3M HTR worth $300k (at $0.02/HTR)
      tokenQuantity: 40_000, // 40k NST worth $300k (at $1.50/NST) - balanced pool
      fee: 0.005, // 0.5% -> converts to 5 basis points (matches contract pathfinding)
      protocolFee: 0.01,
    },
    {
      tokenSymbol: 'CTHOR',
      htrQuantity: 2_000_000, // 2M HTR worth $400k (at $0.02/HTR)
      tokenQuantity: 8_000, // 8k CTHOR worth $400k (at $5.00/CTHOR) - balanced pool
      fee: 0.005, // 0.5% -> converts to 5 basis points (matches contract pathfinding)
      protocolFee: 0.01,
    },
    // Non-HTR pool for multi-hop testing: DZR/hUSDC
    {
      tokenSymbol: 'hUSDC', // will be paired with DZR (instead of HTR)
      htrQuantity: 0, // No HTR in this pool - this will be handled specially in seed script
      tokenQuantity: 250_000, // 250k USDC worth $250k (increased liquidity)
      dzrQuantity: 500_000, // 500k DZR worth $250k (at $0.50/DZR) - balanced pool
      fee: 0.001, // 0.1% -> converts to 3 basis points
      protocolFee: 0.01,
      isNonHTRPool: true, // Flag to identify this as a non-HTR pool
      pairTokenSymbol: 'DZR', // The other token in the pair
    },
  ],
  oasis: [
    {
      tokenSymbol: 'hUSDC',
      htrQuantity: 10_000_000,
      poolFee: 5, // 0.5% pool fee (matches the pool fee)
      protocolFee: 1, // 0.1% protocol fee
    },
    // {
    //   tokenSymbol: 'DZR',
    //   htrQuantity: 15_000_000,
    //   poolFee: 5, // 0.5% pool fee (matches the pool fee)
    //   protocolFee: 50, // 5% protocol fee
    // },
    // {
    //   tokenSymbol: 'NST',
    //   htrQuantity: 12_000_000,
    //   poolFee: 5, // 0.5% pool fee (matches the pool fee)
    //   protocolFee: 50, // 5% protocol fee
    // },
    // {
    //   tokenSymbol: 'CTHOR',
    //   htrQuantity: 8_000_000,
    //   poolFee: 5, // 0.5% pool fee (matches the pool fee)
    //   protocolFee: 50, // 5% protocol fee
    // },
  ],
}
