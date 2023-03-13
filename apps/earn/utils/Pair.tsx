import { ChainId } from '@dozer/chain'
import { Token } from '@dozer/currency'

export type Maybe<T> = T | null
export type InputMaybe<T> = Maybe<T>

export type UserWithFarm = {
  id: number
  chainId: number
  unstakedBalance: number
  stakedBalance: number
  valueUSD: number
  pair: Pair
}

export type Scalars = {
  ID: string
  /** The `String` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text. */
  String: string
  Boolean: boolean
  /** The `Int` scalar type represents non-fractional signed whole numeric values. Int can represent values between -(2^31) and 2^31 - 1. */
  Int: number
  /** The `Float` scalar type represents signed double-precision fractional values as specified by [IEEE 754](https://en.wikipedia.org/wiki/IEEE_floating_point). */
  Float: number
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: any
  ObjMap: any
  BigDecimal: any
  BigInt: any
  Bytes: any
  deprecated_BigDecimal: any
  deprecated_Bytes: any
}
export type Pair = {
  id: string
  name: string
  liquidityUSD: number
  volumeUSD: number
  feeUSD: number
  apr: number
  /**  First Token  */
  token0: Token
  /**  Second Token  */
  token1: Token
  chainId: ChainId
  reserve0: number
  reserve1: number
  liquidity: number
  volume1d: number
  fees1d: number
}
// export type Pair = {
//   /**  Pair address (contract address)  */
//   id: Scalars['ID']
//   /**  Pair type  */
//   type: any
//   /**  Swap fee  */
//   swapFee: Scalars['BigInt']
//   /**  TWAP - time weighted average price  */
//   twapEnabled: Scalars['Boolean']
//   /**  name of the pair, this combines symbol of both tokens, e.g. WETH/SUSHI  */
//   name: Scalars['String']
//   /**  First Token  */
//   token0: any
//   /**  Second Token  */
//   token1: any
//   /**  Which source this pair comes from, in this case it will always be 'TRIDENT'  */
//   source: Scalars['String']
//   /**  Which block this pair was created on  */
//   createdAtBlock: Scalars['BigInt']
//   /**  When this pair was created  */
//   createdAtTimestamp: Scalars['BigInt']
//   /**  Liquidity of first token  */
//   reserve0: Scalars['BigInt']
//   /**  Liquidity of second token  */
//   reserve1: Scalars['BigInt']
//   /**  Liquidity, Total supply of all LP in this pool  */
//   liquidity: Scalars['BigInt']
//   /**  USD liquidity */
//   liquidityUSD: Scalars['BigDecimal']
//   /**  Native Liquidity  */
//   liquidityNative: Scalars['BigDecimal']
//   /**  Tracked Liquidity native  */
//   trackedLiquidityNative: Scalars['BigDecimal']
//   /**  Price of the first token in this pair, not to be confused with TokenPrice entity  */
//   token0Price: Scalars['BigDecimal']
//   /**  Price of the second token in this pair, not to be confused with TokenPrice entity  */
//   token1Price: Scalars['BigDecimal']
//   volumeNative: Scalars['BigDecimal']
//   volumeUSD: Scalars['BigDecimal']
//   /**  Untracked Volume in USD  */
//   untrackedVolumeUSD: Scalars['BigDecimal']
//   volumeToken0: Scalars['BigDecimal']
//   volumeToken1: Scalars['BigDecimal']
//   /**  Fee in Native  */
//   feesNative: Scalars['BigDecimal']
//   /**  Fee in USD  */
//   feesUSD: Scalars['BigDecimal']
//   /**  APR  */
//   apr: Scalars['BigDecimal']
//   /**  When APR was last updated  */
//   aprUpdatedAtTimestamp: Scalars['BigInt']
//   /**  Transaction count  */
//   txCount: Scalars['BigInt']
//   /**  Liquidity Positions  */
//   //   liquidityPositions: Array<LiquidityPosition>
//   /**  Liquidity position snapshots  */
//   //   liquidityPositionSnapshots: Array<LiquidityPositionSnapshot>
//   /**  Pair Hour Snapshot  */
//   //   hourSnapshots: Array<PairHourSnapshot>
//   /**  Pair Day Snapshot  */
//   //   daySnapshots: Array<PairDaySnapshot>
//   chainId: Scalars['Int']
//   address: Scalars['String']
//   liquidity1dChange?: Maybe<Scalars['BigDecimal']>
//   liquidity1wChange?: Maybe<Scalars['BigDecimal']>
//   volume1d?: Maybe<Scalars['BigDecimal']>
//   volume1dChange?: Maybe<Scalars['BigDecimal']>
//   volume1w?: Maybe<Scalars['BigDecimal']>
//   fees1d?: Maybe<Scalars['BigDecimal']>
//   fees1w?: Maybe<Scalars['BigDecimal']>
//   fees1dChange?: Maybe<Scalars['BigDecimal']>
//   utilisation1d?: Maybe<Scalars['BigDecimal']>
//   utilisation2d?: Maybe<Scalars['BigDecimal']>
//   utilisation1dChange?: Maybe<Scalars['BigDecimal']>
//   txCount1d?: Maybe<Scalars['BigDecimal']>
//   txCount1dChange?: Maybe<Scalars['BigDecimal']>
//   txCount1w?: Maybe<Scalars['BigDecimal']>
//   feeApr?: Maybe<Scalars['BigDecimal']>
//   incentiveApr?: Maybe<Scalars['BigDecimal']>
//   //   farm?: Maybe<Farm>
//   sourceName?: Maybe<Scalars['String']>
// }
