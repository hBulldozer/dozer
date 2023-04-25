// import { getAddress } from '@ethersproject/address'
import { JSBI } from '@dozer/math'

import { Currency } from './Currency'

// TODO: implement hathor uuid take ethers from reference
export function getUuid(uuid: string): string {
  let result = null

  result = 'Hxxxx'

  return uuid
}
// TODO: implement hathor uuid take ethers from reference
// export function isUuid(uuid: string): boolean {
//   try {
//       getUuid(uuid);
//       return true;
//   } catch (error) { }
//   return false;
// }

/**
 * Represents an HTR token with a unique uuid and some metadata.
 */
export class Token extends Currency {
  // public readonly isNative = false as const
  // public readonly isToken = true as const

  /**
   * The  token's UUID
   */
  public readonly uuid: string

  /**
   * The rebase
   */
  readonly rebase: {
    base: JSBI
    elastic: JSBI
  }
  public constructor({
    chainId,
    totalSupply,
    uuid,
    decimals,
    symbol,
    name,
    rebase = { base: JSBI.BigInt(1), elastic: JSBI.BigInt(1) },
  }: {
    chainId: number | string
    totalSupply?: number
    uuid: string
    decimals: number
    symbol?: string
    name?: string
    rebase?: { base: JSBI; elastic: JSBI }
  }) {
    super({
      chainId,
      totalSupply,
      decimals,
      symbol,
      name,
    })
    try {
      this.uuid = getUuid(uuid)
    } catch {
      throw `${uuid} is not a valid uuid`
    }
    try {
      // TODO: No rebase?
      this.rebase = rebase
    } catch {
      throw `${rebase} is not a valid rebase`
    }
  }

  /**
   * Return this token, which does not need to be wrapped
   */
  public get wrapped(): Token {
    return this
  }

  public equals(other: Token): boolean {
    // return other.isNative && other.chainId === this.chainId
    return this.uuid == other.uuid
    // return false
  }

  public logoURI(): string {
    return `https://raw.githubusercontent.com/Dozer-Protocol/automatic-exchange-service/main/logos/${this.symbol}.svg`
  }
}
