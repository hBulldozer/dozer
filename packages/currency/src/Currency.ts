// import { ChainId } from '@dozer/chain'
import { JSBI } from '@dozer/math'
import invariant from 'tiny-invariant'

// import { Native } from './Native'
import { Token } from './Token'

/**
 * A currency is any fungible financial instrument, including HTR, all Hathor Custom tokens
 */
export abstract class Currency {
  /**
   * Returns whether the currency is native to the chain and must be wrapped (e.g. Ether)
   */
  public abstract readonly isNative: boolean
  /**
   * Returns whether the currency is a token that is usable in Uniswap without wrapping
   */
  public abstract readonly isToken: boolean
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
   * Constructs an instance of the abstract class `Currency`.
   * @param decimals decimals of the currency
   * @param symbol symbol of the currency
   * @param name of the currency
   * @param rebase of the currency
   */
  protected constructor({
    decimals,
    symbol,
    name,
    rebase = { base: JSBI.BigInt(1), elastic: JSBI.BigInt(1) },
  }: {
    decimals: number | string
    symbol?: string
    name?: string
    rebase?: { base: JSBI; elastic: JSBI }
  }) {
    // invariant(decimals >= 0 && decimals < 255 && Number.isInteger(Number(decimals)), 'DECIMALS')

    this.decimals = Number(decimals)
    this.symbol = symbol
    this.name = name
    this.rebase = rebase
  }

  /**
   * Return the wrapped version of this currency
   */
  public abstract get wrapped(): Token
}
