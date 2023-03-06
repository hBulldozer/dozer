import { ChainId } from '@dozer/chain'

import { Token } from './Token'

export function getTokens(chainId: ChainId | undefined): Token[] {
  switch (chainId) {
    case ChainId.HATHOR: {
      return [
        new Token({ uuid: '00', decimals: 2, name: 'Hathor', symbol: 'HTR' }),
        new Token({ uuid: '0das23asds123', decimals: 2, name: 'Dozer', symbol: 'DZR' }),
      ]
    }
    case ChainId.HATHOR_TESTNET: {
      return [
        new Token({ uuid: '00', decimals: 2, name: 'Hathor', symbol: 'HTR' }),
        new Token({ uuid: '0das23asds123', decimals: 2, name: 'Dozer', symbol: 'DZR' }),
      ]
    }
    default:
      return []
  }
}
