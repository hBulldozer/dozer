import { Token } from '@dozer/currency'
import { dbTokenWithPools, dbToken } from '../interfaces'

export default function toToken(dbToken: dbToken | dbTokenWithPools): Token {
  return new Token({
    chainId: dbToken.chainId,
    uuid: dbToken.uuid,
    decimals: dbToken.decimals,
    name: dbToken.name,
    symbol: dbToken.symbol,
  })
}
