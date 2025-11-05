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
    // {
    //   name: 'Dozer',
    //   symbol: 'DZR',
    //   totalSupply: 14_000_000_00,
    //   about:
    //     'DZR is the native utility token of Dozer Finance, a decentralized finance (DeFi) platform built on the Hathor Network.',
    // },
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
    {
      name: 'Kelbcoin',
      symbol: 'KELB',
      totalSupply: 30_420_00,
      about: 'Kelbcoin ($KELB) is a meme coin with utility on the Hathor network.',
    },
  ],
  pools: [
    // {
    //   tokenSymbol: 'DZR',
    //   htrQuantity: 1_000, // Minimal liquidity: 1,000 HTR
    //   tokenQuantity: 2_000, // DZR = 0.5 HTR, so 2,000 DZR
    //   fee: 0.005, // 0.5% -> converts to 5 basis points (matches contract pathfinding)
    //   protocolFee: 0.01,
    // },
    {
      tokenSymbol: 'hUSDC',
      htrQuantity: 1_000, // Minimal liquidity: 1,000 HTR
      tokenQuantity: 20, // hUSDC = 1 USD, HTR = $0.02, so 1000 * 0.02 = 20 USDC
      fee: 0.008, // 0.8% -> converts to 8 basis points (matches contract pathfinding)
      protocolFee: 0.01,
    },
    {
      tokenSymbol: 'NST',
      htrQuantity: 1_000, // Minimal liquidity: 1,000 HTR
      tokenQuantity: 1_764, // NST = 0.567 HTR (10% discount from 0.63), so 1000 / 0.567 = 1,764 NST
      fee: 0.008, // 0.8% -> converts to 8 basis points (matches contract pathfinding)
      protocolFee: 0.01,
    },
    {
      tokenSymbol: 'CTHOR',
      htrQuantity: 1_000, // Minimal liquidity: 1,000 HTR
      tokenQuantity: 13, // CTHOR = 74.34 HTR (10% discount from 82.6), so 1000 / 74.34 = 13.45 CTHOR
      fee: 0.008, // 0.8% -> converts to 8 basis points (matches contract pathfinding)
      protocolFee: 0.01,
    },
    {
      tokenSymbol: 'KELB',
      htrQuantity: 1_000, // Minimal liquidity: 1,000 HTR
      tokenQuantity: 39, // KELB = 25.91 HTR (10% discount from 28.79), so 1000 / 25.91 = 38.6 KELB
      fee: 0.008, // 0.8% -> converts to 8 basis points (matches contract pathfinding)
      protocolFee: 0.01,
    },
    // Non-HTR pool for multi-hop testing: DZR/hUSDC
    // {
    //   tokenSymbol: 'hUSDC', // will be paired with DZR (instead of HTR)
    //   htrQuantity: 0, // No HTR in this pool - this will be handled specially in seed script
    //   tokenQuantity: 100, // Minimal liquidity: 100 USDC
    //   dzrQuantity: 5_882, // DZR = 0.5 HTR = $0.017, USDC = $1, so 100 / 0.017 = 5,882 DZR
    //   fee: 0.001, // 0.1% -> converts to 3 basis points
    //   protocolFee: 0.01,
    //   isNonHTRPool: true, // Flag to identify this as a non-HTR pool
    //   pairTokenSymbol: 'DZR', // The other token in the pair
    // },
  ],
  oasis: [
    {
      tokenSymbol: 'hUSDC',
      htrQuantity: 100_000, // Minimal liquidity: 1,000 HTR
      poolFee: 5, // 0.5% pool fee (matches the pool fee)
      protocolFee: 1, // 0.1% protocol fee
    },
    // {
    //   tokenSymbol: 'DZR',
    //   htrQuantity: 1_000, // Minimal liquidity: 1,000 HTR
    //   poolFee: 5, // 0.5% pool fee (matches the pool fee)
    //   protocolFee: 50, // 5% protocol fee
    // },
    // {
    //   tokenSymbol: 'NST',
    //   htrQuantity: 1_000, // Minimal liquidity: 1,000 HTR
    //   poolFee: 5, // 0.5% pool fee (matches the pool fee)
    //   protocolFee: 50, // 5% protocol fee
    // },
    // {
    //   tokenSymbol: 'CTHOR',
    //   htrQuantity: 1_000, // Minimal liquidity: 1,000 HTR
    //   poolFee: 5, // 0.5% pool fee (matches the pool fee)
    //   protocolFee: 50, // 5% protocol fee
    // },
  ],
}
