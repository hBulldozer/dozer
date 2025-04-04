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
      name: 'USDC',
      symbol: 'hUSDC',
      totalSupply: 280000000,
      about: 'hUSDC is the bridged version of USDC on the Hathor Network.',
      bridged: true,
      sourceChain: 'Arbitrum',
      targetChain: 'Hathor',
      originalAddress: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
    },
    {
      name: 'Bitcoin',
      symbol: 'hBTC',
      totalSupply: 10000000,
      about:
        'Bitcoin (BTC) is a decentralized digital currency. hBTC is the bridged version of BTC on the Hathor Network.',
      bridged: true,
      sourceChain: 'Arbitrum',
      targetChain: 'Hathor',
      originalAddress: '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f',
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
      tokenSymbol: 'hBTC',
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
      tokenSymbol: 'hBTC',
      htrQuantity: 10_000_000,
    },
  ],
}
