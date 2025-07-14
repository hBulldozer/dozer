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
      name: 'NileSwap Token',
      symbol: 'NST',
      totalSupply: 10000000000,
      about: 'NileSwap Token is the designated rewards token for the NileSwap platform.',
      bridged: true,
      sourceChain: 'Sepolia',
      targetChain: 'Hathor',
      originalAddress: '0xa1b2c3d4e5f6789012345678901234567890abcd',
    },
    {
      name: 'Cathor',
      symbol: 'CTHOR',
      totalSupply: 10000000000,
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
    // {
    //   tokenSymbol: 'NST',
    //   htrQuantity: 15000000, // 15M HTR worth $300k (at $0.02/HTR)
    //   tokenQuantity: 200000, // 200k NST worth $300k (at $1.50/NST) - balanced pool
    //   fee: 0.005, // 0.5% -> converts to 5 basis points (matches contract pathfinding)
    //   protocolFee: 0.01,
    // },
    // {
    //   tokenSymbol: 'CTHOR',
    //   htrQuantity: 20000000, // 20M HTR worth $400k (at $0.02/HTR)
    //   tokenQuantity: 80000, // 80k CTHOR worth $400k (at $5.00/CTHOR) - balanced pool
    //   fee: 0.005, // 0.5% -> converts to 5 basis points (matches contract pathfinding)
    //   protocolFee: 0.01,
    // },
    // // Non-HTR pool for multi-hop testing: DZR/hUSDC
    // {
    //   tokenSymbol: 'hUSDC', // will be paired with DZR (instead of HTR)
    //   htrQuantity: 0, // No HTR in this pool - this will be handled specially in seed script
    //   tokenQuantity: 250000, // 250k USDC worth $250k (increased liquidity)
    //   dzrQuantity: 500000, // 500k DZR worth $250k (at $0.50/DZR) - balanced pool
    //   fee: 0.005, // 0.5% -> converts to 5 basis points
    //   protocolFee: 0.01,
    //   isNonHTRPool: true, // Flag to identify this as a non-HTR pool
    //   pairTokenSymbol: 'DZR', // The other token in the pair
    // },
    // // Non-HTR pool for multi-hop testing: NST/CTHOR
    // {
    //   tokenSymbol: 'CTHOR', // will be paired with NST (instead of HTR)
    //   htrQuantity: 0, // No HTR in this pool - this will be handled specially in seed script
    //   tokenQuantity: 30000, // 30k CTHOR worth $150k (at $5.00/CTHOR)
    //   dzrQuantity: 100000, // 100k NST worth $150k (at $1.50/NST) - balanced pool
    //   fee: 0.005, // 0.5% -> converts to 5 basis points
    //   protocolFee: 0.01,
    //   isNonHTRPool: true, // Flag to identify this as a non-HTR pool
    //   pairTokenSymbol: 'NST', // The other token in the pair
    // },
    // // Non-HTR pool for multi-hop testing: hUSDC/NST (stable/rewards pair)
    // {
    //   tokenSymbol: 'NST', // will be paired with hUSDC (instead of HTR)
    //   htrQuantity: 0, // No HTR in this pool - this will be handled specially in seed script
    //   tokenQuantity: 66666, // 66.6k NST worth $100k (at $1.50/NST)
    //   dzrQuantity: 100000, // 100k USDC worth $100k - balanced pool
    //   fee: 0.003, // 0.3% -> converts to 3 basis points (medium fee for stable/rewards pair)
    //   protocolFee: 0.01,
    //   isNonHTRPool: true, // Flag to identify this as a non-HTR pool
    //   pairTokenSymbol: 'hUSDC', // The other token in the pair
    // },
  ],
  oasis: [
    {
      tokenSymbol: 'hUSDC',
      htrQuantity: 10_000_000,
      poolFee: 5, // 0.5% pool fee (matches the pool fee)
      protocolFee: 50, // 5% protocol fee
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
