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

export const bravoConfig: SeedConfig = {
  tokens: [
    {
      name: 'Dozer',
      symbol: 'DZR',
      totalSupply: 16000000, // 16M DZR, $0.50 each, $8M market cap
      about:
        'DZR is the native utility token of Dozer Finance, a decentralized finance (DeFi) platform built on the Hathor Network.',
    },
    {
      name: 'USDC',
      symbol: 'hUSDC',
      totalSupply: 1000000, // 1M USDC, $1.00 each, $1M market cap (arbitrary, as stablecoin)
      about: 'hUSDC is the bridged version of USDC on the Hathor Network.',
      bridged: true,
      sourceChain: 'Sepolia',
      targetChain: 'Hathor',
      originalAddress: '0x3E1Adb4e24a48B90ca10c28388cE733a6267BAc4',
    },
    {
      name: 'NileSwap Token',
      symbol: 'NST',
      totalSupply: 200000, // 200k NST, $1.50 each, $300k market cap
      about: 'NileSwap Token is the designated rewards token for the NileSwap platform.',
    },
    {
      name: 'Cathor',
      symbol: 'CTHOR',
      totalSupply: 60000, // 60k CTHOR, $5.00 each, $300k market cap
      about: 'Cathor is the original Hathor Network community coin.',
    },
  ],
  pools: [
    {
      tokenSymbol: 'DZR',
      htrQuantity: 2500000, // 2.5M HTR ($50k at $0.02)
      tokenQuantity: 100000, // 100k DZR ($50k at $0.50)
      fee: 0.005, // 0.5%
      protocolFee: 0.01,
    },
    {
      tokenSymbol: 'hUSDC',
      htrQuantity: 1500000, // 1.5M HTR ($30k at $0.02)
      tokenQuantity: 30000, // 30k hUSDC ($30k at $1.00)
      fee: 0.003, // 0.3% for stable pair
      protocolFee: 0.01,
    },
    {
      tokenSymbol: 'NST',
      htrQuantity: 500000, // 500k HTR ($10k at $0.02)
      tokenQuantity: 6667, // 6.67k NST ($10k at $1.50)
      fee: 0.005, // 0.5%
      protocolFee: 0.01,
    },
    {
      tokenSymbol: 'CTHOR',
      htrQuantity: 500000, // 500k HTR ($10k at $0.02)
      tokenQuantity: 2000, // 2k CTHOR ($10k at $5.00)
      fee: 0.005, // 0.5%
      protocolFee: 0.01,
    },
    {
      tokenSymbol: 'hUSDC', // DZR/hUSDC pool
      htrQuantity: 0, // No HTR in this pool
      tokenQuantity: 25000, // 25k hUSDC ($25k at $1.00)
      dzrQuantity: 50000, // 50k DZR ($25k at $0.50)
      fee: 0.003, // 0.3% for stable pair
      protocolFee: 0.01,
      isNonHTRPool: true,
      pairTokenSymbol: 'DZR',
    },
  ],
  oasis: [],
}
