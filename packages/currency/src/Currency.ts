import { ChainId } from '@dozer/chain'
import { JSBI } from '@dozer/math'
import invariant from 'tiny-invariant'

// import { Native } from './Native'
import { Token } from './Token'

/**
 * A currency is any fungible financial instrument, including HTR, all Hathor Custom tokens
 */
export abstract class Currency {
  public readonly imageUrl?: string
  /**
   * Returns whether the currency is native to the chain and must be wrapped (e.g. Ether)
   */
  // public abstract readonly isNative: boolean
  /**
   * Returns whether the currency is a token that is usable in Uniswap without wrapping
   */
  // public abstract readonly isToken: boolean
  /**
   * The decimals used in representing currency amounts
   */
  public readonly decimals: number
  /**
   * The symbol of the currency, i.e. a short textual non-unique identifier
   */
  public readonly symbol?: string
  /**
   * The name of the currency, i.e. a descriptive textual non-unique identifier
   */
  public readonly name?: string
  /**
   * The rebase
   */
  public readonly rebase?: { base: JSBI; elastic: JSBI }
  /**
   * The chain ID on which this currency resides
   */
  public readonly chainId: ChainId
  /**
   * Constructs an instance of the abstract class `Currency`.
   * @param chainId Id of the chain
   * @param decimals decimals of the currency
   * @param symbol symbol of the currency
   * @param name of the currency
   * @param rebase of the currency
   */
  protected constructor({
    imageUrl,
    chainId,
    decimals,
    symbol,
    name,
    rebase = { base: JSBI.BigInt(1), elastic: JSBI.BigInt(1) },
  }: {
    imageUrl?: string
    chainId: number | string
    decimals: number | string
    symbol?: string
    name?: string
    rebase?: { base: JSBI; elastic: JSBI }
  }) {
    // invariant(decimals >= 0 && decimals < 255 && Number.isInteger(Number(decimals)), 'DECIMALS')
    this.chainId = Number(chainId)
    this.decimals = Number(decimals)
    this.symbol = symbol
    this.name = name
    this.rebase = rebase
    this.imageUrl = imageUrl
  }

  /**
   * Return the wrapped version of this currency
   */
  public abstract get wrapped(): Token
}
