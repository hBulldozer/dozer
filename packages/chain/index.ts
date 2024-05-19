// *TODO Review
export interface Chain {
  name: string
  // chain: string
  icon?: string
  // rpc: string[]
  faucets?: string[]
  infoURL?: string
  // shortName: string
  explorers?: Explorer[]
  title?: string
  // network?: Network
}

export interface Explorer {
  name: string
  url: string
  icon?: string
}

export enum Network {
  Mainnet = 'mainnet',
  Testnet = 'testnet',
}

export enum ChainId {
  HATHOR = 1,
  HATHOR_TESTNET = 2,
}

export enum ChainKey {
  HATHOR = 'hathor',
  HATHOR_TESTNET = 'hathor-testnet',
}

const CHAINS = [
  {
    name: 'Hathor',
    // chain: 'Hathor',
    // rpc: [''],
    faucets: [],
    chainId: 1,
    infoURL: 'https://hathor.network',
    // shortName: 'hathor',
    explorers: [
      {
        name: 'Hathor Explorer',
        url: 'https://explorer.hathor.network',
      },
    ],
  },
  {
    name: 'Hathor testnet',
    // chain: 'Hathor',
    // rpc: [''],
    faucets: [],
    chainId: 2,
    infoURL: 'https://hathor.network',
    // shortName: 'hathor',
    explorers: [
      {
        name: 'Hathor TestNet Explorer',
        url: 'https://explorer.testnet.hathor.network',
      },
    ],
  },
] as const

export class Chain implements Chain {
  constructor(data: (typeof CHAINS)[number]) {
    Object.assign(this, data)
  }
  getTxUrl(txHash: string): string {
    if (!this.explorers) return ''
    if (process.env.NEXT_PUBLIC_LOCAL_EXPLORER_URL)
      return `${process.env.NEXT_PUBLIC_LOCAL_EXPLORER_URL}/transaction/${txHash}`
    for (const explorer of this.explorers) {
      return `${explorer.url}/transaction/${txHash}`
    }
    return ''
  }
  getTokenUrl(tokenUUID: string): string {
    if (!this.explorers) return ''
    for (const explorer of this.explorers) {
      return `${explorer.url}/token_detail/${tokenUUID}`
    }
    return ''
  }
  getAccountUrl(accountAddress: string): string {
    if (!this.explorers) return ''
    for (const explorer of this.explorers) {
      return `${explorer.url}/address/${accountAddress}`
    }
    return ''
  }
}

// Chain Short Name => Chain Id mapping
export const chainNameToChainId = Object.fromEntries(CHAINS.map((data): [string] => [data.name]))

// Chain Id => Chain Name mapping
export const chainName = Object.fromEntries(CHAINS.map((data): [number, string] => [data.chainId, data.name]))

// Chain Id => Chain mapping
export const chains = Object.fromEntries(CHAINS.map((data): [ChainId, Chain] => [data.chainId, new Chain(data)]))

export default chains
