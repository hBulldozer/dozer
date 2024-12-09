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
      name: 'USD Tether',
      symbol: 'USDT',
      totalSupply: 280000000,
      about: 'Tether (USDT) is a cryptocurrency with a value meant to mirror the value of the U.S. dollar.',
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
      tokenSymbol: 'USDT',
      htrQuantity: 462000,
      tokenQuantity: 18480,
      fee: 0.05,
      protocolFee: 0.01,
    },
  ],
  oasis: [
    {
      tokenSymbol: 'USDT',
      htrQuantity: 1_000_000,
    },
  ],
}
