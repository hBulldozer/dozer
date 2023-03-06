import { Chain, ChainId } from '@dozer/chain'

import { Token } from '../Token'
import { uuidMapToTokenMap } from '../uuidMapToTokenMap'
import { HTR_UUID } from './token-uuid'

export const HTR = uuidMapToTokenMap(
  {
    chainId: ChainId.HATHOR,
    decimals: 2,
    symbol: 'HTR',
    name: 'Hathor',
  },
  HTR_UUID
) as Record<keyof typeof HTR_UUID, Token>
