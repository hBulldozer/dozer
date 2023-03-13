import { Token } from './Token'
import { ChainId } from '@dozer/chain'

export function uuidMapToTokenMap(
  { chainId, decimals, symbol, name }: { chainId: ChainId; decimals: number; symbol?: string; name?: string },
  map: Record<number | string, string>
) {
  return Object.fromEntries(
    Object.entries(map).map(([uuid]) => [
      new Token({
        chainId,
        uuid,
        decimals,
        symbol,
        name,
      }),
    ])
  )
}
