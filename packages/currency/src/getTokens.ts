import { ChainId } from '@dozer/chain'

import { Token } from './Token'

export function getTokens(chainId: ChainId | undefined): Token[] {
  switch (chainId) {
    case ChainId.HATHOR: {
      return [
        new Token({ chainId: chainId, uuid: '00', decimals: 2, name: 'Hathor', symbol: 'HTR' }),
        new Token({
          chainId: chainId,
          uuid: '00b1b246cb512515c5258cb0301afcf83e74eb595dbe655d14e11782db4b70c6',
          decimals: 2,
          name: 'Dozer',
          symbol: 'DZR',
        }),
        new Token({
          chainId: chainId,
          uuid: '000000007d74aaa2d49ed93e62cdefea665a25ecf7cd1a02330fea13ba40c823',
          decimals: 2,
          name: 'Nileswap Token',
          symbol: 'NST',
        }),
        new Token({
          chainId: chainId,
          uuid: '000000002e55df1a7cf4daaf79dc3929e5a89929ae6b5173714f90b47cf13723',
          decimals: 2,
          name: 'Cathor',
          symbol: 'CTHOR',
        }),
      ]
    }
    case ChainId.HATHOR_TESTNET: {
      return [
        new Token({ chainId: chainId, uuid: '00', decimals: 2, name: 'Hathor', symbol: 'HTR' }),
        new Token({
          chainId: chainId,
          uuid: '00b1b246cb512515c5258cb0301afcf83e74eb595dbe655d14e11782db4b70c6',
          decimals: 2,
          name: 'Dozer',
          symbol: 'DZR',
        }),
        new Token({
          chainId: chainId,
          uuid: '000000007d74aaa2d49ed93e62cdefea665a25ecf7cd1a02330fea13ba40c823',
          decimals: 2,
          name: 'Nileswap Token',
          symbol: 'NST',
        }),
        new Token({
          chainId: chainId,
          uuid: '000000002e55df1a7cf4daaf79dc3929e5a89929ae6b5173714f90b47cf13723',
          decimals: 2,
          name: 'Cathor',
          symbol: 'CTHOR',
        }),
      ]
    }
    default:
      return []
  }
}
