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

export interface SeedConfig {
  tokens: TokenConfig[]
  pools: PoolConfig[]
}

export const seedConfig: SeedConfig = {
  tokens: [
    {
      name: 'USD Tether',
      symbol: 'USDT',
      totalSupply: 280000000,
      about: 'Tether (USDT) is a cryptocurrency with a value meant to mirror the value of the U.S. dollar.',
    },
    {
      name: 'YIN',
      symbol: 'YIN',
      totalSupply: 20000000,
      about:
        "Drawing from the ancient principle of receptive energy, YIN embodies the patient and accumulative aspects of trading. This token rewards strategic holders and liquidity providers who take a measured approach to market participation. Through its unique tokenomics, YIN's supply mechanics favor steady accumulation and long-term commitment, making it an ideal instrument for traders who practice careful position building and value preservation.",
    },
    {
      name: 'YANG',
      symbol: 'YANG',
      totalSupply: 20000000,
      about:
        "Embodying the dynamic and assertive force of its namesake, YANG is designed for active market participants and bold traders. This token incentivizes market making and frequent trading activity, with mechanics that reward decisive market moves and strategic timing. YANG's supply responds dynamically to market conditions, making it particularly attractive to traders who thrive on momentum and actively shape market dynamics.",
    },
  ],
  pools: [
    {
      tokenSymbol: 'USDT',
      htrQuantity: 462000,
      tokenQuantity: 18480,
      fee: 0.05,
      protocolFee: 0.01,
    },
    {
      tokenSymbol: 'YIN',
      htrQuantity: 100000,
      tokenQuantity: 100000,
      fee: 0.05,
      protocolFee: 0.01,
    },
    {
      tokenSymbol: 'YANG',
      htrQuantity: 100000,
      tokenQuantity: 100000,
      fee: 0.05,
      protocolFee: 0.01,
    },
  ],
}
