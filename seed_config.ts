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
      htrQuantity: 1_000_000,
    },
    {
      tokenSymbol: 'hBTC',
      htrQuantity: 10_000_000,
    },
    // {
    //   tokenSymbol: 'hSLT7',
    //   htrQuantity: 500_000,
    // },
  ],
}
