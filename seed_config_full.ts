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
      totalSupply: 140000000,
      about:
        'DZR is the native utility token of Dozer Finance, a decentralized finance (DeFi) platform built on the Hathor Network.',
    },
    {
      name: 'USD Tether',
      symbol: 'hUSDC',
      totalSupply: 280000000,
      about: 'Tether (hUSDC) is a cryptocurrency with a value meant to mirror the value of the U.S. dollar.',
    },
    {
      name: 'NileSwap Token',
      symbol: 'NST',
      totalSupply: 100000000,
      about: 'NileSwap Token is the designated rewards token for the NileSwap platform.',
    },
    {
      name: 'Cathor',
      symbol: 'CTHOR',
      totalSupply: 100000000,
      about: 'Cathor is the original Hathor Network community coin.',
    },
    {
      name: 'Kelbcoin',
      symbol: 'KELB',
      totalSupply: 100000000,
      about: 'Kelbcoin ($KELB) is a meme coin with utility on the Hathor network.',
    },
  ],
  pools: [
    {
      tokenSymbol: 'DZR',
      htrQuantity: 100000,
      tokenQuantity: 70000,
      fee: 0.05,
      protocolFee: 0.01,
    },
    {
      tokenSymbol: 'hUSDC',
      htrQuantity: 462000,
      tokenQuantity: 18480,
      fee: 0.05,
      protocolFee: 0.01,
    },
    {
      tokenSymbol: 'NST',
      htrQuantity: 50000,
      tokenQuantity: 41350,
      fee: 0.05,
      protocolFee: 0.01,
    },
    {
      tokenSymbol: 'CTHOR',
      htrQuantity: 50000,
      tokenQuantity: 3900,
      fee: 0.05,
      protocolFee: 0.01,
    },
    {
      tokenSymbol: 'KELB',
      htrQuantity: 50000,
      tokenQuantity: 2900,
      fee: 0.05,
      protocolFee: 0.01,
    },
  ],
  oasis: [
    {
      tokenSymbol: 'DZR',
      htrQuantity: 100000,
    },
    {
      tokenSymbol: 'hUSDC',
      htrQuantity: 462000,
    },
    {
      tokenSymbol: 'NST',
      htrQuantity: 50000,
    },
    {
      tokenSymbol: 'CTHOR',
      htrQuantity: 50000,
    },
    {
      tokenSymbol: 'KELB',
      htrQuantity: 50000,
    },
  ],
}
