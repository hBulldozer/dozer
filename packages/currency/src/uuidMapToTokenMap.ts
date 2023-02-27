import { Token } from './Token'

export function uuidMapToTokenMap(
  { decimals, symbol, name }: { decimals: number; symbol?: string; name?: string },
  map: Record<number | string, string>
) {
  return Object.fromEntries(
    Object.entries(map).map(([uuid]) => [
      new Token({
        uuid,
        decimals,
        symbol,
        name,
      }),
    ])
  )
}
