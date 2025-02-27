export interface TokenConfig {
  name: string
  symbol: string
  totalSupply: number
  about: string
}

export interface PoolConfig {
  tokenSymbol: string
  htrQuantity: number
  tokenQuantity: number
  fee: number
  protocolFee: number
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
      name: 'hUSDC',
      symbol: 'hUSDC',
      totalSupply: 280000000,
      about: 'hUSDC is the bridged version of USDC on the Hathor Network.',
    },
    {
      name: 'Bitcoin',
      symbol: 'BTC',
      totalSupply: 10000000,
      about: 'Bitcoin (BTC) is a decentralized digital currency.',
    },
  ],
  pools: [
    {
      tokenSymbol: 'DZR',
      htrQuantity: 100000,
      tokenQuantity: 10000,
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
      tokenSymbol: 'BTC',
      htrQuantity: 100000000,
      tokenQuantity: 100,
      fee: 0.05,
      protocolFee: 0.01,
    },
  ],
  oasis: [
    {
      tokenSymbol: 'hUSDC',
      htrQuantity: 1_000_000,
    },
    {
      tokenSymbol: 'BTC',
      htrQuantity: 10_000_000,
    },
  ],
}
