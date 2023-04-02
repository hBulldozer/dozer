
/**
 * Client
**/

import * as runtime from './runtime/library';
type UnwrapPromise<P extends any> = P extends Promise<infer R> ? R : P
type UnwrapTuple<Tuple extends readonly unknown[]> = {
  [K in keyof Tuple]: K extends `${number}` ? Tuple[K] extends Prisma.PrismaPromise<infer X> ? X : UnwrapPromise<Tuple[K]> : UnwrapPromise<Tuple[K]>
};

export type PrismaPromise<T> = runtime.Types.Public.PrismaPromise<T>


/**
 * Model Token
 * 
 */
export type Token = {
  id: string
  uuid: string
  chainId: number
  name: string
  symbol: string
  isFeeOnTransfer: boolean
  isCommon: boolean
  derivedUSD: number | null
  generatedAt: Date
  updatedAt: Date
  decimals: number
}

/**
 * Model Pool
 * 
 */
export type Pool = {
  id: string
  name: string
  apr: number
  chainId: number
  version: string
  token0Id: string
  token1Id: string
  swapFee: number
  feeUSD: number
  reserve0: string
  reserve1: string
  liquidityUSD: number
  volumeUSD: number
  liquidity: number
  volume1d: number
  fees1d: number
  generatedAt: Date
  updatedAt: Date
}

/**
 * Model daySnapshot
 * 
 */
export type daySnapshot = {
  id: number
  poolId: string
  date: Date
  volumeUSD: number
  liquidityUSD: number
  apr: number
}

/**
 * Model hourSnapshot
 * 
 */
export type hourSnapshot = {
  id: number
  poolId: string
  date: Date
  volumeUSD: number
  liquidityUSD: number
  apr: number
}

/**
 * Model DozerPool
 * 
 */
export type DozerPool = {
  id: string
  name: string
  chainId: number
  version: string
  token0Id: string
  token1Id: string
  swapFee: number
  twapEnabled: boolean
  reserve0: string
  reserve1: string
  totalSupply: string
  liquidityUSD: number
  volumeUSD: number
  token0Price: string
  token1Price: string
  feeApr: number
  incentiveApr: number
  totalApr: number
  isIncentivized: boolean
  volume1d: number
  fees1d: number
  volume1w: number
  fees1w: number
  createdAtBlockNumber: bigint
  isBlacklisted: boolean
  generatedAt: Date
  updatedAt: Date
}

/**
 * Model Incentive
 * 
 */
export type Incentive = {
  id: string
  chainId: number
  apr: number
  rewardPerDay: number
  rewardTokenId: string
  poolId: string
  pid: number
  rewarderAddress: string
}


/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Tokens
 * const tokens = await prisma.token.findMany()
 * ```
 *
 * 
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  T extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof T ? T['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<T['log']> : never : never,
  GlobalReject extends Prisma.RejectOnNotFound | Prisma.RejectPerOperation | false | undefined = 'rejectOnNotFound' extends keyof T
    ? T['rejectOnNotFound']
    : false
      > {
    /**
   * ##  Prisma Client ʲˢ
   * 
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Tokens
   * const tokens = await prisma.token.findMany()
   * ```
   *
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<T, Prisma.PrismaClientOptions>);
  $on<V extends (U | 'beforeExit')>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : V extends 'beforeExit' ? () => Promise<void> : Prisma.LogEvent) => void): void;

  /**
   * Connect with the database
   */
  $connect(): Promise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): Promise<void>;

  /**
   * Add a middleware
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): Promise<UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<this, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use">) => Promise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): Promise<R>

      /**
   * `prisma.token`: Exposes CRUD operations for the **Token** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Tokens
    * const tokens = await prisma.token.findMany()
    * ```
    */
  get token(): Prisma.TokenDelegate<GlobalReject>;

  /**
   * `prisma.pool`: Exposes CRUD operations for the **Pool** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Pools
    * const pools = await prisma.pool.findMany()
    * ```
    */
  get pool(): Prisma.PoolDelegate<GlobalReject>;

  /**
   * `prisma.daySnapshot`: Exposes CRUD operations for the **daySnapshot** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more DaySnapshots
    * const daySnapshots = await prisma.daySnapshot.findMany()
    * ```
    */
  get daySnapshot(): Prisma.daySnapshotDelegate<GlobalReject>;

  /**
   * `prisma.hourSnapshot`: Exposes CRUD operations for the **hourSnapshot** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more HourSnapshots
    * const hourSnapshots = await prisma.hourSnapshot.findMany()
    * ```
    */
  get hourSnapshot(): Prisma.hourSnapshotDelegate<GlobalReject>;

  /**
   * `prisma.dozerPool`: Exposes CRUD operations for the **DozerPool** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more DozerPools
    * const dozerPools = await prisma.dozerPool.findMany()
    * ```
    */
  get dozerPool(): Prisma.DozerPoolDelegate<GlobalReject>;

  /**
   * `prisma.incentive`: Exposes CRUD operations for the **Incentive** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Incentives
    * const incentives = await prisma.incentive.findMany()
    * ```
    */
  get incentive(): Prisma.IncentiveDelegate<GlobalReject>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = runtime.Types.Public.PrismaPromise<T>

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError
  export import NotFoundError = runtime.NotFoundError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql

  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics 
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket


  /**
   * Prisma Client JS version: 4.12.0
   * Query Engine version: 659ef412370fa3b41cd7bf6e94587c1dfb7f67e7
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion 

  /**
   * Utility Types
   */

  /**
   * From https://github.com/sindresorhus/type-fest/
   * Matches a JSON object.
   * This type can be useful to enforce some input to be JSON-compatible or as a super-type to be extended from. 
   */
  export type JsonObject = {[Key in string]?: JsonValue}

  /**
   * From https://github.com/sindresorhus/type-fest/
   * Matches a JSON array.
   */
  export interface JsonArray extends Array<JsonValue> {}

  /**
   * From https://github.com/sindresorhus/type-fest/
   * Matches any valid JSON value.
   */
  export type JsonValue = string | number | boolean | JsonObject | JsonArray | null

  /**
   * Matches a JSON object.
   * Unlike `JsonObject`, this type allows undefined and read-only properties.
   */
  export type InputJsonObject = {readonly [Key in string]?: InputJsonValue | null}

  /**
   * Matches a JSON array.
   * Unlike `JsonArray`, readonly arrays are assignable to this type.
   */
  export interface InputJsonArray extends ReadonlyArray<InputJsonValue | null> {}

  /**
   * Matches any valid value that can be used as an input for operations like
   * create and update as the value of a JSON field. Unlike `JsonValue`, this
   * type allows read-only arrays and read-only object properties and disallows
   * `null` at the top level.
   *
   * `null` cannot be used as the value of a JSON field because its meaning
   * would be ambiguous. Use `Prisma.JsonNull` to store the JSON null value or
   * `Prisma.DbNull` to clear the JSON value and set the field to the database
   * NULL value instead.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-by-null-values
   */
  export type InputJsonValue = string | number | boolean | InputJsonObject | InputJsonArray

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }
  type HasSelect = {
    select: any
  }
  type HasInclude = {
    include: any
  }
  type CheckSelect<T, S, U> = T extends SelectAndInclude
    ? 'Please either choose `select` or `include`'
    : T extends HasSelect
    ? U
    : T extends HasInclude
    ? U
    : S

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => Promise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? K : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;

  export function validator<V>(): <S>(select: runtime.Types.Utils.LegacyExact<S, V>) => S;

  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but with an array
   */
  type PickArray<T, K extends Array<keyof T>> = Prisma__Pick<T, TupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Token: 'Token',
    Pool: 'Pool',
    daySnapshot: 'daySnapshot',
    hourSnapshot: 'hourSnapshot',
    DozerPool: 'DozerPool',
    Incentive: 'Incentive'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  export type DefaultPrismaClient = PrismaClient
  export type RejectOnNotFound = boolean | ((error: Error) => Error)
  export type RejectPerModel = { [P in ModelName]?: RejectOnNotFound }
  export type RejectPerOperation =  { [P in "findUnique" | "findFirst"]?: RejectPerModel | RejectOnNotFound } 
  type IsReject<T> = T extends true ? True : T extends (err: Error) => Error ? True : False
  export type HasReject<
    GlobalRejectSettings extends Prisma.PrismaClientOptions['rejectOnNotFound'],
    LocalRejectSettings,
    Action extends PrismaAction,
    Model extends ModelName
  > = LocalRejectSettings extends RejectOnNotFound
    ? IsReject<LocalRejectSettings>
    : GlobalRejectSettings extends RejectPerOperation
    ? Action extends keyof GlobalRejectSettings
      ? GlobalRejectSettings[Action] extends RejectOnNotFound
        ? IsReject<GlobalRejectSettings[Action]>
        : GlobalRejectSettings[Action] extends RejectPerModel
        ? Model extends keyof GlobalRejectSettings[Action]
          ? IsReject<GlobalRejectSettings[Action][Model]>
          : False
        : False
      : False
    : IsReject<GlobalRejectSettings>
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'

  export interface PrismaClientOptions {
    /**
     * Configure findUnique/findFirst to throw an error if the query returns null. 
     * @deprecated since 4.0.0. Use `findUniqueOrThrow`/`findFirstOrThrow` methods instead.
     * @example
     * ```
     * // Reject on both findUnique/findFirst
     * rejectOnNotFound: true
     * // Reject only on findFirst with a custom error
     * rejectOnNotFound: { findFirst: (err) => new Error("Custom Error")}
     * // Reject on user.findUnique with a custom error
     * rejectOnNotFound: { findUnique: {User: (err) => new Error("User not found")}}
     * ```
     */
    rejectOnNotFound?: RejectOnNotFound | RejectPerOperation
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources

    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat

    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: Array<LogLevel | LogDefinition>
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findMany'
    | 'findFirst'
    | 'create'
    | 'createMany'
    | 'update'
    | 'updateMany'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => Promise<T>,
  ) => Promise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type TokenCountOutputType
   */


  export type TokenCountOutputType = {
    pools0: number
    pools1: number
    dozerPools0: number
    dozerPools1: number
    incentives: number
  }

  export type TokenCountOutputTypeSelect = {
    pools0?: boolean
    pools1?: boolean
    dozerPools0?: boolean
    dozerPools1?: boolean
    incentives?: boolean
  }

  export type TokenCountOutputTypeGetPayload<S extends boolean | null | undefined | TokenCountOutputTypeArgs> =
    S extends { select: any, include: any } ? 'Please either choose `select` or `include`' :
    S extends true ? TokenCountOutputType :
    S extends undefined ? never :
    S extends { include: any } & (TokenCountOutputTypeArgs)
    ? TokenCountOutputType 
    : S extends { select: any } & (TokenCountOutputTypeArgs)
      ? {
    [P in TruthyKeys<S['select']>]:
    P extends keyof TokenCountOutputType ? TokenCountOutputType[P] : never
  } 
      : TokenCountOutputType




  // Custom InputTypes

  /**
   * TokenCountOutputType without action
   */
  export type TokenCountOutputTypeArgs = {
    /**
     * Select specific fields to fetch from the TokenCountOutputType
     */
    select?: TokenCountOutputTypeSelect | null
  }



  /**
   * Count Type PoolCountOutputType
   */


  export type PoolCountOutputType = {
    daySnapshots: number
    hourSnapshots: number
  }

  export type PoolCountOutputTypeSelect = {
    daySnapshots?: boolean
    hourSnapshots?: boolean
  }

  export type PoolCountOutputTypeGetPayload<S extends boolean | null | undefined | PoolCountOutputTypeArgs> =
    S extends { select: any, include: any } ? 'Please either choose `select` or `include`' :
    S extends true ? PoolCountOutputType :
    S extends undefined ? never :
    S extends { include: any } & (PoolCountOutputTypeArgs)
    ? PoolCountOutputType 
    : S extends { select: any } & (PoolCountOutputTypeArgs)
      ? {
    [P in TruthyKeys<S['select']>]:
    P extends keyof PoolCountOutputType ? PoolCountOutputType[P] : never
  } 
      : PoolCountOutputType




  // Custom InputTypes

  /**
   * PoolCountOutputType without action
   */
  export type PoolCountOutputTypeArgs = {
    /**
     * Select specific fields to fetch from the PoolCountOutputType
     */
    select?: PoolCountOutputTypeSelect | null
  }



  /**
   * Count Type DozerPoolCountOutputType
   */


  export type DozerPoolCountOutputType = {
    incentives: number
  }

  export type DozerPoolCountOutputTypeSelect = {
    incentives?: boolean
  }

  export type DozerPoolCountOutputTypeGetPayload<S extends boolean | null | undefined | DozerPoolCountOutputTypeArgs> =
    S extends { select: any, include: any } ? 'Please either choose `select` or `include`' :
    S extends true ? DozerPoolCountOutputType :
    S extends undefined ? never :
    S extends { include: any } & (DozerPoolCountOutputTypeArgs)
    ? DozerPoolCountOutputType 
    : S extends { select: any } & (DozerPoolCountOutputTypeArgs)
      ? {
    [P in TruthyKeys<S['select']>]:
    P extends keyof DozerPoolCountOutputType ? DozerPoolCountOutputType[P] : never
  } 
      : DozerPoolCountOutputType




  // Custom InputTypes

  /**
   * DozerPoolCountOutputType without action
   */
  export type DozerPoolCountOutputTypeArgs = {
    /**
     * Select specific fields to fetch from the DozerPoolCountOutputType
     */
    select?: DozerPoolCountOutputTypeSelect | null
  }



  /**
   * Models
   */

  /**
   * Model Token
   */


  export type AggregateToken = {
    _count: TokenCountAggregateOutputType | null
    _avg: TokenAvgAggregateOutputType | null
    _sum: TokenSumAggregateOutputType | null
    _min: TokenMinAggregateOutputType | null
    _max: TokenMaxAggregateOutputType | null
  }

  export type TokenAvgAggregateOutputType = {
    chainId: number | null
    derivedUSD: number | null
    decimals: number | null
  }

  export type TokenSumAggregateOutputType = {
    chainId: number | null
    derivedUSD: number | null
    decimals: number | null
  }

  export type TokenMinAggregateOutputType = {
    id: string | null
    uuid: string | null
    chainId: number | null
    name: string | null
    symbol: string | null
    isFeeOnTransfer: boolean | null
    isCommon: boolean | null
    derivedUSD: number | null
    generatedAt: Date | null
    updatedAt: Date | null
    decimals: number | null
  }

  export type TokenMaxAggregateOutputType = {
    id: string | null
    uuid: string | null
    chainId: number | null
    name: string | null
    symbol: string | null
    isFeeOnTransfer: boolean | null
    isCommon: boolean | null
    derivedUSD: number | null
    generatedAt: Date | null
    updatedAt: Date | null
    decimals: number | null
  }

  export type TokenCountAggregateOutputType = {
    id: number
    uuid: number
    chainId: number
    name: number
    symbol: number
    isFeeOnTransfer: number
    isCommon: number
    derivedUSD: number
    generatedAt: number
    updatedAt: number
    decimals: number
    _all: number
  }


  export type TokenAvgAggregateInputType = {
    chainId?: true
    derivedUSD?: true
    decimals?: true
  }

  export type TokenSumAggregateInputType = {
    chainId?: true
    derivedUSD?: true
    decimals?: true
  }

  export type TokenMinAggregateInputType = {
    id?: true
    uuid?: true
    chainId?: true
    name?: true
    symbol?: true
    isFeeOnTransfer?: true
    isCommon?: true
    derivedUSD?: true
    generatedAt?: true
    updatedAt?: true
    decimals?: true
  }

  export type TokenMaxAggregateInputType = {
    id?: true
    uuid?: true
    chainId?: true
    name?: true
    symbol?: true
    isFeeOnTransfer?: true
    isCommon?: true
    derivedUSD?: true
    generatedAt?: true
    updatedAt?: true
    decimals?: true
  }

  export type TokenCountAggregateInputType = {
    id?: true
    uuid?: true
    chainId?: true
    name?: true
    symbol?: true
    isFeeOnTransfer?: true
    isCommon?: true
    derivedUSD?: true
    generatedAt?: true
    updatedAt?: true
    decimals?: true
    _all?: true
  }

  export type TokenAggregateArgs = {
    /**
     * Filter which Token to aggregate.
     */
    where?: TokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tokens to fetch.
     */
    orderBy?: Enumerable<TokenOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tokens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Tokens
    **/
    _count?: true | TokenCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TokenAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TokenSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TokenMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TokenMaxAggregateInputType
  }

  export type GetTokenAggregateType<T extends TokenAggregateArgs> = {
        [P in keyof T & keyof AggregateToken]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateToken[P]>
      : GetScalarType<T[P], AggregateToken[P]>
  }




  export type TokenGroupByArgs = {
    where?: TokenWhereInput
    orderBy?: Enumerable<TokenOrderByWithAggregationInput>
    by: TokenScalarFieldEnum[]
    having?: TokenScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TokenCountAggregateInputType | true
    _avg?: TokenAvgAggregateInputType
    _sum?: TokenSumAggregateInputType
    _min?: TokenMinAggregateInputType
    _max?: TokenMaxAggregateInputType
  }


  export type TokenGroupByOutputType = {
    id: string
    uuid: string
    chainId: number
    name: string
    symbol: string
    isFeeOnTransfer: boolean
    isCommon: boolean
    derivedUSD: number | null
    generatedAt: Date
    updatedAt: Date
    decimals: number
    _count: TokenCountAggregateOutputType | null
    _avg: TokenAvgAggregateOutputType | null
    _sum: TokenSumAggregateOutputType | null
    _min: TokenMinAggregateOutputType | null
    _max: TokenMaxAggregateOutputType | null
  }

  type GetTokenGroupByPayload<T extends TokenGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickArray<TokenGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TokenGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TokenGroupByOutputType[P]>
            : GetScalarType<T[P], TokenGroupByOutputType[P]>
        }
      >
    >


  export type TokenSelect = {
    id?: boolean
    uuid?: boolean
    chainId?: boolean
    name?: boolean
    symbol?: boolean
    isFeeOnTransfer?: boolean
    isCommon?: boolean
    derivedUSD?: boolean
    generatedAt?: boolean
    updatedAt?: boolean
    decimals?: boolean
    pools0?: boolean | Token$pools0Args
    pools1?: boolean | Token$pools1Args
    dozerPools0?: boolean | Token$dozerPools0Args
    dozerPools1?: boolean | Token$dozerPools1Args
    incentives?: boolean | Token$incentivesArgs
    _count?: boolean | TokenCountOutputTypeArgs
  }


  export type TokenInclude = {
    pools0?: boolean | Token$pools0Args
    pools1?: boolean | Token$pools1Args
    dozerPools0?: boolean | Token$dozerPools0Args
    dozerPools1?: boolean | Token$dozerPools1Args
    incentives?: boolean | Token$incentivesArgs
    _count?: boolean | TokenCountOutputTypeArgs
  }

  export type TokenGetPayload<S extends boolean | null | undefined | TokenArgs> =
    S extends { select: any, include: any } ? 'Please either choose `select` or `include`' :
    S extends true ? Token :
    S extends undefined ? never :
    S extends { include: any } & (TokenArgs | TokenFindManyArgs)
    ? Token  & {
    [P in TruthyKeys<S['include']>]:
        P extends 'pools0' ? Array < PoolGetPayload<S['include'][P]>>  :
        P extends 'pools1' ? Array < PoolGetPayload<S['include'][P]>>  :
        P extends 'dozerPools0' ? Array < DozerPoolGetPayload<S['include'][P]>>  :
        P extends 'dozerPools1' ? Array < DozerPoolGetPayload<S['include'][P]>>  :
        P extends 'incentives' ? Array < IncentiveGetPayload<S['include'][P]>>  :
        P extends '_count' ? TokenCountOutputTypeGetPayload<S['include'][P]> :  never
  } 
    : S extends { select: any } & (TokenArgs | TokenFindManyArgs)
      ? {
    [P in TruthyKeys<S['select']>]:
        P extends 'pools0' ? Array < PoolGetPayload<S['select'][P]>>  :
        P extends 'pools1' ? Array < PoolGetPayload<S['select'][P]>>  :
        P extends 'dozerPools0' ? Array < DozerPoolGetPayload<S['select'][P]>>  :
        P extends 'dozerPools1' ? Array < DozerPoolGetPayload<S['select'][P]>>  :
        P extends 'incentives' ? Array < IncentiveGetPayload<S['select'][P]>>  :
        P extends '_count' ? TokenCountOutputTypeGetPayload<S['select'][P]> :  P extends keyof Token ? Token[P] : never
  } 
      : Token


  type TokenCountArgs = 
    Omit<TokenFindManyArgs, 'select' | 'include'> & {
      select?: TokenCountAggregateInputType | true
    }

  export interface TokenDelegate<GlobalRejectSettings extends Prisma.RejectOnNotFound | Prisma.RejectPerOperation | false | undefined> {

    /**
     * Find zero or one Token that matches the filter.
     * @param {TokenFindUniqueArgs} args - Arguments to find a Token
     * @example
     * // Get one Token
     * const token = await prisma.token.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUnique<T extends TokenFindUniqueArgs,  LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args: SelectSubset<T, TokenFindUniqueArgs>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findUnique', 'Token'> extends True ? Prisma__TokenClient<TokenGetPayload<T>> : Prisma__TokenClient<TokenGetPayload<T> | null, null>

    /**
     * Find one Token that matches the filter or throw an error  with `error.code='P2025'` 
     *     if no matches were found.
     * @param {TokenFindUniqueOrThrowArgs} args - Arguments to find a Token
     * @example
     * // Get one Token
     * const token = await prisma.token.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUniqueOrThrow<T extends TokenFindUniqueOrThrowArgs>(
      args?: SelectSubset<T, TokenFindUniqueOrThrowArgs>
    ): Prisma__TokenClient<TokenGetPayload<T>>

    /**
     * Find the first Token that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TokenFindFirstArgs} args - Arguments to find a Token
     * @example
     * // Get one Token
     * const token = await prisma.token.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirst<T extends TokenFindFirstArgs,  LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args?: SelectSubset<T, TokenFindFirstArgs>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findFirst', 'Token'> extends True ? Prisma__TokenClient<TokenGetPayload<T>> : Prisma__TokenClient<TokenGetPayload<T> | null, null>

    /**
     * Find the first Token that matches the filter or
     * throw `NotFoundError` if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TokenFindFirstOrThrowArgs} args - Arguments to find a Token
     * @example
     * // Get one Token
     * const token = await prisma.token.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirstOrThrow<T extends TokenFindFirstOrThrowArgs>(
      args?: SelectSubset<T, TokenFindFirstOrThrowArgs>
    ): Prisma__TokenClient<TokenGetPayload<T>>

    /**
     * Find zero or more Tokens that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TokenFindManyArgs=} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Tokens
     * const tokens = await prisma.token.findMany()
     * 
     * // Get first 10 Tokens
     * const tokens = await prisma.token.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const tokenWithIdOnly = await prisma.token.findMany({ select: { id: true } })
     * 
    **/
    findMany<T extends TokenFindManyArgs>(
      args?: SelectSubset<T, TokenFindManyArgs>
    ): Prisma.PrismaPromise<Array<TokenGetPayload<T>>>

    /**
     * Create a Token.
     * @param {TokenCreateArgs} args - Arguments to create a Token.
     * @example
     * // Create one Token
     * const Token = await prisma.token.create({
     *   data: {
     *     // ... data to create a Token
     *   }
     * })
     * 
    **/
    create<T extends TokenCreateArgs>(
      args: SelectSubset<T, TokenCreateArgs>
    ): Prisma__TokenClient<TokenGetPayload<T>>

    /**
     * Create many Tokens.
     *     @param {TokenCreateManyArgs} args - Arguments to create many Tokens.
     *     @example
     *     // Create many Tokens
     *     const token = await prisma.token.createMany({
     *       data: {
     *         // ... provide data here
     *       }
     *     })
     *     
    **/
    createMany<T extends TokenCreateManyArgs>(
      args?: SelectSubset<T, TokenCreateManyArgs>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Token.
     * @param {TokenDeleteArgs} args - Arguments to delete one Token.
     * @example
     * // Delete one Token
     * const Token = await prisma.token.delete({
     *   where: {
     *     // ... filter to delete one Token
     *   }
     * })
     * 
    **/
    delete<T extends TokenDeleteArgs>(
      args: SelectSubset<T, TokenDeleteArgs>
    ): Prisma__TokenClient<TokenGetPayload<T>>

    /**
     * Update one Token.
     * @param {TokenUpdateArgs} args - Arguments to update one Token.
     * @example
     * // Update one Token
     * const token = await prisma.token.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    update<T extends TokenUpdateArgs>(
      args: SelectSubset<T, TokenUpdateArgs>
    ): Prisma__TokenClient<TokenGetPayload<T>>

    /**
     * Delete zero or more Tokens.
     * @param {TokenDeleteManyArgs} args - Arguments to filter Tokens to delete.
     * @example
     * // Delete a few Tokens
     * const { count } = await prisma.token.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
    **/
    deleteMany<T extends TokenDeleteManyArgs>(
      args?: SelectSubset<T, TokenDeleteManyArgs>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Tokens.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TokenUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Tokens
     * const token = await prisma.token.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    updateMany<T extends TokenUpdateManyArgs>(
      args: SelectSubset<T, TokenUpdateManyArgs>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Token.
     * @param {TokenUpsertArgs} args - Arguments to update or create a Token.
     * @example
     * // Update or create a Token
     * const token = await prisma.token.upsert({
     *   create: {
     *     // ... data to create a Token
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Token we want to update
     *   }
     * })
    **/
    upsert<T extends TokenUpsertArgs>(
      args: SelectSubset<T, TokenUpsertArgs>
    ): Prisma__TokenClient<TokenGetPayload<T>>

    /**
     * Count the number of Tokens.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TokenCountArgs} args - Arguments to filter Tokens to count.
     * @example
     * // Count the number of Tokens
     * const count = await prisma.token.count({
     *   where: {
     *     // ... the filter for the Tokens we want to count
     *   }
     * })
    **/
    count<T extends TokenCountArgs>(
      args?: Subset<T, TokenCountArgs>,
    ): Prisma.PrismaPromise<
      T extends _Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TokenCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Token.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TokenAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TokenAggregateArgs>(args: Subset<T, TokenAggregateArgs>): Prisma.PrismaPromise<GetTokenAggregateType<T>>

    /**
     * Group by Token.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TokenGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TokenGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TokenGroupByArgs['orderBy'] }
        : { orderBy?: TokenGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends TupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TokenGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTokenGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>

  }

  /**
   * The delegate class that acts as a "Promise-like" for Token.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export class Prisma__TokenClient<T, Null = never> implements Prisma.PrismaPromise<T> {
    private readonly _dmmf;
    private readonly _queryType;
    private readonly _rootField;
    private readonly _clientMethod;
    private readonly _args;
    private readonly _dataPath;
    private readonly _errorFormat;
    private readonly _measurePerformance?;
    private _isList;
    private _callsite;
    private _requestPromise?;
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    constructor(_dmmf: runtime.DMMFClass, _queryType: 'query' | 'mutation', _rootField: string, _clientMethod: string, _args: any, _dataPath: string[], _errorFormat: ErrorFormat, _measurePerformance?: boolean | undefined, _isList?: boolean);

    pools0<T extends Token$pools0Args= {}>(args?: Subset<T, Token$pools0Args>): Prisma.PrismaPromise<Array<PoolGetPayload<T>>| Null>;

    pools1<T extends Token$pools1Args= {}>(args?: Subset<T, Token$pools1Args>): Prisma.PrismaPromise<Array<PoolGetPayload<T>>| Null>;

    dozerPools0<T extends Token$dozerPools0Args= {}>(args?: Subset<T, Token$dozerPools0Args>): Prisma.PrismaPromise<Array<DozerPoolGetPayload<T>>| Null>;

    dozerPools1<T extends Token$dozerPools1Args= {}>(args?: Subset<T, Token$dozerPools1Args>): Prisma.PrismaPromise<Array<DozerPoolGetPayload<T>>| Null>;

    incentives<T extends Token$incentivesArgs= {}>(args?: Subset<T, Token$incentivesArgs>): Prisma.PrismaPromise<Array<IncentiveGetPayload<T>>| Null>;

    private get _document();
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): Promise<T>;
  }



  // Custom InputTypes

  /**
   * Token base type for findUnique actions
   */
  export type TokenFindUniqueArgsBase = {
    /**
     * Select specific fields to fetch from the Token
     */
    select?: TokenSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: TokenInclude | null
    /**
     * Filter, which Token to fetch.
     */
    where: TokenWhereUniqueInput
  }

  /**
   * Token findUnique
   */
  export interface TokenFindUniqueArgs extends TokenFindUniqueArgsBase {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findUniqueOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * Token findUniqueOrThrow
   */
  export type TokenFindUniqueOrThrowArgs = {
    /**
     * Select specific fields to fetch from the Token
     */
    select?: TokenSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: TokenInclude | null
    /**
     * Filter, which Token to fetch.
     */
    where: TokenWhereUniqueInput
  }


  /**
   * Token base type for findFirst actions
   */
  export type TokenFindFirstArgsBase = {
    /**
     * Select specific fields to fetch from the Token
     */
    select?: TokenSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: TokenInclude | null
    /**
     * Filter, which Token to fetch.
     */
    where?: TokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tokens to fetch.
     */
    orderBy?: Enumerable<TokenOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Tokens.
     */
    cursor?: TokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tokens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Tokens.
     */
    distinct?: Enumerable<TokenScalarFieldEnum>
  }

  /**
   * Token findFirst
   */
  export interface TokenFindFirstArgs extends TokenFindFirstArgsBase {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findFirstOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * Token findFirstOrThrow
   */
  export type TokenFindFirstOrThrowArgs = {
    /**
     * Select specific fields to fetch from the Token
     */
    select?: TokenSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: TokenInclude | null
    /**
     * Filter, which Token to fetch.
     */
    where?: TokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tokens to fetch.
     */
    orderBy?: Enumerable<TokenOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Tokens.
     */
    cursor?: TokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tokens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Tokens.
     */
    distinct?: Enumerable<TokenScalarFieldEnum>
  }


  /**
   * Token findMany
   */
  export type TokenFindManyArgs = {
    /**
     * Select specific fields to fetch from the Token
     */
    select?: TokenSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: TokenInclude | null
    /**
     * Filter, which Tokens to fetch.
     */
    where?: TokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tokens to fetch.
     */
    orderBy?: Enumerable<TokenOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Tokens.
     */
    cursor?: TokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tokens.
     */
    skip?: number
    distinct?: Enumerable<TokenScalarFieldEnum>
  }


  /**
   * Token create
   */
  export type TokenCreateArgs = {
    /**
     * Select specific fields to fetch from the Token
     */
    select?: TokenSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: TokenInclude | null
    /**
     * The data needed to create a Token.
     */
    data: XOR<TokenCreateInput, TokenUncheckedCreateInput>
  }


  /**
   * Token createMany
   */
  export type TokenCreateManyArgs = {
    /**
     * The data used to create many Tokens.
     */
    data: Enumerable<TokenCreateManyInput>
    skipDuplicates?: boolean
  }


  /**
   * Token update
   */
  export type TokenUpdateArgs = {
    /**
     * Select specific fields to fetch from the Token
     */
    select?: TokenSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: TokenInclude | null
    /**
     * The data needed to update a Token.
     */
    data: XOR<TokenUpdateInput, TokenUncheckedUpdateInput>
    /**
     * Choose, which Token to update.
     */
    where: TokenWhereUniqueInput
  }


  /**
   * Token updateMany
   */
  export type TokenUpdateManyArgs = {
    /**
     * The data used to update Tokens.
     */
    data: XOR<TokenUpdateManyMutationInput, TokenUncheckedUpdateManyInput>
    /**
     * Filter which Tokens to update
     */
    where?: TokenWhereInput
  }


  /**
   * Token upsert
   */
  export type TokenUpsertArgs = {
    /**
     * Select specific fields to fetch from the Token
     */
    select?: TokenSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: TokenInclude | null
    /**
     * The filter to search for the Token to update in case it exists.
     */
    where: TokenWhereUniqueInput
    /**
     * In case the Token found by the `where` argument doesn't exist, create a new Token with this data.
     */
    create: XOR<TokenCreateInput, TokenUncheckedCreateInput>
    /**
     * In case the Token was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TokenUpdateInput, TokenUncheckedUpdateInput>
  }


  /**
   * Token delete
   */
  export type TokenDeleteArgs = {
    /**
     * Select specific fields to fetch from the Token
     */
    select?: TokenSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: TokenInclude | null
    /**
     * Filter which Token to delete.
     */
    where: TokenWhereUniqueInput
  }


  /**
   * Token deleteMany
   */
  export type TokenDeleteManyArgs = {
    /**
     * Filter which Tokens to delete
     */
    where?: TokenWhereInput
  }


  /**
   * Token.pools0
   */
  export type Token$pools0Args = {
    /**
     * Select specific fields to fetch from the Pool
     */
    select?: PoolSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PoolInclude | null
    where?: PoolWhereInput
    orderBy?: Enumerable<PoolOrderByWithRelationInput>
    cursor?: PoolWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Enumerable<PoolScalarFieldEnum>
  }


  /**
   * Token.pools1
   */
  export type Token$pools1Args = {
    /**
     * Select specific fields to fetch from the Pool
     */
    select?: PoolSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PoolInclude | null
    where?: PoolWhereInput
    orderBy?: Enumerable<PoolOrderByWithRelationInput>
    cursor?: PoolWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Enumerable<PoolScalarFieldEnum>
  }


  /**
   * Token.dozerPools0
   */
  export type Token$dozerPools0Args = {
    /**
     * Select specific fields to fetch from the DozerPool
     */
    select?: DozerPoolSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: DozerPoolInclude | null
    where?: DozerPoolWhereInput
    orderBy?: Enumerable<DozerPoolOrderByWithRelationInput>
    cursor?: DozerPoolWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Enumerable<DozerPoolScalarFieldEnum>
  }


  /**
   * Token.dozerPools1
   */
  export type Token$dozerPools1Args = {
    /**
     * Select specific fields to fetch from the DozerPool
     */
    select?: DozerPoolSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: DozerPoolInclude | null
    where?: DozerPoolWhereInput
    orderBy?: Enumerable<DozerPoolOrderByWithRelationInput>
    cursor?: DozerPoolWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Enumerable<DozerPoolScalarFieldEnum>
  }


  /**
   * Token.incentives
   */
  export type Token$incentivesArgs = {
    /**
     * Select specific fields to fetch from the Incentive
     */
    select?: IncentiveSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: IncentiveInclude | null
    where?: IncentiveWhereInput
    orderBy?: Enumerable<IncentiveOrderByWithRelationInput>
    cursor?: IncentiveWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Enumerable<IncentiveScalarFieldEnum>
  }


  /**
   * Token without action
   */
  export type TokenArgs = {
    /**
     * Select specific fields to fetch from the Token
     */
    select?: TokenSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: TokenInclude | null
  }



  /**
   * Model Pool
   */


  export type AggregatePool = {
    _count: PoolCountAggregateOutputType | null
    _avg: PoolAvgAggregateOutputType | null
    _sum: PoolSumAggregateOutputType | null
    _min: PoolMinAggregateOutputType | null
    _max: PoolMaxAggregateOutputType | null
  }

  export type PoolAvgAggregateOutputType = {
    apr: number | null
    chainId: number | null
    swapFee: number | null
    feeUSD: number | null
    liquidityUSD: number | null
    volumeUSD: number | null
    liquidity: number | null
    volume1d: number | null
    fees1d: number | null
  }

  export type PoolSumAggregateOutputType = {
    apr: number | null
    chainId: number | null
    swapFee: number | null
    feeUSD: number | null
    liquidityUSD: number | null
    volumeUSD: number | null
    liquidity: number | null
    volume1d: number | null
    fees1d: number | null
  }

  export type PoolMinAggregateOutputType = {
    id: string | null
    name: string | null
    apr: number | null
    chainId: number | null
    version: string | null
    token0Id: string | null
    token1Id: string | null
    swapFee: number | null
    feeUSD: number | null
    reserve0: string | null
    reserve1: string | null
    liquidityUSD: number | null
    volumeUSD: number | null
    liquidity: number | null
    volume1d: number | null
    fees1d: number | null
    generatedAt: Date | null
    updatedAt: Date | null
  }

  export type PoolMaxAggregateOutputType = {
    id: string | null
    name: string | null
    apr: number | null
    chainId: number | null
    version: string | null
    token0Id: string | null
    token1Id: string | null
    swapFee: number | null
    feeUSD: number | null
    reserve0: string | null
    reserve1: string | null
    liquidityUSD: number | null
    volumeUSD: number | null
    liquidity: number | null
    volume1d: number | null
    fees1d: number | null
    generatedAt: Date | null
    updatedAt: Date | null
  }

  export type PoolCountAggregateOutputType = {
    id: number
    name: number
    apr: number
    chainId: number
    version: number
    token0Id: number
    token1Id: number
    swapFee: number
    feeUSD: number
    reserve0: number
    reserve1: number
    liquidityUSD: number
    volumeUSD: number
    liquidity: number
    volume1d: number
    fees1d: number
    generatedAt: number
    updatedAt: number
    _all: number
  }


  export type PoolAvgAggregateInputType = {
    apr?: true
    chainId?: true
    swapFee?: true
    feeUSD?: true
    liquidityUSD?: true
    volumeUSD?: true
    liquidity?: true
    volume1d?: true
    fees1d?: true
  }

  export type PoolSumAggregateInputType = {
    apr?: true
    chainId?: true
    swapFee?: true
    feeUSD?: true
    liquidityUSD?: true
    volumeUSD?: true
    liquidity?: true
    volume1d?: true
    fees1d?: true
  }

  export type PoolMinAggregateInputType = {
    id?: true
    name?: true
    apr?: true
    chainId?: true
    version?: true
    token0Id?: true
    token1Id?: true
    swapFee?: true
    feeUSD?: true
    reserve0?: true
    reserve1?: true
    liquidityUSD?: true
    volumeUSD?: true
    liquidity?: true
    volume1d?: true
    fees1d?: true
    generatedAt?: true
    updatedAt?: true
  }

  export type PoolMaxAggregateInputType = {
    id?: true
    name?: true
    apr?: true
    chainId?: true
    version?: true
    token0Id?: true
    token1Id?: true
    swapFee?: true
    feeUSD?: true
    reserve0?: true
    reserve1?: true
    liquidityUSD?: true
    volumeUSD?: true
    liquidity?: true
    volume1d?: true
    fees1d?: true
    generatedAt?: true
    updatedAt?: true
  }

  export type PoolCountAggregateInputType = {
    id?: true
    name?: true
    apr?: true
    chainId?: true
    version?: true
    token0Id?: true
    token1Id?: true
    swapFee?: true
    feeUSD?: true
    reserve0?: true
    reserve1?: true
    liquidityUSD?: true
    volumeUSD?: true
    liquidity?: true
    volume1d?: true
    fees1d?: true
    generatedAt?: true
    updatedAt?: true
    _all?: true
  }

  export type PoolAggregateArgs = {
    /**
     * Filter which Pool to aggregate.
     */
    where?: PoolWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Pools to fetch.
     */
    orderBy?: Enumerable<PoolOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PoolWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Pools from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Pools.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Pools
    **/
    _count?: true | PoolCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PoolAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PoolSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PoolMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PoolMaxAggregateInputType
  }

  export type GetPoolAggregateType<T extends PoolAggregateArgs> = {
        [P in keyof T & keyof AggregatePool]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePool[P]>
      : GetScalarType<T[P], AggregatePool[P]>
  }




  export type PoolGroupByArgs = {
    where?: PoolWhereInput
    orderBy?: Enumerable<PoolOrderByWithAggregationInput>
    by: PoolScalarFieldEnum[]
    having?: PoolScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PoolCountAggregateInputType | true
    _avg?: PoolAvgAggregateInputType
    _sum?: PoolSumAggregateInputType
    _min?: PoolMinAggregateInputType
    _max?: PoolMaxAggregateInputType
  }


  export type PoolGroupByOutputType = {
    id: string
    name: string
    apr: number
    chainId: number
    version: string
    token0Id: string
    token1Id: string
    swapFee: number
    feeUSD: number
    reserve0: string
    reserve1: string
    liquidityUSD: number
    volumeUSD: number
    liquidity: number
    volume1d: number
    fees1d: number
    generatedAt: Date
    updatedAt: Date
    _count: PoolCountAggregateOutputType | null
    _avg: PoolAvgAggregateOutputType | null
    _sum: PoolSumAggregateOutputType | null
    _min: PoolMinAggregateOutputType | null
    _max: PoolMaxAggregateOutputType | null
  }

  type GetPoolGroupByPayload<T extends PoolGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickArray<PoolGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PoolGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PoolGroupByOutputType[P]>
            : GetScalarType<T[P], PoolGroupByOutputType[P]>
        }
      >
    >


  export type PoolSelect = {
    id?: boolean
    name?: boolean
    apr?: boolean
    chainId?: boolean
    version?: boolean
    token0Id?: boolean
    token1Id?: boolean
    swapFee?: boolean
    feeUSD?: boolean
    reserve0?: boolean
    reserve1?: boolean
    liquidityUSD?: boolean
    volumeUSD?: boolean
    liquidity?: boolean
    volume1d?: boolean
    fees1d?: boolean
    generatedAt?: boolean
    updatedAt?: boolean
    token0?: boolean | TokenArgs
    token1?: boolean | TokenArgs
    daySnapshots?: boolean | Pool$daySnapshotsArgs
    hourSnapshots?: boolean | Pool$hourSnapshotsArgs
    _count?: boolean | PoolCountOutputTypeArgs
  }


  export type PoolInclude = {
    token0?: boolean | TokenArgs
    token1?: boolean | TokenArgs
    daySnapshots?: boolean | Pool$daySnapshotsArgs
    hourSnapshots?: boolean | Pool$hourSnapshotsArgs
    _count?: boolean | PoolCountOutputTypeArgs
  }

  export type PoolGetPayload<S extends boolean | null | undefined | PoolArgs> =
    S extends { select: any, include: any } ? 'Please either choose `select` or `include`' :
    S extends true ? Pool :
    S extends undefined ? never :
    S extends { include: any } & (PoolArgs | PoolFindManyArgs)
    ? Pool  & {
    [P in TruthyKeys<S['include']>]:
        P extends 'token0' ? TokenGetPayload<S['include'][P]> :
        P extends 'token1' ? TokenGetPayload<S['include'][P]> :
        P extends 'daySnapshots' ? Array < daySnapshotGetPayload<S['include'][P]>>  :
        P extends 'hourSnapshots' ? Array < hourSnapshotGetPayload<S['include'][P]>>  :
        P extends '_count' ? PoolCountOutputTypeGetPayload<S['include'][P]> :  never
  } 
    : S extends { select: any } & (PoolArgs | PoolFindManyArgs)
      ? {
    [P in TruthyKeys<S['select']>]:
        P extends 'token0' ? TokenGetPayload<S['select'][P]> :
        P extends 'token1' ? TokenGetPayload<S['select'][P]> :
        P extends 'daySnapshots' ? Array < daySnapshotGetPayload<S['select'][P]>>  :
        P extends 'hourSnapshots' ? Array < hourSnapshotGetPayload<S['select'][P]>>  :
        P extends '_count' ? PoolCountOutputTypeGetPayload<S['select'][P]> :  P extends keyof Pool ? Pool[P] : never
  } 
      : Pool


  type PoolCountArgs = 
    Omit<PoolFindManyArgs, 'select' | 'include'> & {
      select?: PoolCountAggregateInputType | true
    }

  export interface PoolDelegate<GlobalRejectSettings extends Prisma.RejectOnNotFound | Prisma.RejectPerOperation | false | undefined> {

    /**
     * Find zero or one Pool that matches the filter.
     * @param {PoolFindUniqueArgs} args - Arguments to find a Pool
     * @example
     * // Get one Pool
     * const pool = await prisma.pool.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUnique<T extends PoolFindUniqueArgs,  LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args: SelectSubset<T, PoolFindUniqueArgs>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findUnique', 'Pool'> extends True ? Prisma__PoolClient<PoolGetPayload<T>> : Prisma__PoolClient<PoolGetPayload<T> | null, null>

    /**
     * Find one Pool that matches the filter or throw an error  with `error.code='P2025'` 
     *     if no matches were found.
     * @param {PoolFindUniqueOrThrowArgs} args - Arguments to find a Pool
     * @example
     * // Get one Pool
     * const pool = await prisma.pool.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUniqueOrThrow<T extends PoolFindUniqueOrThrowArgs>(
      args?: SelectSubset<T, PoolFindUniqueOrThrowArgs>
    ): Prisma__PoolClient<PoolGetPayload<T>>

    /**
     * Find the first Pool that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PoolFindFirstArgs} args - Arguments to find a Pool
     * @example
     * // Get one Pool
     * const pool = await prisma.pool.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirst<T extends PoolFindFirstArgs,  LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args?: SelectSubset<T, PoolFindFirstArgs>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findFirst', 'Pool'> extends True ? Prisma__PoolClient<PoolGetPayload<T>> : Prisma__PoolClient<PoolGetPayload<T> | null, null>

    /**
     * Find the first Pool that matches the filter or
     * throw `NotFoundError` if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PoolFindFirstOrThrowArgs} args - Arguments to find a Pool
     * @example
     * // Get one Pool
     * const pool = await prisma.pool.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirstOrThrow<T extends PoolFindFirstOrThrowArgs>(
      args?: SelectSubset<T, PoolFindFirstOrThrowArgs>
    ): Prisma__PoolClient<PoolGetPayload<T>>

    /**
     * Find zero or more Pools that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PoolFindManyArgs=} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Pools
     * const pools = await prisma.pool.findMany()
     * 
     * // Get first 10 Pools
     * const pools = await prisma.pool.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const poolWithIdOnly = await prisma.pool.findMany({ select: { id: true } })
     * 
    **/
    findMany<T extends PoolFindManyArgs>(
      args?: SelectSubset<T, PoolFindManyArgs>
    ): Prisma.PrismaPromise<Array<PoolGetPayload<T>>>

    /**
     * Create a Pool.
     * @param {PoolCreateArgs} args - Arguments to create a Pool.
     * @example
     * // Create one Pool
     * const Pool = await prisma.pool.create({
     *   data: {
     *     // ... data to create a Pool
     *   }
     * })
     * 
    **/
    create<T extends PoolCreateArgs>(
      args: SelectSubset<T, PoolCreateArgs>
    ): Prisma__PoolClient<PoolGetPayload<T>>

    /**
     * Create many Pools.
     *     @param {PoolCreateManyArgs} args - Arguments to create many Pools.
     *     @example
     *     // Create many Pools
     *     const pool = await prisma.pool.createMany({
     *       data: {
     *         // ... provide data here
     *       }
     *     })
     *     
    **/
    createMany<T extends PoolCreateManyArgs>(
      args?: SelectSubset<T, PoolCreateManyArgs>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Pool.
     * @param {PoolDeleteArgs} args - Arguments to delete one Pool.
     * @example
     * // Delete one Pool
     * const Pool = await prisma.pool.delete({
     *   where: {
     *     // ... filter to delete one Pool
     *   }
     * })
     * 
    **/
    delete<T extends PoolDeleteArgs>(
      args: SelectSubset<T, PoolDeleteArgs>
    ): Prisma__PoolClient<PoolGetPayload<T>>

    /**
     * Update one Pool.
     * @param {PoolUpdateArgs} args - Arguments to update one Pool.
     * @example
     * // Update one Pool
     * const pool = await prisma.pool.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    update<T extends PoolUpdateArgs>(
      args: SelectSubset<T, PoolUpdateArgs>
    ): Prisma__PoolClient<PoolGetPayload<T>>

    /**
     * Delete zero or more Pools.
     * @param {PoolDeleteManyArgs} args - Arguments to filter Pools to delete.
     * @example
     * // Delete a few Pools
     * const { count } = await prisma.pool.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
    **/
    deleteMany<T extends PoolDeleteManyArgs>(
      args?: SelectSubset<T, PoolDeleteManyArgs>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Pools.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PoolUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Pools
     * const pool = await prisma.pool.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    updateMany<T extends PoolUpdateManyArgs>(
      args: SelectSubset<T, PoolUpdateManyArgs>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Pool.
     * @param {PoolUpsertArgs} args - Arguments to update or create a Pool.
     * @example
     * // Update or create a Pool
     * const pool = await prisma.pool.upsert({
     *   create: {
     *     // ... data to create a Pool
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Pool we want to update
     *   }
     * })
    **/
    upsert<T extends PoolUpsertArgs>(
      args: SelectSubset<T, PoolUpsertArgs>
    ): Prisma__PoolClient<PoolGetPayload<T>>

    /**
     * Count the number of Pools.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PoolCountArgs} args - Arguments to filter Pools to count.
     * @example
     * // Count the number of Pools
     * const count = await prisma.pool.count({
     *   where: {
     *     // ... the filter for the Pools we want to count
     *   }
     * })
    **/
    count<T extends PoolCountArgs>(
      args?: Subset<T, PoolCountArgs>,
    ): Prisma.PrismaPromise<
      T extends _Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PoolCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Pool.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PoolAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PoolAggregateArgs>(args: Subset<T, PoolAggregateArgs>): Prisma.PrismaPromise<GetPoolAggregateType<T>>

    /**
     * Group by Pool.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PoolGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PoolGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PoolGroupByArgs['orderBy'] }
        : { orderBy?: PoolGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends TupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PoolGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPoolGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>

  }

  /**
   * The delegate class that acts as a "Promise-like" for Pool.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export class Prisma__PoolClient<T, Null = never> implements Prisma.PrismaPromise<T> {
    private readonly _dmmf;
    private readonly _queryType;
    private readonly _rootField;
    private readonly _clientMethod;
    private readonly _args;
    private readonly _dataPath;
    private readonly _errorFormat;
    private readonly _measurePerformance?;
    private _isList;
    private _callsite;
    private _requestPromise?;
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    constructor(_dmmf: runtime.DMMFClass, _queryType: 'query' | 'mutation', _rootField: string, _clientMethod: string, _args: any, _dataPath: string[], _errorFormat: ErrorFormat, _measurePerformance?: boolean | undefined, _isList?: boolean);

    token0<T extends TokenArgs= {}>(args?: Subset<T, TokenArgs>): Prisma__TokenClient<TokenGetPayload<T> | Null>;

    token1<T extends TokenArgs= {}>(args?: Subset<T, TokenArgs>): Prisma__TokenClient<TokenGetPayload<T> | Null>;

    daySnapshots<T extends Pool$daySnapshotsArgs= {}>(args?: Subset<T, Pool$daySnapshotsArgs>): Prisma.PrismaPromise<Array<daySnapshotGetPayload<T>>| Null>;

    hourSnapshots<T extends Pool$hourSnapshotsArgs= {}>(args?: Subset<T, Pool$hourSnapshotsArgs>): Prisma.PrismaPromise<Array<hourSnapshotGetPayload<T>>| Null>;

    private get _document();
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): Promise<T>;
  }



  // Custom InputTypes

  /**
   * Pool base type for findUnique actions
   */
  export type PoolFindUniqueArgsBase = {
    /**
     * Select specific fields to fetch from the Pool
     */
    select?: PoolSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PoolInclude | null
    /**
     * Filter, which Pool to fetch.
     */
    where: PoolWhereUniqueInput
  }

  /**
   * Pool findUnique
   */
  export interface PoolFindUniqueArgs extends PoolFindUniqueArgsBase {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findUniqueOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * Pool findUniqueOrThrow
   */
  export type PoolFindUniqueOrThrowArgs = {
    /**
     * Select specific fields to fetch from the Pool
     */
    select?: PoolSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PoolInclude | null
    /**
     * Filter, which Pool to fetch.
     */
    where: PoolWhereUniqueInput
  }


  /**
   * Pool base type for findFirst actions
   */
  export type PoolFindFirstArgsBase = {
    /**
     * Select specific fields to fetch from the Pool
     */
    select?: PoolSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PoolInclude | null
    /**
     * Filter, which Pool to fetch.
     */
    where?: PoolWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Pools to fetch.
     */
    orderBy?: Enumerable<PoolOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Pools.
     */
    cursor?: PoolWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Pools from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Pools.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Pools.
     */
    distinct?: Enumerable<PoolScalarFieldEnum>
  }

  /**
   * Pool findFirst
   */
  export interface PoolFindFirstArgs extends PoolFindFirstArgsBase {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findFirstOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * Pool findFirstOrThrow
   */
  export type PoolFindFirstOrThrowArgs = {
    /**
     * Select specific fields to fetch from the Pool
     */
    select?: PoolSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PoolInclude | null
    /**
     * Filter, which Pool to fetch.
     */
    where?: PoolWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Pools to fetch.
     */
    orderBy?: Enumerable<PoolOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Pools.
     */
    cursor?: PoolWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Pools from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Pools.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Pools.
     */
    distinct?: Enumerable<PoolScalarFieldEnum>
  }


  /**
   * Pool findMany
   */
  export type PoolFindManyArgs = {
    /**
     * Select specific fields to fetch from the Pool
     */
    select?: PoolSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PoolInclude | null
    /**
     * Filter, which Pools to fetch.
     */
    where?: PoolWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Pools to fetch.
     */
    orderBy?: Enumerable<PoolOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Pools.
     */
    cursor?: PoolWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Pools from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Pools.
     */
    skip?: number
    distinct?: Enumerable<PoolScalarFieldEnum>
  }


  /**
   * Pool create
   */
  export type PoolCreateArgs = {
    /**
     * Select specific fields to fetch from the Pool
     */
    select?: PoolSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PoolInclude | null
    /**
     * The data needed to create a Pool.
     */
    data: XOR<PoolCreateInput, PoolUncheckedCreateInput>
  }


  /**
   * Pool createMany
   */
  export type PoolCreateManyArgs = {
    /**
     * The data used to create many Pools.
     */
    data: Enumerable<PoolCreateManyInput>
    skipDuplicates?: boolean
  }


  /**
   * Pool update
   */
  export type PoolUpdateArgs = {
    /**
     * Select specific fields to fetch from the Pool
     */
    select?: PoolSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PoolInclude | null
    /**
     * The data needed to update a Pool.
     */
    data: XOR<PoolUpdateInput, PoolUncheckedUpdateInput>
    /**
     * Choose, which Pool to update.
     */
    where: PoolWhereUniqueInput
  }


  /**
   * Pool updateMany
   */
  export type PoolUpdateManyArgs = {
    /**
     * The data used to update Pools.
     */
    data: XOR<PoolUpdateManyMutationInput, PoolUncheckedUpdateManyInput>
    /**
     * Filter which Pools to update
     */
    where?: PoolWhereInput
  }


  /**
   * Pool upsert
   */
  export type PoolUpsertArgs = {
    /**
     * Select specific fields to fetch from the Pool
     */
    select?: PoolSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PoolInclude | null
    /**
     * The filter to search for the Pool to update in case it exists.
     */
    where: PoolWhereUniqueInput
    /**
     * In case the Pool found by the `where` argument doesn't exist, create a new Pool with this data.
     */
    create: XOR<PoolCreateInput, PoolUncheckedCreateInput>
    /**
     * In case the Pool was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PoolUpdateInput, PoolUncheckedUpdateInput>
  }


  /**
   * Pool delete
   */
  export type PoolDeleteArgs = {
    /**
     * Select specific fields to fetch from the Pool
     */
    select?: PoolSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PoolInclude | null
    /**
     * Filter which Pool to delete.
     */
    where: PoolWhereUniqueInput
  }


  /**
   * Pool deleteMany
   */
  export type PoolDeleteManyArgs = {
    /**
     * Filter which Pools to delete
     */
    where?: PoolWhereInput
  }


  /**
   * Pool.daySnapshots
   */
  export type Pool$daySnapshotsArgs = {
    /**
     * Select specific fields to fetch from the daySnapshot
     */
    select?: daySnapshotSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: daySnapshotInclude | null
    where?: daySnapshotWhereInput
    orderBy?: Enumerable<daySnapshotOrderByWithRelationInput>
    cursor?: daySnapshotWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Enumerable<DaySnapshotScalarFieldEnum>
  }


  /**
   * Pool.hourSnapshots
   */
  export type Pool$hourSnapshotsArgs = {
    /**
     * Select specific fields to fetch from the hourSnapshot
     */
    select?: hourSnapshotSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: hourSnapshotInclude | null
    where?: hourSnapshotWhereInput
    orderBy?: Enumerable<hourSnapshotOrderByWithRelationInput>
    cursor?: hourSnapshotWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Enumerable<HourSnapshotScalarFieldEnum>
  }


  /**
   * Pool without action
   */
  export type PoolArgs = {
    /**
     * Select specific fields to fetch from the Pool
     */
    select?: PoolSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PoolInclude | null
  }



  /**
   * Model daySnapshot
   */


  export type AggregateDaySnapshot = {
    _count: DaySnapshotCountAggregateOutputType | null
    _avg: DaySnapshotAvgAggregateOutputType | null
    _sum: DaySnapshotSumAggregateOutputType | null
    _min: DaySnapshotMinAggregateOutputType | null
    _max: DaySnapshotMaxAggregateOutputType | null
  }

  export type DaySnapshotAvgAggregateOutputType = {
    id: number | null
    volumeUSD: number | null
    liquidityUSD: number | null
    apr: number | null
  }

  export type DaySnapshotSumAggregateOutputType = {
    id: number | null
    volumeUSD: number | null
    liquidityUSD: number | null
    apr: number | null
  }

  export type DaySnapshotMinAggregateOutputType = {
    id: number | null
    poolId: string | null
    date: Date | null
    volumeUSD: number | null
    liquidityUSD: number | null
    apr: number | null
  }

  export type DaySnapshotMaxAggregateOutputType = {
    id: number | null
    poolId: string | null
    date: Date | null
    volumeUSD: number | null
    liquidityUSD: number | null
    apr: number | null
  }

  export type DaySnapshotCountAggregateOutputType = {
    id: number
    poolId: number
    date: number
    volumeUSD: number
    liquidityUSD: number
    apr: number
    _all: number
  }


  export type DaySnapshotAvgAggregateInputType = {
    id?: true
    volumeUSD?: true
    liquidityUSD?: true
    apr?: true
  }

  export type DaySnapshotSumAggregateInputType = {
    id?: true
    volumeUSD?: true
    liquidityUSD?: true
    apr?: true
  }

  export type DaySnapshotMinAggregateInputType = {
    id?: true
    poolId?: true
    date?: true
    volumeUSD?: true
    liquidityUSD?: true
    apr?: true
  }

  export type DaySnapshotMaxAggregateInputType = {
    id?: true
    poolId?: true
    date?: true
    volumeUSD?: true
    liquidityUSD?: true
    apr?: true
  }

  export type DaySnapshotCountAggregateInputType = {
    id?: true
    poolId?: true
    date?: true
    volumeUSD?: true
    liquidityUSD?: true
    apr?: true
    _all?: true
  }

  export type DaySnapshotAggregateArgs = {
    /**
     * Filter which daySnapshot to aggregate.
     */
    where?: daySnapshotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of daySnapshots to fetch.
     */
    orderBy?: Enumerable<daySnapshotOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: daySnapshotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` daySnapshots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` daySnapshots.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned daySnapshots
    **/
    _count?: true | DaySnapshotCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: DaySnapshotAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: DaySnapshotSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: DaySnapshotMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: DaySnapshotMaxAggregateInputType
  }

  export type GetDaySnapshotAggregateType<T extends DaySnapshotAggregateArgs> = {
        [P in keyof T & keyof AggregateDaySnapshot]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateDaySnapshot[P]>
      : GetScalarType<T[P], AggregateDaySnapshot[P]>
  }




  export type DaySnapshotGroupByArgs = {
    where?: daySnapshotWhereInput
    orderBy?: Enumerable<daySnapshotOrderByWithAggregationInput>
    by: DaySnapshotScalarFieldEnum[]
    having?: daySnapshotScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: DaySnapshotCountAggregateInputType | true
    _avg?: DaySnapshotAvgAggregateInputType
    _sum?: DaySnapshotSumAggregateInputType
    _min?: DaySnapshotMinAggregateInputType
    _max?: DaySnapshotMaxAggregateInputType
  }


  export type DaySnapshotGroupByOutputType = {
    id: number
    poolId: string
    date: Date
    volumeUSD: number
    liquidityUSD: number
    apr: number
    _count: DaySnapshotCountAggregateOutputType | null
    _avg: DaySnapshotAvgAggregateOutputType | null
    _sum: DaySnapshotSumAggregateOutputType | null
    _min: DaySnapshotMinAggregateOutputType | null
    _max: DaySnapshotMaxAggregateOutputType | null
  }

  type GetDaySnapshotGroupByPayload<T extends DaySnapshotGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickArray<DaySnapshotGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof DaySnapshotGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], DaySnapshotGroupByOutputType[P]>
            : GetScalarType<T[P], DaySnapshotGroupByOutputType[P]>
        }
      >
    >


  export type daySnapshotSelect = {
    id?: boolean
    poolId?: boolean
    date?: boolean
    volumeUSD?: boolean
    liquidityUSD?: boolean
    apr?: boolean
    pool?: boolean | PoolArgs
  }


  export type daySnapshotInclude = {
    pool?: boolean | PoolArgs
  }

  export type daySnapshotGetPayload<S extends boolean | null | undefined | daySnapshotArgs> =
    S extends { select: any, include: any } ? 'Please either choose `select` or `include`' :
    S extends true ? daySnapshot :
    S extends undefined ? never :
    S extends { include: any } & (daySnapshotArgs | daySnapshotFindManyArgs)
    ? daySnapshot  & {
    [P in TruthyKeys<S['include']>]:
        P extends 'pool' ? PoolGetPayload<S['include'][P]> :  never
  } 
    : S extends { select: any } & (daySnapshotArgs | daySnapshotFindManyArgs)
      ? {
    [P in TruthyKeys<S['select']>]:
        P extends 'pool' ? PoolGetPayload<S['select'][P]> :  P extends keyof daySnapshot ? daySnapshot[P] : never
  } 
      : daySnapshot


  type daySnapshotCountArgs = 
    Omit<daySnapshotFindManyArgs, 'select' | 'include'> & {
      select?: DaySnapshotCountAggregateInputType | true
    }

  export interface daySnapshotDelegate<GlobalRejectSettings extends Prisma.RejectOnNotFound | Prisma.RejectPerOperation | false | undefined> {

    /**
     * Find zero or one DaySnapshot that matches the filter.
     * @param {daySnapshotFindUniqueArgs} args - Arguments to find a DaySnapshot
     * @example
     * // Get one DaySnapshot
     * const daySnapshot = await prisma.daySnapshot.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUnique<T extends daySnapshotFindUniqueArgs,  LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args: SelectSubset<T, daySnapshotFindUniqueArgs>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findUnique', 'daySnapshot'> extends True ? Prisma__daySnapshotClient<daySnapshotGetPayload<T>> : Prisma__daySnapshotClient<daySnapshotGetPayload<T> | null, null>

    /**
     * Find one DaySnapshot that matches the filter or throw an error  with `error.code='P2025'` 
     *     if no matches were found.
     * @param {daySnapshotFindUniqueOrThrowArgs} args - Arguments to find a DaySnapshot
     * @example
     * // Get one DaySnapshot
     * const daySnapshot = await prisma.daySnapshot.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUniqueOrThrow<T extends daySnapshotFindUniqueOrThrowArgs>(
      args?: SelectSubset<T, daySnapshotFindUniqueOrThrowArgs>
    ): Prisma__daySnapshotClient<daySnapshotGetPayload<T>>

    /**
     * Find the first DaySnapshot that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {daySnapshotFindFirstArgs} args - Arguments to find a DaySnapshot
     * @example
     * // Get one DaySnapshot
     * const daySnapshot = await prisma.daySnapshot.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirst<T extends daySnapshotFindFirstArgs,  LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args?: SelectSubset<T, daySnapshotFindFirstArgs>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findFirst', 'daySnapshot'> extends True ? Prisma__daySnapshotClient<daySnapshotGetPayload<T>> : Prisma__daySnapshotClient<daySnapshotGetPayload<T> | null, null>

    /**
     * Find the first DaySnapshot that matches the filter or
     * throw `NotFoundError` if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {daySnapshotFindFirstOrThrowArgs} args - Arguments to find a DaySnapshot
     * @example
     * // Get one DaySnapshot
     * const daySnapshot = await prisma.daySnapshot.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirstOrThrow<T extends daySnapshotFindFirstOrThrowArgs>(
      args?: SelectSubset<T, daySnapshotFindFirstOrThrowArgs>
    ): Prisma__daySnapshotClient<daySnapshotGetPayload<T>>

    /**
     * Find zero or more DaySnapshots that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {daySnapshotFindManyArgs=} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all DaySnapshots
     * const daySnapshots = await prisma.daySnapshot.findMany()
     * 
     * // Get first 10 DaySnapshots
     * const daySnapshots = await prisma.daySnapshot.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const daySnapshotWithIdOnly = await prisma.daySnapshot.findMany({ select: { id: true } })
     * 
    **/
    findMany<T extends daySnapshotFindManyArgs>(
      args?: SelectSubset<T, daySnapshotFindManyArgs>
    ): Prisma.PrismaPromise<Array<daySnapshotGetPayload<T>>>

    /**
     * Create a DaySnapshot.
     * @param {daySnapshotCreateArgs} args - Arguments to create a DaySnapshot.
     * @example
     * // Create one DaySnapshot
     * const DaySnapshot = await prisma.daySnapshot.create({
     *   data: {
     *     // ... data to create a DaySnapshot
     *   }
     * })
     * 
    **/
    create<T extends daySnapshotCreateArgs>(
      args: SelectSubset<T, daySnapshotCreateArgs>
    ): Prisma__daySnapshotClient<daySnapshotGetPayload<T>>

    /**
     * Create many DaySnapshots.
     *     @param {daySnapshotCreateManyArgs} args - Arguments to create many DaySnapshots.
     *     @example
     *     // Create many DaySnapshots
     *     const daySnapshot = await prisma.daySnapshot.createMany({
     *       data: {
     *         // ... provide data here
     *       }
     *     })
     *     
    **/
    createMany<T extends daySnapshotCreateManyArgs>(
      args?: SelectSubset<T, daySnapshotCreateManyArgs>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a DaySnapshot.
     * @param {daySnapshotDeleteArgs} args - Arguments to delete one DaySnapshot.
     * @example
     * // Delete one DaySnapshot
     * const DaySnapshot = await prisma.daySnapshot.delete({
     *   where: {
     *     // ... filter to delete one DaySnapshot
     *   }
     * })
     * 
    **/
    delete<T extends daySnapshotDeleteArgs>(
      args: SelectSubset<T, daySnapshotDeleteArgs>
    ): Prisma__daySnapshotClient<daySnapshotGetPayload<T>>

    /**
     * Update one DaySnapshot.
     * @param {daySnapshotUpdateArgs} args - Arguments to update one DaySnapshot.
     * @example
     * // Update one DaySnapshot
     * const daySnapshot = await prisma.daySnapshot.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    update<T extends daySnapshotUpdateArgs>(
      args: SelectSubset<T, daySnapshotUpdateArgs>
    ): Prisma__daySnapshotClient<daySnapshotGetPayload<T>>

    /**
     * Delete zero or more DaySnapshots.
     * @param {daySnapshotDeleteManyArgs} args - Arguments to filter DaySnapshots to delete.
     * @example
     * // Delete a few DaySnapshots
     * const { count } = await prisma.daySnapshot.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
    **/
    deleteMany<T extends daySnapshotDeleteManyArgs>(
      args?: SelectSubset<T, daySnapshotDeleteManyArgs>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more DaySnapshots.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {daySnapshotUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many DaySnapshots
     * const daySnapshot = await prisma.daySnapshot.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    updateMany<T extends daySnapshotUpdateManyArgs>(
      args: SelectSubset<T, daySnapshotUpdateManyArgs>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one DaySnapshot.
     * @param {daySnapshotUpsertArgs} args - Arguments to update or create a DaySnapshot.
     * @example
     * // Update or create a DaySnapshot
     * const daySnapshot = await prisma.daySnapshot.upsert({
     *   create: {
     *     // ... data to create a DaySnapshot
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the DaySnapshot we want to update
     *   }
     * })
    **/
    upsert<T extends daySnapshotUpsertArgs>(
      args: SelectSubset<T, daySnapshotUpsertArgs>
    ): Prisma__daySnapshotClient<daySnapshotGetPayload<T>>

    /**
     * Count the number of DaySnapshots.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {daySnapshotCountArgs} args - Arguments to filter DaySnapshots to count.
     * @example
     * // Count the number of DaySnapshots
     * const count = await prisma.daySnapshot.count({
     *   where: {
     *     // ... the filter for the DaySnapshots we want to count
     *   }
     * })
    **/
    count<T extends daySnapshotCountArgs>(
      args?: Subset<T, daySnapshotCountArgs>,
    ): Prisma.PrismaPromise<
      T extends _Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], DaySnapshotCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a DaySnapshot.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DaySnapshotAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends DaySnapshotAggregateArgs>(args: Subset<T, DaySnapshotAggregateArgs>): Prisma.PrismaPromise<GetDaySnapshotAggregateType<T>>

    /**
     * Group by DaySnapshot.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DaySnapshotGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends DaySnapshotGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: DaySnapshotGroupByArgs['orderBy'] }
        : { orderBy?: DaySnapshotGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends TupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, DaySnapshotGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDaySnapshotGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>

  }

  /**
   * The delegate class that acts as a "Promise-like" for daySnapshot.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export class Prisma__daySnapshotClient<T, Null = never> implements Prisma.PrismaPromise<T> {
    private readonly _dmmf;
    private readonly _queryType;
    private readonly _rootField;
    private readonly _clientMethod;
    private readonly _args;
    private readonly _dataPath;
    private readonly _errorFormat;
    private readonly _measurePerformance?;
    private _isList;
    private _callsite;
    private _requestPromise?;
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    constructor(_dmmf: runtime.DMMFClass, _queryType: 'query' | 'mutation', _rootField: string, _clientMethod: string, _args: any, _dataPath: string[], _errorFormat: ErrorFormat, _measurePerformance?: boolean | undefined, _isList?: boolean);

    pool<T extends PoolArgs= {}>(args?: Subset<T, PoolArgs>): Prisma__PoolClient<PoolGetPayload<T> | Null>;

    private get _document();
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): Promise<T>;
  }



  // Custom InputTypes

  /**
   * daySnapshot base type for findUnique actions
   */
  export type daySnapshotFindUniqueArgsBase = {
    /**
     * Select specific fields to fetch from the daySnapshot
     */
    select?: daySnapshotSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: daySnapshotInclude | null
    /**
     * Filter, which daySnapshot to fetch.
     */
    where: daySnapshotWhereUniqueInput
  }

  /**
   * daySnapshot findUnique
   */
  export interface daySnapshotFindUniqueArgs extends daySnapshotFindUniqueArgsBase {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findUniqueOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * daySnapshot findUniqueOrThrow
   */
  export type daySnapshotFindUniqueOrThrowArgs = {
    /**
     * Select specific fields to fetch from the daySnapshot
     */
    select?: daySnapshotSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: daySnapshotInclude | null
    /**
     * Filter, which daySnapshot to fetch.
     */
    where: daySnapshotWhereUniqueInput
  }


  /**
   * daySnapshot base type for findFirst actions
   */
  export type daySnapshotFindFirstArgsBase = {
    /**
     * Select specific fields to fetch from the daySnapshot
     */
    select?: daySnapshotSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: daySnapshotInclude | null
    /**
     * Filter, which daySnapshot to fetch.
     */
    where?: daySnapshotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of daySnapshots to fetch.
     */
    orderBy?: Enumerable<daySnapshotOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for daySnapshots.
     */
    cursor?: daySnapshotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` daySnapshots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` daySnapshots.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of daySnapshots.
     */
    distinct?: Enumerable<DaySnapshotScalarFieldEnum>
  }

  /**
   * daySnapshot findFirst
   */
  export interface daySnapshotFindFirstArgs extends daySnapshotFindFirstArgsBase {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findFirstOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * daySnapshot findFirstOrThrow
   */
  export type daySnapshotFindFirstOrThrowArgs = {
    /**
     * Select specific fields to fetch from the daySnapshot
     */
    select?: daySnapshotSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: daySnapshotInclude | null
    /**
     * Filter, which daySnapshot to fetch.
     */
    where?: daySnapshotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of daySnapshots to fetch.
     */
    orderBy?: Enumerable<daySnapshotOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for daySnapshots.
     */
    cursor?: daySnapshotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` daySnapshots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` daySnapshots.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of daySnapshots.
     */
    distinct?: Enumerable<DaySnapshotScalarFieldEnum>
  }


  /**
   * daySnapshot findMany
   */
  export type daySnapshotFindManyArgs = {
    /**
     * Select specific fields to fetch from the daySnapshot
     */
    select?: daySnapshotSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: daySnapshotInclude | null
    /**
     * Filter, which daySnapshots to fetch.
     */
    where?: daySnapshotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of daySnapshots to fetch.
     */
    orderBy?: Enumerable<daySnapshotOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing daySnapshots.
     */
    cursor?: daySnapshotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` daySnapshots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` daySnapshots.
     */
    skip?: number
    distinct?: Enumerable<DaySnapshotScalarFieldEnum>
  }


  /**
   * daySnapshot create
   */
  export type daySnapshotCreateArgs = {
    /**
     * Select specific fields to fetch from the daySnapshot
     */
    select?: daySnapshotSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: daySnapshotInclude | null
    /**
     * The data needed to create a daySnapshot.
     */
    data: XOR<daySnapshotCreateInput, daySnapshotUncheckedCreateInput>
  }


  /**
   * daySnapshot createMany
   */
  export type daySnapshotCreateManyArgs = {
    /**
     * The data used to create many daySnapshots.
     */
    data: Enumerable<daySnapshotCreateManyInput>
    skipDuplicates?: boolean
  }


  /**
   * daySnapshot update
   */
  export type daySnapshotUpdateArgs = {
    /**
     * Select specific fields to fetch from the daySnapshot
     */
    select?: daySnapshotSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: daySnapshotInclude | null
    /**
     * The data needed to update a daySnapshot.
     */
    data: XOR<daySnapshotUpdateInput, daySnapshotUncheckedUpdateInput>
    /**
     * Choose, which daySnapshot to update.
     */
    where: daySnapshotWhereUniqueInput
  }


  /**
   * daySnapshot updateMany
   */
  export type daySnapshotUpdateManyArgs = {
    /**
     * The data used to update daySnapshots.
     */
    data: XOR<daySnapshotUpdateManyMutationInput, daySnapshotUncheckedUpdateManyInput>
    /**
     * Filter which daySnapshots to update
     */
    where?: daySnapshotWhereInput
  }


  /**
   * daySnapshot upsert
   */
  export type daySnapshotUpsertArgs = {
    /**
     * Select specific fields to fetch from the daySnapshot
     */
    select?: daySnapshotSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: daySnapshotInclude | null
    /**
     * The filter to search for the daySnapshot to update in case it exists.
     */
    where: daySnapshotWhereUniqueInput
    /**
     * In case the daySnapshot found by the `where` argument doesn't exist, create a new daySnapshot with this data.
     */
    create: XOR<daySnapshotCreateInput, daySnapshotUncheckedCreateInput>
    /**
     * In case the daySnapshot was found with the provided `where` argument, update it with this data.
     */
    update: XOR<daySnapshotUpdateInput, daySnapshotUncheckedUpdateInput>
  }


  /**
   * daySnapshot delete
   */
  export type daySnapshotDeleteArgs = {
    /**
     * Select specific fields to fetch from the daySnapshot
     */
    select?: daySnapshotSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: daySnapshotInclude | null
    /**
     * Filter which daySnapshot to delete.
     */
    where: daySnapshotWhereUniqueInput
  }


  /**
   * daySnapshot deleteMany
   */
  export type daySnapshotDeleteManyArgs = {
    /**
     * Filter which daySnapshots to delete
     */
    where?: daySnapshotWhereInput
  }


  /**
   * daySnapshot without action
   */
  export type daySnapshotArgs = {
    /**
     * Select specific fields to fetch from the daySnapshot
     */
    select?: daySnapshotSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: daySnapshotInclude | null
  }



  /**
   * Model hourSnapshot
   */


  export type AggregateHourSnapshot = {
    _count: HourSnapshotCountAggregateOutputType | null
    _avg: HourSnapshotAvgAggregateOutputType | null
    _sum: HourSnapshotSumAggregateOutputType | null
    _min: HourSnapshotMinAggregateOutputType | null
    _max: HourSnapshotMaxAggregateOutputType | null
  }

  export type HourSnapshotAvgAggregateOutputType = {
    id: number | null
    volumeUSD: number | null
    liquidityUSD: number | null
    apr: number | null
  }

  export type HourSnapshotSumAggregateOutputType = {
    id: number | null
    volumeUSD: number | null
    liquidityUSD: number | null
    apr: number | null
  }

  export type HourSnapshotMinAggregateOutputType = {
    id: number | null
    poolId: string | null
    date: Date | null
    volumeUSD: number | null
    liquidityUSD: number | null
    apr: number | null
  }

  export type HourSnapshotMaxAggregateOutputType = {
    id: number | null
    poolId: string | null
    date: Date | null
    volumeUSD: number | null
    liquidityUSD: number | null
    apr: number | null
  }

  export type HourSnapshotCountAggregateOutputType = {
    id: number
    poolId: number
    date: number
    volumeUSD: number
    liquidityUSD: number
    apr: number
    _all: number
  }


  export type HourSnapshotAvgAggregateInputType = {
    id?: true
    volumeUSD?: true
    liquidityUSD?: true
    apr?: true
  }

  export type HourSnapshotSumAggregateInputType = {
    id?: true
    volumeUSD?: true
    liquidityUSD?: true
    apr?: true
  }

  export type HourSnapshotMinAggregateInputType = {
    id?: true
    poolId?: true
    date?: true
    volumeUSD?: true
    liquidityUSD?: true
    apr?: true
  }

  export type HourSnapshotMaxAggregateInputType = {
    id?: true
    poolId?: true
    date?: true
    volumeUSD?: true
    liquidityUSD?: true
    apr?: true
  }

  export type HourSnapshotCountAggregateInputType = {
    id?: true
    poolId?: true
    date?: true
    volumeUSD?: true
    liquidityUSD?: true
    apr?: true
    _all?: true
  }

  export type HourSnapshotAggregateArgs = {
    /**
     * Filter which hourSnapshot to aggregate.
     */
    where?: hourSnapshotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of hourSnapshots to fetch.
     */
    orderBy?: Enumerable<hourSnapshotOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: hourSnapshotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` hourSnapshots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` hourSnapshots.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned hourSnapshots
    **/
    _count?: true | HourSnapshotCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: HourSnapshotAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: HourSnapshotSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: HourSnapshotMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: HourSnapshotMaxAggregateInputType
  }

  export type GetHourSnapshotAggregateType<T extends HourSnapshotAggregateArgs> = {
        [P in keyof T & keyof AggregateHourSnapshot]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateHourSnapshot[P]>
      : GetScalarType<T[P], AggregateHourSnapshot[P]>
  }




  export type HourSnapshotGroupByArgs = {
    where?: hourSnapshotWhereInput
    orderBy?: Enumerable<hourSnapshotOrderByWithAggregationInput>
    by: HourSnapshotScalarFieldEnum[]
    having?: hourSnapshotScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: HourSnapshotCountAggregateInputType | true
    _avg?: HourSnapshotAvgAggregateInputType
    _sum?: HourSnapshotSumAggregateInputType
    _min?: HourSnapshotMinAggregateInputType
    _max?: HourSnapshotMaxAggregateInputType
  }


  export type HourSnapshotGroupByOutputType = {
    id: number
    poolId: string
    date: Date
    volumeUSD: number
    liquidityUSD: number
    apr: number
    _count: HourSnapshotCountAggregateOutputType | null
    _avg: HourSnapshotAvgAggregateOutputType | null
    _sum: HourSnapshotSumAggregateOutputType | null
    _min: HourSnapshotMinAggregateOutputType | null
    _max: HourSnapshotMaxAggregateOutputType | null
  }

  type GetHourSnapshotGroupByPayload<T extends HourSnapshotGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickArray<HourSnapshotGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof HourSnapshotGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], HourSnapshotGroupByOutputType[P]>
            : GetScalarType<T[P], HourSnapshotGroupByOutputType[P]>
        }
      >
    >


  export type hourSnapshotSelect = {
    id?: boolean
    poolId?: boolean
    date?: boolean
    volumeUSD?: boolean
    liquidityUSD?: boolean
    apr?: boolean
    pool?: boolean | PoolArgs
  }


  export type hourSnapshotInclude = {
    pool?: boolean | PoolArgs
  }

  export type hourSnapshotGetPayload<S extends boolean | null | undefined | hourSnapshotArgs> =
    S extends { select: any, include: any } ? 'Please either choose `select` or `include`' :
    S extends true ? hourSnapshot :
    S extends undefined ? never :
    S extends { include: any } & (hourSnapshotArgs | hourSnapshotFindManyArgs)
    ? hourSnapshot  & {
    [P in TruthyKeys<S['include']>]:
        P extends 'pool' ? PoolGetPayload<S['include'][P]> :  never
  } 
    : S extends { select: any } & (hourSnapshotArgs | hourSnapshotFindManyArgs)
      ? {
    [P in TruthyKeys<S['select']>]:
        P extends 'pool' ? PoolGetPayload<S['select'][P]> :  P extends keyof hourSnapshot ? hourSnapshot[P] : never
  } 
      : hourSnapshot


  type hourSnapshotCountArgs = 
    Omit<hourSnapshotFindManyArgs, 'select' | 'include'> & {
      select?: HourSnapshotCountAggregateInputType | true
    }

  export interface hourSnapshotDelegate<GlobalRejectSettings extends Prisma.RejectOnNotFound | Prisma.RejectPerOperation | false | undefined> {

    /**
     * Find zero or one HourSnapshot that matches the filter.
     * @param {hourSnapshotFindUniqueArgs} args - Arguments to find a HourSnapshot
     * @example
     * // Get one HourSnapshot
     * const hourSnapshot = await prisma.hourSnapshot.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUnique<T extends hourSnapshotFindUniqueArgs,  LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args: SelectSubset<T, hourSnapshotFindUniqueArgs>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findUnique', 'hourSnapshot'> extends True ? Prisma__hourSnapshotClient<hourSnapshotGetPayload<T>> : Prisma__hourSnapshotClient<hourSnapshotGetPayload<T> | null, null>

    /**
     * Find one HourSnapshot that matches the filter or throw an error  with `error.code='P2025'` 
     *     if no matches were found.
     * @param {hourSnapshotFindUniqueOrThrowArgs} args - Arguments to find a HourSnapshot
     * @example
     * // Get one HourSnapshot
     * const hourSnapshot = await prisma.hourSnapshot.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUniqueOrThrow<T extends hourSnapshotFindUniqueOrThrowArgs>(
      args?: SelectSubset<T, hourSnapshotFindUniqueOrThrowArgs>
    ): Prisma__hourSnapshotClient<hourSnapshotGetPayload<T>>

    /**
     * Find the first HourSnapshot that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {hourSnapshotFindFirstArgs} args - Arguments to find a HourSnapshot
     * @example
     * // Get one HourSnapshot
     * const hourSnapshot = await prisma.hourSnapshot.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirst<T extends hourSnapshotFindFirstArgs,  LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args?: SelectSubset<T, hourSnapshotFindFirstArgs>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findFirst', 'hourSnapshot'> extends True ? Prisma__hourSnapshotClient<hourSnapshotGetPayload<T>> : Prisma__hourSnapshotClient<hourSnapshotGetPayload<T> | null, null>

    /**
     * Find the first HourSnapshot that matches the filter or
     * throw `NotFoundError` if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {hourSnapshotFindFirstOrThrowArgs} args - Arguments to find a HourSnapshot
     * @example
     * // Get one HourSnapshot
     * const hourSnapshot = await prisma.hourSnapshot.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirstOrThrow<T extends hourSnapshotFindFirstOrThrowArgs>(
      args?: SelectSubset<T, hourSnapshotFindFirstOrThrowArgs>
    ): Prisma__hourSnapshotClient<hourSnapshotGetPayload<T>>

    /**
     * Find zero or more HourSnapshots that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {hourSnapshotFindManyArgs=} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all HourSnapshots
     * const hourSnapshots = await prisma.hourSnapshot.findMany()
     * 
     * // Get first 10 HourSnapshots
     * const hourSnapshots = await prisma.hourSnapshot.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const hourSnapshotWithIdOnly = await prisma.hourSnapshot.findMany({ select: { id: true } })
     * 
    **/
    findMany<T extends hourSnapshotFindManyArgs>(
      args?: SelectSubset<T, hourSnapshotFindManyArgs>
    ): Prisma.PrismaPromise<Array<hourSnapshotGetPayload<T>>>

    /**
     * Create a HourSnapshot.
     * @param {hourSnapshotCreateArgs} args - Arguments to create a HourSnapshot.
     * @example
     * // Create one HourSnapshot
     * const HourSnapshot = await prisma.hourSnapshot.create({
     *   data: {
     *     // ... data to create a HourSnapshot
     *   }
     * })
     * 
    **/
    create<T extends hourSnapshotCreateArgs>(
      args: SelectSubset<T, hourSnapshotCreateArgs>
    ): Prisma__hourSnapshotClient<hourSnapshotGetPayload<T>>

    /**
     * Create many HourSnapshots.
     *     @param {hourSnapshotCreateManyArgs} args - Arguments to create many HourSnapshots.
     *     @example
     *     // Create many HourSnapshots
     *     const hourSnapshot = await prisma.hourSnapshot.createMany({
     *       data: {
     *         // ... provide data here
     *       }
     *     })
     *     
    **/
    createMany<T extends hourSnapshotCreateManyArgs>(
      args?: SelectSubset<T, hourSnapshotCreateManyArgs>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a HourSnapshot.
     * @param {hourSnapshotDeleteArgs} args - Arguments to delete one HourSnapshot.
     * @example
     * // Delete one HourSnapshot
     * const HourSnapshot = await prisma.hourSnapshot.delete({
     *   where: {
     *     // ... filter to delete one HourSnapshot
     *   }
     * })
     * 
    **/
    delete<T extends hourSnapshotDeleteArgs>(
      args: SelectSubset<T, hourSnapshotDeleteArgs>
    ): Prisma__hourSnapshotClient<hourSnapshotGetPayload<T>>

    /**
     * Update one HourSnapshot.
     * @param {hourSnapshotUpdateArgs} args - Arguments to update one HourSnapshot.
     * @example
     * // Update one HourSnapshot
     * const hourSnapshot = await prisma.hourSnapshot.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    update<T extends hourSnapshotUpdateArgs>(
      args: SelectSubset<T, hourSnapshotUpdateArgs>
    ): Prisma__hourSnapshotClient<hourSnapshotGetPayload<T>>

    /**
     * Delete zero or more HourSnapshots.
     * @param {hourSnapshotDeleteManyArgs} args - Arguments to filter HourSnapshots to delete.
     * @example
     * // Delete a few HourSnapshots
     * const { count } = await prisma.hourSnapshot.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
    **/
    deleteMany<T extends hourSnapshotDeleteManyArgs>(
      args?: SelectSubset<T, hourSnapshotDeleteManyArgs>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more HourSnapshots.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {hourSnapshotUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many HourSnapshots
     * const hourSnapshot = await prisma.hourSnapshot.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    updateMany<T extends hourSnapshotUpdateManyArgs>(
      args: SelectSubset<T, hourSnapshotUpdateManyArgs>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one HourSnapshot.
     * @param {hourSnapshotUpsertArgs} args - Arguments to update or create a HourSnapshot.
     * @example
     * // Update or create a HourSnapshot
     * const hourSnapshot = await prisma.hourSnapshot.upsert({
     *   create: {
     *     // ... data to create a HourSnapshot
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the HourSnapshot we want to update
     *   }
     * })
    **/
    upsert<T extends hourSnapshotUpsertArgs>(
      args: SelectSubset<T, hourSnapshotUpsertArgs>
    ): Prisma__hourSnapshotClient<hourSnapshotGetPayload<T>>

    /**
     * Count the number of HourSnapshots.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {hourSnapshotCountArgs} args - Arguments to filter HourSnapshots to count.
     * @example
     * // Count the number of HourSnapshots
     * const count = await prisma.hourSnapshot.count({
     *   where: {
     *     // ... the filter for the HourSnapshots we want to count
     *   }
     * })
    **/
    count<T extends hourSnapshotCountArgs>(
      args?: Subset<T, hourSnapshotCountArgs>,
    ): Prisma.PrismaPromise<
      T extends _Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], HourSnapshotCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a HourSnapshot.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HourSnapshotAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends HourSnapshotAggregateArgs>(args: Subset<T, HourSnapshotAggregateArgs>): Prisma.PrismaPromise<GetHourSnapshotAggregateType<T>>

    /**
     * Group by HourSnapshot.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HourSnapshotGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends HourSnapshotGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: HourSnapshotGroupByArgs['orderBy'] }
        : { orderBy?: HourSnapshotGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends TupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, HourSnapshotGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetHourSnapshotGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>

  }

  /**
   * The delegate class that acts as a "Promise-like" for hourSnapshot.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export class Prisma__hourSnapshotClient<T, Null = never> implements Prisma.PrismaPromise<T> {
    private readonly _dmmf;
    private readonly _queryType;
    private readonly _rootField;
    private readonly _clientMethod;
    private readonly _args;
    private readonly _dataPath;
    private readonly _errorFormat;
    private readonly _measurePerformance?;
    private _isList;
    private _callsite;
    private _requestPromise?;
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    constructor(_dmmf: runtime.DMMFClass, _queryType: 'query' | 'mutation', _rootField: string, _clientMethod: string, _args: any, _dataPath: string[], _errorFormat: ErrorFormat, _measurePerformance?: boolean | undefined, _isList?: boolean);

    pool<T extends PoolArgs= {}>(args?: Subset<T, PoolArgs>): Prisma__PoolClient<PoolGetPayload<T> | Null>;

    private get _document();
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): Promise<T>;
  }



  // Custom InputTypes

  /**
   * hourSnapshot base type for findUnique actions
   */
  export type hourSnapshotFindUniqueArgsBase = {
    /**
     * Select specific fields to fetch from the hourSnapshot
     */
    select?: hourSnapshotSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: hourSnapshotInclude | null
    /**
     * Filter, which hourSnapshot to fetch.
     */
    where: hourSnapshotWhereUniqueInput
  }

  /**
   * hourSnapshot findUnique
   */
  export interface hourSnapshotFindUniqueArgs extends hourSnapshotFindUniqueArgsBase {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findUniqueOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * hourSnapshot findUniqueOrThrow
   */
  export type hourSnapshotFindUniqueOrThrowArgs = {
    /**
     * Select specific fields to fetch from the hourSnapshot
     */
    select?: hourSnapshotSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: hourSnapshotInclude | null
    /**
     * Filter, which hourSnapshot to fetch.
     */
    where: hourSnapshotWhereUniqueInput
  }


  /**
   * hourSnapshot base type for findFirst actions
   */
  export type hourSnapshotFindFirstArgsBase = {
    /**
     * Select specific fields to fetch from the hourSnapshot
     */
    select?: hourSnapshotSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: hourSnapshotInclude | null
    /**
     * Filter, which hourSnapshot to fetch.
     */
    where?: hourSnapshotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of hourSnapshots to fetch.
     */
    orderBy?: Enumerable<hourSnapshotOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for hourSnapshots.
     */
    cursor?: hourSnapshotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` hourSnapshots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` hourSnapshots.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of hourSnapshots.
     */
    distinct?: Enumerable<HourSnapshotScalarFieldEnum>
  }

  /**
   * hourSnapshot findFirst
   */
  export interface hourSnapshotFindFirstArgs extends hourSnapshotFindFirstArgsBase {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findFirstOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * hourSnapshot findFirstOrThrow
   */
  export type hourSnapshotFindFirstOrThrowArgs = {
    /**
     * Select specific fields to fetch from the hourSnapshot
     */
    select?: hourSnapshotSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: hourSnapshotInclude | null
    /**
     * Filter, which hourSnapshot to fetch.
     */
    where?: hourSnapshotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of hourSnapshots to fetch.
     */
    orderBy?: Enumerable<hourSnapshotOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for hourSnapshots.
     */
    cursor?: hourSnapshotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` hourSnapshots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` hourSnapshots.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of hourSnapshots.
     */
    distinct?: Enumerable<HourSnapshotScalarFieldEnum>
  }


  /**
   * hourSnapshot findMany
   */
  export type hourSnapshotFindManyArgs = {
    /**
     * Select specific fields to fetch from the hourSnapshot
     */
    select?: hourSnapshotSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: hourSnapshotInclude | null
    /**
     * Filter, which hourSnapshots to fetch.
     */
    where?: hourSnapshotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of hourSnapshots to fetch.
     */
    orderBy?: Enumerable<hourSnapshotOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing hourSnapshots.
     */
    cursor?: hourSnapshotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` hourSnapshots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` hourSnapshots.
     */
    skip?: number
    distinct?: Enumerable<HourSnapshotScalarFieldEnum>
  }


  /**
   * hourSnapshot create
   */
  export type hourSnapshotCreateArgs = {
    /**
     * Select specific fields to fetch from the hourSnapshot
     */
    select?: hourSnapshotSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: hourSnapshotInclude | null
    /**
     * The data needed to create a hourSnapshot.
     */
    data: XOR<hourSnapshotCreateInput, hourSnapshotUncheckedCreateInput>
  }


  /**
   * hourSnapshot createMany
   */
  export type hourSnapshotCreateManyArgs = {
    /**
     * The data used to create many hourSnapshots.
     */
    data: Enumerable<hourSnapshotCreateManyInput>
    skipDuplicates?: boolean
  }


  /**
   * hourSnapshot update
   */
  export type hourSnapshotUpdateArgs = {
    /**
     * Select specific fields to fetch from the hourSnapshot
     */
    select?: hourSnapshotSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: hourSnapshotInclude | null
    /**
     * The data needed to update a hourSnapshot.
     */
    data: XOR<hourSnapshotUpdateInput, hourSnapshotUncheckedUpdateInput>
    /**
     * Choose, which hourSnapshot to update.
     */
    where: hourSnapshotWhereUniqueInput
  }


  /**
   * hourSnapshot updateMany
   */
  export type hourSnapshotUpdateManyArgs = {
    /**
     * The data used to update hourSnapshots.
     */
    data: XOR<hourSnapshotUpdateManyMutationInput, hourSnapshotUncheckedUpdateManyInput>
    /**
     * Filter which hourSnapshots to update
     */
    where?: hourSnapshotWhereInput
  }


  /**
   * hourSnapshot upsert
   */
  export type hourSnapshotUpsertArgs = {
    /**
     * Select specific fields to fetch from the hourSnapshot
     */
    select?: hourSnapshotSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: hourSnapshotInclude | null
    /**
     * The filter to search for the hourSnapshot to update in case it exists.
     */
    where: hourSnapshotWhereUniqueInput
    /**
     * In case the hourSnapshot found by the `where` argument doesn't exist, create a new hourSnapshot with this data.
     */
    create: XOR<hourSnapshotCreateInput, hourSnapshotUncheckedCreateInput>
    /**
     * In case the hourSnapshot was found with the provided `where` argument, update it with this data.
     */
    update: XOR<hourSnapshotUpdateInput, hourSnapshotUncheckedUpdateInput>
  }


  /**
   * hourSnapshot delete
   */
  export type hourSnapshotDeleteArgs = {
    /**
     * Select specific fields to fetch from the hourSnapshot
     */
    select?: hourSnapshotSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: hourSnapshotInclude | null
    /**
     * Filter which hourSnapshot to delete.
     */
    where: hourSnapshotWhereUniqueInput
  }


  /**
   * hourSnapshot deleteMany
   */
  export type hourSnapshotDeleteManyArgs = {
    /**
     * Filter which hourSnapshots to delete
     */
    where?: hourSnapshotWhereInput
  }


  /**
   * hourSnapshot without action
   */
  export type hourSnapshotArgs = {
    /**
     * Select specific fields to fetch from the hourSnapshot
     */
    select?: hourSnapshotSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: hourSnapshotInclude | null
  }



  /**
   * Model DozerPool
   */


  export type AggregateDozerPool = {
    _count: DozerPoolCountAggregateOutputType | null
    _avg: DozerPoolAvgAggregateOutputType | null
    _sum: DozerPoolSumAggregateOutputType | null
    _min: DozerPoolMinAggregateOutputType | null
    _max: DozerPoolMaxAggregateOutputType | null
  }

  export type DozerPoolAvgAggregateOutputType = {
    chainId: number | null
    swapFee: number | null
    liquidityUSD: number | null
    volumeUSD: number | null
    feeApr: number | null
    incentiveApr: number | null
    totalApr: number | null
    volume1d: number | null
    fees1d: number | null
    volume1w: number | null
    fees1w: number | null
    createdAtBlockNumber: number | null
  }

  export type DozerPoolSumAggregateOutputType = {
    chainId: number | null
    swapFee: number | null
    liquidityUSD: number | null
    volumeUSD: number | null
    feeApr: number | null
    incentiveApr: number | null
    totalApr: number | null
    volume1d: number | null
    fees1d: number | null
    volume1w: number | null
    fees1w: number | null
    createdAtBlockNumber: bigint | null
  }

  export type DozerPoolMinAggregateOutputType = {
    id: string | null
    name: string | null
    chainId: number | null
    version: string | null
    token0Id: string | null
    token1Id: string | null
    swapFee: number | null
    twapEnabled: boolean | null
    reserve0: string | null
    reserve1: string | null
    totalSupply: string | null
    liquidityUSD: number | null
    volumeUSD: number | null
    token0Price: string | null
    token1Price: string | null
    feeApr: number | null
    incentiveApr: number | null
    totalApr: number | null
    isIncentivized: boolean | null
    volume1d: number | null
    fees1d: number | null
    volume1w: number | null
    fees1w: number | null
    createdAtBlockNumber: bigint | null
    isBlacklisted: boolean | null
    generatedAt: Date | null
    updatedAt: Date | null
  }

  export type DozerPoolMaxAggregateOutputType = {
    id: string | null
    name: string | null
    chainId: number | null
    version: string | null
    token0Id: string | null
    token1Id: string | null
    swapFee: number | null
    twapEnabled: boolean | null
    reserve0: string | null
    reserve1: string | null
    totalSupply: string | null
    liquidityUSD: number | null
    volumeUSD: number | null
    token0Price: string | null
    token1Price: string | null
    feeApr: number | null
    incentiveApr: number | null
    totalApr: number | null
    isIncentivized: boolean | null
    volume1d: number | null
    fees1d: number | null
    volume1w: number | null
    fees1w: number | null
    createdAtBlockNumber: bigint | null
    isBlacklisted: boolean | null
    generatedAt: Date | null
    updatedAt: Date | null
  }

  export type DozerPoolCountAggregateOutputType = {
    id: number
    name: number
    chainId: number
    version: number
    token0Id: number
    token1Id: number
    swapFee: number
    twapEnabled: number
    reserve0: number
    reserve1: number
    totalSupply: number
    liquidityUSD: number
    volumeUSD: number
    token0Price: number
    token1Price: number
    feeApr: number
    incentiveApr: number
    totalApr: number
    isIncentivized: number
    volume1d: number
    fees1d: number
    volume1w: number
    fees1w: number
    createdAtBlockNumber: number
    isBlacklisted: number
    generatedAt: number
    updatedAt: number
    _all: number
  }


  export type DozerPoolAvgAggregateInputType = {
    chainId?: true
    swapFee?: true
    liquidityUSD?: true
    volumeUSD?: true
    feeApr?: true
    incentiveApr?: true
    totalApr?: true
    volume1d?: true
    fees1d?: true
    volume1w?: true
    fees1w?: true
    createdAtBlockNumber?: true
  }

  export type DozerPoolSumAggregateInputType = {
    chainId?: true
    swapFee?: true
    liquidityUSD?: true
    volumeUSD?: true
    feeApr?: true
    incentiveApr?: true
    totalApr?: true
    volume1d?: true
    fees1d?: true
    volume1w?: true
    fees1w?: true
    createdAtBlockNumber?: true
  }

  export type DozerPoolMinAggregateInputType = {
    id?: true
    name?: true
    chainId?: true
    version?: true
    token0Id?: true
    token1Id?: true
    swapFee?: true
    twapEnabled?: true
    reserve0?: true
    reserve1?: true
    totalSupply?: true
    liquidityUSD?: true
    volumeUSD?: true
    token0Price?: true
    token1Price?: true
    feeApr?: true
    incentiveApr?: true
    totalApr?: true
    isIncentivized?: true
    volume1d?: true
    fees1d?: true
    volume1w?: true
    fees1w?: true
    createdAtBlockNumber?: true
    isBlacklisted?: true
    generatedAt?: true
    updatedAt?: true
  }

  export type DozerPoolMaxAggregateInputType = {
    id?: true
    name?: true
    chainId?: true
    version?: true
    token0Id?: true
    token1Id?: true
    swapFee?: true
    twapEnabled?: true
    reserve0?: true
    reserve1?: true
    totalSupply?: true
    liquidityUSD?: true
    volumeUSD?: true
    token0Price?: true
    token1Price?: true
    feeApr?: true
    incentiveApr?: true
    totalApr?: true
    isIncentivized?: true
    volume1d?: true
    fees1d?: true
    volume1w?: true
    fees1w?: true
    createdAtBlockNumber?: true
    isBlacklisted?: true
    generatedAt?: true
    updatedAt?: true
  }

  export type DozerPoolCountAggregateInputType = {
    id?: true
    name?: true
    chainId?: true
    version?: true
    token0Id?: true
    token1Id?: true
    swapFee?: true
    twapEnabled?: true
    reserve0?: true
    reserve1?: true
    totalSupply?: true
    liquidityUSD?: true
    volumeUSD?: true
    token0Price?: true
    token1Price?: true
    feeApr?: true
    incentiveApr?: true
    totalApr?: true
    isIncentivized?: true
    volume1d?: true
    fees1d?: true
    volume1w?: true
    fees1w?: true
    createdAtBlockNumber?: true
    isBlacklisted?: true
    generatedAt?: true
    updatedAt?: true
    _all?: true
  }

  export type DozerPoolAggregateArgs = {
    /**
     * Filter which DozerPool to aggregate.
     */
    where?: DozerPoolWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DozerPools to fetch.
     */
    orderBy?: Enumerable<DozerPoolOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: DozerPoolWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DozerPools from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DozerPools.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned DozerPools
    **/
    _count?: true | DozerPoolCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: DozerPoolAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: DozerPoolSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: DozerPoolMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: DozerPoolMaxAggregateInputType
  }

  export type GetDozerPoolAggregateType<T extends DozerPoolAggregateArgs> = {
        [P in keyof T & keyof AggregateDozerPool]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateDozerPool[P]>
      : GetScalarType<T[P], AggregateDozerPool[P]>
  }




  export type DozerPoolGroupByArgs = {
    where?: DozerPoolWhereInput
    orderBy?: Enumerable<DozerPoolOrderByWithAggregationInput>
    by: DozerPoolScalarFieldEnum[]
    having?: DozerPoolScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: DozerPoolCountAggregateInputType | true
    _avg?: DozerPoolAvgAggregateInputType
    _sum?: DozerPoolSumAggregateInputType
    _min?: DozerPoolMinAggregateInputType
    _max?: DozerPoolMaxAggregateInputType
  }


  export type DozerPoolGroupByOutputType = {
    id: string
    name: string
    chainId: number
    version: string
    token0Id: string
    token1Id: string
    swapFee: number
    twapEnabled: boolean
    reserve0: string
    reserve1: string
    totalSupply: string
    liquidityUSD: number
    volumeUSD: number
    token0Price: string
    token1Price: string
    feeApr: number
    incentiveApr: number
    totalApr: number
    isIncentivized: boolean
    volume1d: number
    fees1d: number
    volume1w: number
    fees1w: number
    createdAtBlockNumber: bigint
    isBlacklisted: boolean
    generatedAt: Date
    updatedAt: Date
    _count: DozerPoolCountAggregateOutputType | null
    _avg: DozerPoolAvgAggregateOutputType | null
    _sum: DozerPoolSumAggregateOutputType | null
    _min: DozerPoolMinAggregateOutputType | null
    _max: DozerPoolMaxAggregateOutputType | null
  }

  type GetDozerPoolGroupByPayload<T extends DozerPoolGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickArray<DozerPoolGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof DozerPoolGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], DozerPoolGroupByOutputType[P]>
            : GetScalarType<T[P], DozerPoolGroupByOutputType[P]>
        }
      >
    >


  export type DozerPoolSelect = {
    id?: boolean
    name?: boolean
    chainId?: boolean
    version?: boolean
    token0Id?: boolean
    token1Id?: boolean
    swapFee?: boolean
    twapEnabled?: boolean
    reserve0?: boolean
    reserve1?: boolean
    totalSupply?: boolean
    liquidityUSD?: boolean
    volumeUSD?: boolean
    token0Price?: boolean
    token1Price?: boolean
    feeApr?: boolean
    incentiveApr?: boolean
    totalApr?: boolean
    isIncentivized?: boolean
    volume1d?: boolean
    fees1d?: boolean
    volume1w?: boolean
    fees1w?: boolean
    createdAtBlockNumber?: boolean
    isBlacklisted?: boolean
    generatedAt?: boolean
    updatedAt?: boolean
    token0?: boolean | TokenArgs
    token1?: boolean | TokenArgs
    incentives?: boolean | DozerPool$incentivesArgs
    _count?: boolean | DozerPoolCountOutputTypeArgs
  }


  export type DozerPoolInclude = {
    token0?: boolean | TokenArgs
    token1?: boolean | TokenArgs
    incentives?: boolean | DozerPool$incentivesArgs
    _count?: boolean | DozerPoolCountOutputTypeArgs
  }

  export type DozerPoolGetPayload<S extends boolean | null | undefined | DozerPoolArgs> =
    S extends { select: any, include: any } ? 'Please either choose `select` or `include`' :
    S extends true ? DozerPool :
    S extends undefined ? never :
    S extends { include: any } & (DozerPoolArgs | DozerPoolFindManyArgs)
    ? DozerPool  & {
    [P in TruthyKeys<S['include']>]:
        P extends 'token0' ? TokenGetPayload<S['include'][P]> :
        P extends 'token1' ? TokenGetPayload<S['include'][P]> :
        P extends 'incentives' ? Array < IncentiveGetPayload<S['include'][P]>>  :
        P extends '_count' ? DozerPoolCountOutputTypeGetPayload<S['include'][P]> :  never
  } 
    : S extends { select: any } & (DozerPoolArgs | DozerPoolFindManyArgs)
      ? {
    [P in TruthyKeys<S['select']>]:
        P extends 'token0' ? TokenGetPayload<S['select'][P]> :
        P extends 'token1' ? TokenGetPayload<S['select'][P]> :
        P extends 'incentives' ? Array < IncentiveGetPayload<S['select'][P]>>  :
        P extends '_count' ? DozerPoolCountOutputTypeGetPayload<S['select'][P]> :  P extends keyof DozerPool ? DozerPool[P] : never
  } 
      : DozerPool


  type DozerPoolCountArgs = 
    Omit<DozerPoolFindManyArgs, 'select' | 'include'> & {
      select?: DozerPoolCountAggregateInputType | true
    }

  export interface DozerPoolDelegate<GlobalRejectSettings extends Prisma.RejectOnNotFound | Prisma.RejectPerOperation | false | undefined> {

    /**
     * Find zero or one DozerPool that matches the filter.
     * @param {DozerPoolFindUniqueArgs} args - Arguments to find a DozerPool
     * @example
     * // Get one DozerPool
     * const dozerPool = await prisma.dozerPool.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUnique<T extends DozerPoolFindUniqueArgs,  LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args: SelectSubset<T, DozerPoolFindUniqueArgs>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findUnique', 'DozerPool'> extends True ? Prisma__DozerPoolClient<DozerPoolGetPayload<T>> : Prisma__DozerPoolClient<DozerPoolGetPayload<T> | null, null>

    /**
     * Find one DozerPool that matches the filter or throw an error  with `error.code='P2025'` 
     *     if no matches were found.
     * @param {DozerPoolFindUniqueOrThrowArgs} args - Arguments to find a DozerPool
     * @example
     * // Get one DozerPool
     * const dozerPool = await prisma.dozerPool.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUniqueOrThrow<T extends DozerPoolFindUniqueOrThrowArgs>(
      args?: SelectSubset<T, DozerPoolFindUniqueOrThrowArgs>
    ): Prisma__DozerPoolClient<DozerPoolGetPayload<T>>

    /**
     * Find the first DozerPool that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DozerPoolFindFirstArgs} args - Arguments to find a DozerPool
     * @example
     * // Get one DozerPool
     * const dozerPool = await prisma.dozerPool.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirst<T extends DozerPoolFindFirstArgs,  LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args?: SelectSubset<T, DozerPoolFindFirstArgs>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findFirst', 'DozerPool'> extends True ? Prisma__DozerPoolClient<DozerPoolGetPayload<T>> : Prisma__DozerPoolClient<DozerPoolGetPayload<T> | null, null>

    /**
     * Find the first DozerPool that matches the filter or
     * throw `NotFoundError` if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DozerPoolFindFirstOrThrowArgs} args - Arguments to find a DozerPool
     * @example
     * // Get one DozerPool
     * const dozerPool = await prisma.dozerPool.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirstOrThrow<T extends DozerPoolFindFirstOrThrowArgs>(
      args?: SelectSubset<T, DozerPoolFindFirstOrThrowArgs>
    ): Prisma__DozerPoolClient<DozerPoolGetPayload<T>>

    /**
     * Find zero or more DozerPools that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DozerPoolFindManyArgs=} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all DozerPools
     * const dozerPools = await prisma.dozerPool.findMany()
     * 
     * // Get first 10 DozerPools
     * const dozerPools = await prisma.dozerPool.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const dozerPoolWithIdOnly = await prisma.dozerPool.findMany({ select: { id: true } })
     * 
    **/
    findMany<T extends DozerPoolFindManyArgs>(
      args?: SelectSubset<T, DozerPoolFindManyArgs>
    ): Prisma.PrismaPromise<Array<DozerPoolGetPayload<T>>>

    /**
     * Create a DozerPool.
     * @param {DozerPoolCreateArgs} args - Arguments to create a DozerPool.
     * @example
     * // Create one DozerPool
     * const DozerPool = await prisma.dozerPool.create({
     *   data: {
     *     // ... data to create a DozerPool
     *   }
     * })
     * 
    **/
    create<T extends DozerPoolCreateArgs>(
      args: SelectSubset<T, DozerPoolCreateArgs>
    ): Prisma__DozerPoolClient<DozerPoolGetPayload<T>>

    /**
     * Create many DozerPools.
     *     @param {DozerPoolCreateManyArgs} args - Arguments to create many DozerPools.
     *     @example
     *     // Create many DozerPools
     *     const dozerPool = await prisma.dozerPool.createMany({
     *       data: {
     *         // ... provide data here
     *       }
     *     })
     *     
    **/
    createMany<T extends DozerPoolCreateManyArgs>(
      args?: SelectSubset<T, DozerPoolCreateManyArgs>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a DozerPool.
     * @param {DozerPoolDeleteArgs} args - Arguments to delete one DozerPool.
     * @example
     * // Delete one DozerPool
     * const DozerPool = await prisma.dozerPool.delete({
     *   where: {
     *     // ... filter to delete one DozerPool
     *   }
     * })
     * 
    **/
    delete<T extends DozerPoolDeleteArgs>(
      args: SelectSubset<T, DozerPoolDeleteArgs>
    ): Prisma__DozerPoolClient<DozerPoolGetPayload<T>>

    /**
     * Update one DozerPool.
     * @param {DozerPoolUpdateArgs} args - Arguments to update one DozerPool.
     * @example
     * // Update one DozerPool
     * const dozerPool = await prisma.dozerPool.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    update<T extends DozerPoolUpdateArgs>(
      args: SelectSubset<T, DozerPoolUpdateArgs>
    ): Prisma__DozerPoolClient<DozerPoolGetPayload<T>>

    /**
     * Delete zero or more DozerPools.
     * @param {DozerPoolDeleteManyArgs} args - Arguments to filter DozerPools to delete.
     * @example
     * // Delete a few DozerPools
     * const { count } = await prisma.dozerPool.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
    **/
    deleteMany<T extends DozerPoolDeleteManyArgs>(
      args?: SelectSubset<T, DozerPoolDeleteManyArgs>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more DozerPools.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DozerPoolUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many DozerPools
     * const dozerPool = await prisma.dozerPool.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    updateMany<T extends DozerPoolUpdateManyArgs>(
      args: SelectSubset<T, DozerPoolUpdateManyArgs>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one DozerPool.
     * @param {DozerPoolUpsertArgs} args - Arguments to update or create a DozerPool.
     * @example
     * // Update or create a DozerPool
     * const dozerPool = await prisma.dozerPool.upsert({
     *   create: {
     *     // ... data to create a DozerPool
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the DozerPool we want to update
     *   }
     * })
    **/
    upsert<T extends DozerPoolUpsertArgs>(
      args: SelectSubset<T, DozerPoolUpsertArgs>
    ): Prisma__DozerPoolClient<DozerPoolGetPayload<T>>

    /**
     * Count the number of DozerPools.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DozerPoolCountArgs} args - Arguments to filter DozerPools to count.
     * @example
     * // Count the number of DozerPools
     * const count = await prisma.dozerPool.count({
     *   where: {
     *     // ... the filter for the DozerPools we want to count
     *   }
     * })
    **/
    count<T extends DozerPoolCountArgs>(
      args?: Subset<T, DozerPoolCountArgs>,
    ): Prisma.PrismaPromise<
      T extends _Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], DozerPoolCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a DozerPool.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DozerPoolAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends DozerPoolAggregateArgs>(args: Subset<T, DozerPoolAggregateArgs>): Prisma.PrismaPromise<GetDozerPoolAggregateType<T>>

    /**
     * Group by DozerPool.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DozerPoolGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends DozerPoolGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: DozerPoolGroupByArgs['orderBy'] }
        : { orderBy?: DozerPoolGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends TupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, DozerPoolGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDozerPoolGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>

  }

  /**
   * The delegate class that acts as a "Promise-like" for DozerPool.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export class Prisma__DozerPoolClient<T, Null = never> implements Prisma.PrismaPromise<T> {
    private readonly _dmmf;
    private readonly _queryType;
    private readonly _rootField;
    private readonly _clientMethod;
    private readonly _args;
    private readonly _dataPath;
    private readonly _errorFormat;
    private readonly _measurePerformance?;
    private _isList;
    private _callsite;
    private _requestPromise?;
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    constructor(_dmmf: runtime.DMMFClass, _queryType: 'query' | 'mutation', _rootField: string, _clientMethod: string, _args: any, _dataPath: string[], _errorFormat: ErrorFormat, _measurePerformance?: boolean | undefined, _isList?: boolean);

    token0<T extends TokenArgs= {}>(args?: Subset<T, TokenArgs>): Prisma__TokenClient<TokenGetPayload<T> | Null>;

    token1<T extends TokenArgs= {}>(args?: Subset<T, TokenArgs>): Prisma__TokenClient<TokenGetPayload<T> | Null>;

    incentives<T extends DozerPool$incentivesArgs= {}>(args?: Subset<T, DozerPool$incentivesArgs>): Prisma.PrismaPromise<Array<IncentiveGetPayload<T>>| Null>;

    private get _document();
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): Promise<T>;
  }



  // Custom InputTypes

  /**
   * DozerPool base type for findUnique actions
   */
  export type DozerPoolFindUniqueArgsBase = {
    /**
     * Select specific fields to fetch from the DozerPool
     */
    select?: DozerPoolSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: DozerPoolInclude | null
    /**
     * Filter, which DozerPool to fetch.
     */
    where: DozerPoolWhereUniqueInput
  }

  /**
   * DozerPool findUnique
   */
  export interface DozerPoolFindUniqueArgs extends DozerPoolFindUniqueArgsBase {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findUniqueOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * DozerPool findUniqueOrThrow
   */
  export type DozerPoolFindUniqueOrThrowArgs = {
    /**
     * Select specific fields to fetch from the DozerPool
     */
    select?: DozerPoolSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: DozerPoolInclude | null
    /**
     * Filter, which DozerPool to fetch.
     */
    where: DozerPoolWhereUniqueInput
  }


  /**
   * DozerPool base type for findFirst actions
   */
  export type DozerPoolFindFirstArgsBase = {
    /**
     * Select specific fields to fetch from the DozerPool
     */
    select?: DozerPoolSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: DozerPoolInclude | null
    /**
     * Filter, which DozerPool to fetch.
     */
    where?: DozerPoolWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DozerPools to fetch.
     */
    orderBy?: Enumerable<DozerPoolOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for DozerPools.
     */
    cursor?: DozerPoolWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DozerPools from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DozerPools.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of DozerPools.
     */
    distinct?: Enumerable<DozerPoolScalarFieldEnum>
  }

  /**
   * DozerPool findFirst
   */
  export interface DozerPoolFindFirstArgs extends DozerPoolFindFirstArgsBase {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findFirstOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * DozerPool findFirstOrThrow
   */
  export type DozerPoolFindFirstOrThrowArgs = {
    /**
     * Select specific fields to fetch from the DozerPool
     */
    select?: DozerPoolSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: DozerPoolInclude | null
    /**
     * Filter, which DozerPool to fetch.
     */
    where?: DozerPoolWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DozerPools to fetch.
     */
    orderBy?: Enumerable<DozerPoolOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for DozerPools.
     */
    cursor?: DozerPoolWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DozerPools from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DozerPools.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of DozerPools.
     */
    distinct?: Enumerable<DozerPoolScalarFieldEnum>
  }


  /**
   * DozerPool findMany
   */
  export type DozerPoolFindManyArgs = {
    /**
     * Select specific fields to fetch from the DozerPool
     */
    select?: DozerPoolSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: DozerPoolInclude | null
    /**
     * Filter, which DozerPools to fetch.
     */
    where?: DozerPoolWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DozerPools to fetch.
     */
    orderBy?: Enumerable<DozerPoolOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing DozerPools.
     */
    cursor?: DozerPoolWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DozerPools from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DozerPools.
     */
    skip?: number
    distinct?: Enumerable<DozerPoolScalarFieldEnum>
  }


  /**
   * DozerPool create
   */
  export type DozerPoolCreateArgs = {
    /**
     * Select specific fields to fetch from the DozerPool
     */
    select?: DozerPoolSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: DozerPoolInclude | null
    /**
     * The data needed to create a DozerPool.
     */
    data: XOR<DozerPoolCreateInput, DozerPoolUncheckedCreateInput>
  }


  /**
   * DozerPool createMany
   */
  export type DozerPoolCreateManyArgs = {
    /**
     * The data used to create many DozerPools.
     */
    data: Enumerable<DozerPoolCreateManyInput>
    skipDuplicates?: boolean
  }


  /**
   * DozerPool update
   */
  export type DozerPoolUpdateArgs = {
    /**
     * Select specific fields to fetch from the DozerPool
     */
    select?: DozerPoolSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: DozerPoolInclude | null
    /**
     * The data needed to update a DozerPool.
     */
    data: XOR<DozerPoolUpdateInput, DozerPoolUncheckedUpdateInput>
    /**
     * Choose, which DozerPool to update.
     */
    where: DozerPoolWhereUniqueInput
  }


  /**
   * DozerPool updateMany
   */
  export type DozerPoolUpdateManyArgs = {
    /**
     * The data used to update DozerPools.
     */
    data: XOR<DozerPoolUpdateManyMutationInput, DozerPoolUncheckedUpdateManyInput>
    /**
     * Filter which DozerPools to update
     */
    where?: DozerPoolWhereInput
  }


  /**
   * DozerPool upsert
   */
  export type DozerPoolUpsertArgs = {
    /**
     * Select specific fields to fetch from the DozerPool
     */
    select?: DozerPoolSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: DozerPoolInclude | null
    /**
     * The filter to search for the DozerPool to update in case it exists.
     */
    where: DozerPoolWhereUniqueInput
    /**
     * In case the DozerPool found by the `where` argument doesn't exist, create a new DozerPool with this data.
     */
    create: XOR<DozerPoolCreateInput, DozerPoolUncheckedCreateInput>
    /**
     * In case the DozerPool was found with the provided `where` argument, update it with this data.
     */
    update: XOR<DozerPoolUpdateInput, DozerPoolUncheckedUpdateInput>
  }


  /**
   * DozerPool delete
   */
  export type DozerPoolDeleteArgs = {
    /**
     * Select specific fields to fetch from the DozerPool
     */
    select?: DozerPoolSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: DozerPoolInclude | null
    /**
     * Filter which DozerPool to delete.
     */
    where: DozerPoolWhereUniqueInput
  }


  /**
   * DozerPool deleteMany
   */
  export type DozerPoolDeleteManyArgs = {
    /**
     * Filter which DozerPools to delete
     */
    where?: DozerPoolWhereInput
  }


  /**
   * DozerPool.incentives
   */
  export type DozerPool$incentivesArgs = {
    /**
     * Select specific fields to fetch from the Incentive
     */
    select?: IncentiveSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: IncentiveInclude | null
    where?: IncentiveWhereInput
    orderBy?: Enumerable<IncentiveOrderByWithRelationInput>
    cursor?: IncentiveWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Enumerable<IncentiveScalarFieldEnum>
  }


  /**
   * DozerPool without action
   */
  export type DozerPoolArgs = {
    /**
     * Select specific fields to fetch from the DozerPool
     */
    select?: DozerPoolSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: DozerPoolInclude | null
  }



  /**
   * Model Incentive
   */


  export type AggregateIncentive = {
    _count: IncentiveCountAggregateOutputType | null
    _avg: IncentiveAvgAggregateOutputType | null
    _sum: IncentiveSumAggregateOutputType | null
    _min: IncentiveMinAggregateOutputType | null
    _max: IncentiveMaxAggregateOutputType | null
  }

  export type IncentiveAvgAggregateOutputType = {
    chainId: number | null
    apr: number | null
    rewardPerDay: number | null
    pid: number | null
  }

  export type IncentiveSumAggregateOutputType = {
    chainId: number | null
    apr: number | null
    rewardPerDay: number | null
    pid: number | null
  }

  export type IncentiveMinAggregateOutputType = {
    id: string | null
    chainId: number | null
    apr: number | null
    rewardPerDay: number | null
    rewardTokenId: string | null
    poolId: string | null
    pid: number | null
    rewarderAddress: string | null
  }

  export type IncentiveMaxAggregateOutputType = {
    id: string | null
    chainId: number | null
    apr: number | null
    rewardPerDay: number | null
    rewardTokenId: string | null
    poolId: string | null
    pid: number | null
    rewarderAddress: string | null
  }

  export type IncentiveCountAggregateOutputType = {
    id: number
    chainId: number
    apr: number
    rewardPerDay: number
    rewardTokenId: number
    poolId: number
    pid: number
    rewarderAddress: number
    _all: number
  }


  export type IncentiveAvgAggregateInputType = {
    chainId?: true
    apr?: true
    rewardPerDay?: true
    pid?: true
  }

  export type IncentiveSumAggregateInputType = {
    chainId?: true
    apr?: true
    rewardPerDay?: true
    pid?: true
  }

  export type IncentiveMinAggregateInputType = {
    id?: true
    chainId?: true
    apr?: true
    rewardPerDay?: true
    rewardTokenId?: true
    poolId?: true
    pid?: true
    rewarderAddress?: true
  }

  export type IncentiveMaxAggregateInputType = {
    id?: true
    chainId?: true
    apr?: true
    rewardPerDay?: true
    rewardTokenId?: true
    poolId?: true
    pid?: true
    rewarderAddress?: true
  }

  export type IncentiveCountAggregateInputType = {
    id?: true
    chainId?: true
    apr?: true
    rewardPerDay?: true
    rewardTokenId?: true
    poolId?: true
    pid?: true
    rewarderAddress?: true
    _all?: true
  }

  export type IncentiveAggregateArgs = {
    /**
     * Filter which Incentive to aggregate.
     */
    where?: IncentiveWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Incentives to fetch.
     */
    orderBy?: Enumerable<IncentiveOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: IncentiveWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Incentives from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Incentives.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Incentives
    **/
    _count?: true | IncentiveCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: IncentiveAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: IncentiveSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: IncentiveMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: IncentiveMaxAggregateInputType
  }

  export type GetIncentiveAggregateType<T extends IncentiveAggregateArgs> = {
        [P in keyof T & keyof AggregateIncentive]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateIncentive[P]>
      : GetScalarType<T[P], AggregateIncentive[P]>
  }




  export type IncentiveGroupByArgs = {
    where?: IncentiveWhereInput
    orderBy?: Enumerable<IncentiveOrderByWithAggregationInput>
    by: IncentiveScalarFieldEnum[]
    having?: IncentiveScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: IncentiveCountAggregateInputType | true
    _avg?: IncentiveAvgAggregateInputType
    _sum?: IncentiveSumAggregateInputType
    _min?: IncentiveMinAggregateInputType
    _max?: IncentiveMaxAggregateInputType
  }


  export type IncentiveGroupByOutputType = {
    id: string
    chainId: number
    apr: number
    rewardPerDay: number
    rewardTokenId: string
    poolId: string
    pid: number
    rewarderAddress: string
    _count: IncentiveCountAggregateOutputType | null
    _avg: IncentiveAvgAggregateOutputType | null
    _sum: IncentiveSumAggregateOutputType | null
    _min: IncentiveMinAggregateOutputType | null
    _max: IncentiveMaxAggregateOutputType | null
  }

  type GetIncentiveGroupByPayload<T extends IncentiveGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickArray<IncentiveGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof IncentiveGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], IncentiveGroupByOutputType[P]>
            : GetScalarType<T[P], IncentiveGroupByOutputType[P]>
        }
      >
    >


  export type IncentiveSelect = {
    id?: boolean
    chainId?: boolean
    apr?: boolean
    rewardPerDay?: boolean
    rewardTokenId?: boolean
    poolId?: boolean
    pid?: boolean
    rewarderAddress?: boolean
    rewardToken?: boolean | TokenArgs
    pool?: boolean | DozerPoolArgs
  }


  export type IncentiveInclude = {
    rewardToken?: boolean | TokenArgs
    pool?: boolean | DozerPoolArgs
  }

  export type IncentiveGetPayload<S extends boolean | null | undefined | IncentiveArgs> =
    S extends { select: any, include: any } ? 'Please either choose `select` or `include`' :
    S extends true ? Incentive :
    S extends undefined ? never :
    S extends { include: any } & (IncentiveArgs | IncentiveFindManyArgs)
    ? Incentive  & {
    [P in TruthyKeys<S['include']>]:
        P extends 'rewardToken' ? TokenGetPayload<S['include'][P]> :
        P extends 'pool' ? DozerPoolGetPayload<S['include'][P]> :  never
  } 
    : S extends { select: any } & (IncentiveArgs | IncentiveFindManyArgs)
      ? {
    [P in TruthyKeys<S['select']>]:
        P extends 'rewardToken' ? TokenGetPayload<S['select'][P]> :
        P extends 'pool' ? DozerPoolGetPayload<S['select'][P]> :  P extends keyof Incentive ? Incentive[P] : never
  } 
      : Incentive


  type IncentiveCountArgs = 
    Omit<IncentiveFindManyArgs, 'select' | 'include'> & {
      select?: IncentiveCountAggregateInputType | true
    }

  export interface IncentiveDelegate<GlobalRejectSettings extends Prisma.RejectOnNotFound | Prisma.RejectPerOperation | false | undefined> {

    /**
     * Find zero or one Incentive that matches the filter.
     * @param {IncentiveFindUniqueArgs} args - Arguments to find a Incentive
     * @example
     * // Get one Incentive
     * const incentive = await prisma.incentive.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUnique<T extends IncentiveFindUniqueArgs,  LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args: SelectSubset<T, IncentiveFindUniqueArgs>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findUnique', 'Incentive'> extends True ? Prisma__IncentiveClient<IncentiveGetPayload<T>> : Prisma__IncentiveClient<IncentiveGetPayload<T> | null, null>

    /**
     * Find one Incentive that matches the filter or throw an error  with `error.code='P2025'` 
     *     if no matches were found.
     * @param {IncentiveFindUniqueOrThrowArgs} args - Arguments to find a Incentive
     * @example
     * // Get one Incentive
     * const incentive = await prisma.incentive.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUniqueOrThrow<T extends IncentiveFindUniqueOrThrowArgs>(
      args?: SelectSubset<T, IncentiveFindUniqueOrThrowArgs>
    ): Prisma__IncentiveClient<IncentiveGetPayload<T>>

    /**
     * Find the first Incentive that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IncentiveFindFirstArgs} args - Arguments to find a Incentive
     * @example
     * // Get one Incentive
     * const incentive = await prisma.incentive.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirst<T extends IncentiveFindFirstArgs,  LocalRejectSettings = T["rejectOnNotFound"] extends RejectOnNotFound ? T['rejectOnNotFound'] : undefined>(
      args?: SelectSubset<T, IncentiveFindFirstArgs>
    ): HasReject<GlobalRejectSettings, LocalRejectSettings, 'findFirst', 'Incentive'> extends True ? Prisma__IncentiveClient<IncentiveGetPayload<T>> : Prisma__IncentiveClient<IncentiveGetPayload<T> | null, null>

    /**
     * Find the first Incentive that matches the filter or
     * throw `NotFoundError` if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IncentiveFindFirstOrThrowArgs} args - Arguments to find a Incentive
     * @example
     * // Get one Incentive
     * const incentive = await prisma.incentive.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirstOrThrow<T extends IncentiveFindFirstOrThrowArgs>(
      args?: SelectSubset<T, IncentiveFindFirstOrThrowArgs>
    ): Prisma__IncentiveClient<IncentiveGetPayload<T>>

    /**
     * Find zero or more Incentives that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IncentiveFindManyArgs=} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Incentives
     * const incentives = await prisma.incentive.findMany()
     * 
     * // Get first 10 Incentives
     * const incentives = await prisma.incentive.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const incentiveWithIdOnly = await prisma.incentive.findMany({ select: { id: true } })
     * 
    **/
    findMany<T extends IncentiveFindManyArgs>(
      args?: SelectSubset<T, IncentiveFindManyArgs>
    ): Prisma.PrismaPromise<Array<IncentiveGetPayload<T>>>

    /**
     * Create a Incentive.
     * @param {IncentiveCreateArgs} args - Arguments to create a Incentive.
     * @example
     * // Create one Incentive
     * const Incentive = await prisma.incentive.create({
     *   data: {
     *     // ... data to create a Incentive
     *   }
     * })
     * 
    **/
    create<T extends IncentiveCreateArgs>(
      args: SelectSubset<T, IncentiveCreateArgs>
    ): Prisma__IncentiveClient<IncentiveGetPayload<T>>

    /**
     * Create many Incentives.
     *     @param {IncentiveCreateManyArgs} args - Arguments to create many Incentives.
     *     @example
     *     // Create many Incentives
     *     const incentive = await prisma.incentive.createMany({
     *       data: {
     *         // ... provide data here
     *       }
     *     })
     *     
    **/
    createMany<T extends IncentiveCreateManyArgs>(
      args?: SelectSubset<T, IncentiveCreateManyArgs>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Incentive.
     * @param {IncentiveDeleteArgs} args - Arguments to delete one Incentive.
     * @example
     * // Delete one Incentive
     * const Incentive = await prisma.incentive.delete({
     *   where: {
     *     // ... filter to delete one Incentive
     *   }
     * })
     * 
    **/
    delete<T extends IncentiveDeleteArgs>(
      args: SelectSubset<T, IncentiveDeleteArgs>
    ): Prisma__IncentiveClient<IncentiveGetPayload<T>>

    /**
     * Update one Incentive.
     * @param {IncentiveUpdateArgs} args - Arguments to update one Incentive.
     * @example
     * // Update one Incentive
     * const incentive = await prisma.incentive.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    update<T extends IncentiveUpdateArgs>(
      args: SelectSubset<T, IncentiveUpdateArgs>
    ): Prisma__IncentiveClient<IncentiveGetPayload<T>>

    /**
     * Delete zero or more Incentives.
     * @param {IncentiveDeleteManyArgs} args - Arguments to filter Incentives to delete.
     * @example
     * // Delete a few Incentives
     * const { count } = await prisma.incentive.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
    **/
    deleteMany<T extends IncentiveDeleteManyArgs>(
      args?: SelectSubset<T, IncentiveDeleteManyArgs>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Incentives.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IncentiveUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Incentives
     * const incentive = await prisma.incentive.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    updateMany<T extends IncentiveUpdateManyArgs>(
      args: SelectSubset<T, IncentiveUpdateManyArgs>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Incentive.
     * @param {IncentiveUpsertArgs} args - Arguments to update or create a Incentive.
     * @example
     * // Update or create a Incentive
     * const incentive = await prisma.incentive.upsert({
     *   create: {
     *     // ... data to create a Incentive
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Incentive we want to update
     *   }
     * })
    **/
    upsert<T extends IncentiveUpsertArgs>(
      args: SelectSubset<T, IncentiveUpsertArgs>
    ): Prisma__IncentiveClient<IncentiveGetPayload<T>>

    /**
     * Count the number of Incentives.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IncentiveCountArgs} args - Arguments to filter Incentives to count.
     * @example
     * // Count the number of Incentives
     * const count = await prisma.incentive.count({
     *   where: {
     *     // ... the filter for the Incentives we want to count
     *   }
     * })
    **/
    count<T extends IncentiveCountArgs>(
      args?: Subset<T, IncentiveCountArgs>,
    ): Prisma.PrismaPromise<
      T extends _Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], IncentiveCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Incentive.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IncentiveAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends IncentiveAggregateArgs>(args: Subset<T, IncentiveAggregateArgs>): Prisma.PrismaPromise<GetIncentiveAggregateType<T>>

    /**
     * Group by Incentive.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IncentiveGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends IncentiveGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: IncentiveGroupByArgs['orderBy'] }
        : { orderBy?: IncentiveGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends TupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, IncentiveGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetIncentiveGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>

  }

  /**
   * The delegate class that acts as a "Promise-like" for Incentive.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export class Prisma__IncentiveClient<T, Null = never> implements Prisma.PrismaPromise<T> {
    private readonly _dmmf;
    private readonly _queryType;
    private readonly _rootField;
    private readonly _clientMethod;
    private readonly _args;
    private readonly _dataPath;
    private readonly _errorFormat;
    private readonly _measurePerformance?;
    private _isList;
    private _callsite;
    private _requestPromise?;
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    constructor(_dmmf: runtime.DMMFClass, _queryType: 'query' | 'mutation', _rootField: string, _clientMethod: string, _args: any, _dataPath: string[], _errorFormat: ErrorFormat, _measurePerformance?: boolean | undefined, _isList?: boolean);

    rewardToken<T extends TokenArgs= {}>(args?: Subset<T, TokenArgs>): Prisma__TokenClient<TokenGetPayload<T> | Null>;

    pool<T extends DozerPoolArgs= {}>(args?: Subset<T, DozerPoolArgs>): Prisma__DozerPoolClient<DozerPoolGetPayload<T> | Null>;

    private get _document();
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): Promise<T>;
  }



  // Custom InputTypes

  /**
   * Incentive base type for findUnique actions
   */
  export type IncentiveFindUniqueArgsBase = {
    /**
     * Select specific fields to fetch from the Incentive
     */
    select?: IncentiveSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: IncentiveInclude | null
    /**
     * Filter, which Incentive to fetch.
     */
    where: IncentiveWhereUniqueInput
  }

  /**
   * Incentive findUnique
   */
  export interface IncentiveFindUniqueArgs extends IncentiveFindUniqueArgsBase {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findUniqueOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * Incentive findUniqueOrThrow
   */
  export type IncentiveFindUniqueOrThrowArgs = {
    /**
     * Select specific fields to fetch from the Incentive
     */
    select?: IncentiveSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: IncentiveInclude | null
    /**
     * Filter, which Incentive to fetch.
     */
    where: IncentiveWhereUniqueInput
  }


  /**
   * Incentive base type for findFirst actions
   */
  export type IncentiveFindFirstArgsBase = {
    /**
     * Select specific fields to fetch from the Incentive
     */
    select?: IncentiveSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: IncentiveInclude | null
    /**
     * Filter, which Incentive to fetch.
     */
    where?: IncentiveWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Incentives to fetch.
     */
    orderBy?: Enumerable<IncentiveOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Incentives.
     */
    cursor?: IncentiveWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Incentives from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Incentives.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Incentives.
     */
    distinct?: Enumerable<IncentiveScalarFieldEnum>
  }

  /**
   * Incentive findFirst
   */
  export interface IncentiveFindFirstArgs extends IncentiveFindFirstArgsBase {
   /**
    * Throw an Error if query returns no results
    * @deprecated since 4.0.0: use `findFirstOrThrow` method instead
    */
    rejectOnNotFound?: RejectOnNotFound
  }
      

  /**
   * Incentive findFirstOrThrow
   */
  export type IncentiveFindFirstOrThrowArgs = {
    /**
     * Select specific fields to fetch from the Incentive
     */
    select?: IncentiveSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: IncentiveInclude | null
    /**
     * Filter, which Incentive to fetch.
     */
    where?: IncentiveWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Incentives to fetch.
     */
    orderBy?: Enumerable<IncentiveOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Incentives.
     */
    cursor?: IncentiveWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Incentives from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Incentives.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Incentives.
     */
    distinct?: Enumerable<IncentiveScalarFieldEnum>
  }


  /**
   * Incentive findMany
   */
  export type IncentiveFindManyArgs = {
    /**
     * Select specific fields to fetch from the Incentive
     */
    select?: IncentiveSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: IncentiveInclude | null
    /**
     * Filter, which Incentives to fetch.
     */
    where?: IncentiveWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Incentives to fetch.
     */
    orderBy?: Enumerable<IncentiveOrderByWithRelationInput>
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Incentives.
     */
    cursor?: IncentiveWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Incentives from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Incentives.
     */
    skip?: number
    distinct?: Enumerable<IncentiveScalarFieldEnum>
  }


  /**
   * Incentive create
   */
  export type IncentiveCreateArgs = {
    /**
     * Select specific fields to fetch from the Incentive
     */
    select?: IncentiveSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: IncentiveInclude | null
    /**
     * The data needed to create a Incentive.
     */
    data: XOR<IncentiveCreateInput, IncentiveUncheckedCreateInput>
  }


  /**
   * Incentive createMany
   */
  export type IncentiveCreateManyArgs = {
    /**
     * The data used to create many Incentives.
     */
    data: Enumerable<IncentiveCreateManyInput>
    skipDuplicates?: boolean
  }


  /**
   * Incentive update
   */
  export type IncentiveUpdateArgs = {
    /**
     * Select specific fields to fetch from the Incentive
     */
    select?: IncentiveSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: IncentiveInclude | null
    /**
     * The data needed to update a Incentive.
     */
    data: XOR<IncentiveUpdateInput, IncentiveUncheckedUpdateInput>
    /**
     * Choose, which Incentive to update.
     */
    where: IncentiveWhereUniqueInput
  }


  /**
   * Incentive updateMany
   */
  export type IncentiveUpdateManyArgs = {
    /**
     * The data used to update Incentives.
     */
    data: XOR<IncentiveUpdateManyMutationInput, IncentiveUncheckedUpdateManyInput>
    /**
     * Filter which Incentives to update
     */
    where?: IncentiveWhereInput
  }


  /**
   * Incentive upsert
   */
  export type IncentiveUpsertArgs = {
    /**
     * Select specific fields to fetch from the Incentive
     */
    select?: IncentiveSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: IncentiveInclude | null
    /**
     * The filter to search for the Incentive to update in case it exists.
     */
    where: IncentiveWhereUniqueInput
    /**
     * In case the Incentive found by the `where` argument doesn't exist, create a new Incentive with this data.
     */
    create: XOR<IncentiveCreateInput, IncentiveUncheckedCreateInput>
    /**
     * In case the Incentive was found with the provided `where` argument, update it with this data.
     */
    update: XOR<IncentiveUpdateInput, IncentiveUncheckedUpdateInput>
  }


  /**
   * Incentive delete
   */
  export type IncentiveDeleteArgs = {
    /**
     * Select specific fields to fetch from the Incentive
     */
    select?: IncentiveSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: IncentiveInclude | null
    /**
     * Filter which Incentive to delete.
     */
    where: IncentiveWhereUniqueInput
  }


  /**
   * Incentive deleteMany
   */
  export type IncentiveDeleteManyArgs = {
    /**
     * Filter which Incentives to delete
     */
    where?: IncentiveWhereInput
  }


  /**
   * Incentive without action
   */
  export type IncentiveArgs = {
    /**
     * Select specific fields to fetch from the Incentive
     */
    select?: IncentiveSelect | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: IncentiveInclude | null
  }



  /**
   * Enums
   */

  // Based on
  // https://github.com/microsoft/TypeScript/issues/3192#issuecomment-261720275

  export const DaySnapshotScalarFieldEnum: {
    id: 'id',
    poolId: 'poolId',
    date: 'date',
    volumeUSD: 'volumeUSD',
    liquidityUSD: 'liquidityUSD',
    apr: 'apr'
  };

  export type DaySnapshotScalarFieldEnum = (typeof DaySnapshotScalarFieldEnum)[keyof typeof DaySnapshotScalarFieldEnum]


  export const DozerPoolScalarFieldEnum: {
    id: 'id',
    name: 'name',
    chainId: 'chainId',
    version: 'version',
    token0Id: 'token0Id',
    token1Id: 'token1Id',
    swapFee: 'swapFee',
    twapEnabled: 'twapEnabled',
    reserve0: 'reserve0',
    reserve1: 'reserve1',
    totalSupply: 'totalSupply',
    liquidityUSD: 'liquidityUSD',
    volumeUSD: 'volumeUSD',
    token0Price: 'token0Price',
    token1Price: 'token1Price',
    feeApr: 'feeApr',
    incentiveApr: 'incentiveApr',
    totalApr: 'totalApr',
    isIncentivized: 'isIncentivized',
    volume1d: 'volume1d',
    fees1d: 'fees1d',
    volume1w: 'volume1w',
    fees1w: 'fees1w',
    createdAtBlockNumber: 'createdAtBlockNumber',
    isBlacklisted: 'isBlacklisted',
    generatedAt: 'generatedAt',
    updatedAt: 'updatedAt'
  };

  export type DozerPoolScalarFieldEnum = (typeof DozerPoolScalarFieldEnum)[keyof typeof DozerPoolScalarFieldEnum]


  export const HourSnapshotScalarFieldEnum: {
    id: 'id',
    poolId: 'poolId',
    date: 'date',
    volumeUSD: 'volumeUSD',
    liquidityUSD: 'liquidityUSD',
    apr: 'apr'
  };

  export type HourSnapshotScalarFieldEnum = (typeof HourSnapshotScalarFieldEnum)[keyof typeof HourSnapshotScalarFieldEnum]


  export const IncentiveScalarFieldEnum: {
    id: 'id',
    chainId: 'chainId',
    apr: 'apr',
    rewardPerDay: 'rewardPerDay',
    rewardTokenId: 'rewardTokenId',
    poolId: 'poolId',
    pid: 'pid',
    rewarderAddress: 'rewarderAddress'
  };

  export type IncentiveScalarFieldEnum = (typeof IncentiveScalarFieldEnum)[keyof typeof IncentiveScalarFieldEnum]


  export const PoolScalarFieldEnum: {
    id: 'id',
    name: 'name',
    apr: 'apr',
    chainId: 'chainId',
    version: 'version',
    token0Id: 'token0Id',
    token1Id: 'token1Id',
    swapFee: 'swapFee',
    feeUSD: 'feeUSD',
    reserve0: 'reserve0',
    reserve1: 'reserve1',
    liquidityUSD: 'liquidityUSD',
    volumeUSD: 'volumeUSD',
    liquidity: 'liquidity',
    volume1d: 'volume1d',
    fees1d: 'fees1d',
    generatedAt: 'generatedAt',
    updatedAt: 'updatedAt'
  };

  export type PoolScalarFieldEnum = (typeof PoolScalarFieldEnum)[keyof typeof PoolScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const TokenScalarFieldEnum: {
    id: 'id',
    uuid: 'uuid',
    chainId: 'chainId',
    name: 'name',
    symbol: 'symbol',
    isFeeOnTransfer: 'isFeeOnTransfer',
    isCommon: 'isCommon',
    derivedUSD: 'derivedUSD',
    generatedAt: 'generatedAt',
    updatedAt: 'updatedAt',
    decimals: 'decimals'
  };

  export type TokenScalarFieldEnum = (typeof TokenScalarFieldEnum)[keyof typeof TokenScalarFieldEnum]


  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  /**
   * Deep Input Types
   */


  export type TokenWhereInput = {
    AND?: Enumerable<TokenWhereInput>
    OR?: Enumerable<TokenWhereInput>
    NOT?: Enumerable<TokenWhereInput>
    id?: StringFilter | string
    uuid?: StringFilter | string
    chainId?: IntFilter | number
    name?: StringFilter | string
    symbol?: StringFilter | string
    isFeeOnTransfer?: BoolFilter | boolean
    isCommon?: BoolFilter | boolean
    derivedUSD?: FloatNullableFilter | number | null
    generatedAt?: DateTimeFilter | Date | string
    updatedAt?: DateTimeFilter | Date | string
    decimals?: IntFilter | number
    pools0?: PoolListRelationFilter
    pools1?: PoolListRelationFilter
    dozerPools0?: DozerPoolListRelationFilter
    dozerPools1?: DozerPoolListRelationFilter
    incentives?: IncentiveListRelationFilter
  }

  export type TokenOrderByWithRelationInput = {
    id?: SortOrder
    uuid?: SortOrder
    chainId?: SortOrder
    name?: SortOrder
    symbol?: SortOrder
    isFeeOnTransfer?: SortOrder
    isCommon?: SortOrder
    derivedUSD?: SortOrder
    generatedAt?: SortOrder
    updatedAt?: SortOrder
    decimals?: SortOrder
    pools0?: PoolOrderByRelationAggregateInput
    pools1?: PoolOrderByRelationAggregateInput
    dozerPools0?: DozerPoolOrderByRelationAggregateInput
    dozerPools1?: DozerPoolOrderByRelationAggregateInput
    incentives?: IncentiveOrderByRelationAggregateInput
  }

  export type TokenWhereUniqueInput = {
    id?: string
    chainId_uuid?: TokenChainIdUuidCompoundUniqueInput
  }

  export type TokenOrderByWithAggregationInput = {
    id?: SortOrder
    uuid?: SortOrder
    chainId?: SortOrder
    name?: SortOrder
    symbol?: SortOrder
    isFeeOnTransfer?: SortOrder
    isCommon?: SortOrder
    derivedUSD?: SortOrder
    generatedAt?: SortOrder
    updatedAt?: SortOrder
    decimals?: SortOrder
    _count?: TokenCountOrderByAggregateInput
    _avg?: TokenAvgOrderByAggregateInput
    _max?: TokenMaxOrderByAggregateInput
    _min?: TokenMinOrderByAggregateInput
    _sum?: TokenSumOrderByAggregateInput
  }

  export type TokenScalarWhereWithAggregatesInput = {
    AND?: Enumerable<TokenScalarWhereWithAggregatesInput>
    OR?: Enumerable<TokenScalarWhereWithAggregatesInput>
    NOT?: Enumerable<TokenScalarWhereWithAggregatesInput>
    id?: StringWithAggregatesFilter | string
    uuid?: StringWithAggregatesFilter | string
    chainId?: IntWithAggregatesFilter | number
    name?: StringWithAggregatesFilter | string
    symbol?: StringWithAggregatesFilter | string
    isFeeOnTransfer?: BoolWithAggregatesFilter | boolean
    isCommon?: BoolWithAggregatesFilter | boolean
    derivedUSD?: FloatNullableWithAggregatesFilter | number | null
    generatedAt?: DateTimeWithAggregatesFilter | Date | string
    updatedAt?: DateTimeWithAggregatesFilter | Date | string
    decimals?: IntWithAggregatesFilter | number
  }

  export type PoolWhereInput = {
    AND?: Enumerable<PoolWhereInput>
    OR?: Enumerable<PoolWhereInput>
    NOT?: Enumerable<PoolWhereInput>
    id?: StringFilter | string
    name?: StringFilter | string
    apr?: FloatFilter | number
    chainId?: IntFilter | number
    version?: StringFilter | string
    token0Id?: StringFilter | string
    token1Id?: StringFilter | string
    swapFee?: FloatFilter | number
    feeUSD?: FloatFilter | number
    reserve0?: StringFilter | string
    reserve1?: StringFilter | string
    liquidityUSD?: FloatFilter | number
    volumeUSD?: FloatFilter | number
    liquidity?: FloatFilter | number
    volume1d?: FloatFilter | number
    fees1d?: FloatFilter | number
    generatedAt?: DateTimeFilter | Date | string
    updatedAt?: DateTimeFilter | Date | string
    token0?: XOR<TokenRelationFilter, TokenWhereInput>
    token1?: XOR<TokenRelationFilter, TokenWhereInput>
    daySnapshots?: DaySnapshotListRelationFilter
    hourSnapshots?: HourSnapshotListRelationFilter
  }

  export type PoolOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    apr?: SortOrder
    chainId?: SortOrder
    version?: SortOrder
    token0Id?: SortOrder
    token1Id?: SortOrder
    swapFee?: SortOrder
    feeUSD?: SortOrder
    reserve0?: SortOrder
    reserve1?: SortOrder
    liquidityUSD?: SortOrder
    volumeUSD?: SortOrder
    liquidity?: SortOrder
    volume1d?: SortOrder
    fees1d?: SortOrder
    generatedAt?: SortOrder
    updatedAt?: SortOrder
    token0?: TokenOrderByWithRelationInput
    token1?: TokenOrderByWithRelationInput
    daySnapshots?: daySnapshotOrderByRelationAggregateInput
    hourSnapshots?: hourSnapshotOrderByRelationAggregateInput
  }

  export type PoolWhereUniqueInput = {
    id?: string
  }

  export type PoolOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    apr?: SortOrder
    chainId?: SortOrder
    version?: SortOrder
    token0Id?: SortOrder
    token1Id?: SortOrder
    swapFee?: SortOrder
    feeUSD?: SortOrder
    reserve0?: SortOrder
    reserve1?: SortOrder
    liquidityUSD?: SortOrder
    volumeUSD?: SortOrder
    liquidity?: SortOrder
    volume1d?: SortOrder
    fees1d?: SortOrder
    generatedAt?: SortOrder
    updatedAt?: SortOrder
    _count?: PoolCountOrderByAggregateInput
    _avg?: PoolAvgOrderByAggregateInput
    _max?: PoolMaxOrderByAggregateInput
    _min?: PoolMinOrderByAggregateInput
    _sum?: PoolSumOrderByAggregateInput
  }

  export type PoolScalarWhereWithAggregatesInput = {
    AND?: Enumerable<PoolScalarWhereWithAggregatesInput>
    OR?: Enumerable<PoolScalarWhereWithAggregatesInput>
    NOT?: Enumerable<PoolScalarWhereWithAggregatesInput>
    id?: StringWithAggregatesFilter | string
    name?: StringWithAggregatesFilter | string
    apr?: FloatWithAggregatesFilter | number
    chainId?: IntWithAggregatesFilter | number
    version?: StringWithAggregatesFilter | string
    token0Id?: StringWithAggregatesFilter | string
    token1Id?: StringWithAggregatesFilter | string
    swapFee?: FloatWithAggregatesFilter | number
    feeUSD?: FloatWithAggregatesFilter | number
    reserve0?: StringWithAggregatesFilter | string
    reserve1?: StringWithAggregatesFilter | string
    liquidityUSD?: FloatWithAggregatesFilter | number
    volumeUSD?: FloatWithAggregatesFilter | number
    liquidity?: FloatWithAggregatesFilter | number
    volume1d?: FloatWithAggregatesFilter | number
    fees1d?: FloatWithAggregatesFilter | number
    generatedAt?: DateTimeWithAggregatesFilter | Date | string
    updatedAt?: DateTimeWithAggregatesFilter | Date | string
  }

  export type daySnapshotWhereInput = {
    AND?: Enumerable<daySnapshotWhereInput>
    OR?: Enumerable<daySnapshotWhereInput>
    NOT?: Enumerable<daySnapshotWhereInput>
    id?: IntFilter | number
    poolId?: StringFilter | string
    date?: DateTimeFilter | Date | string
    volumeUSD?: FloatFilter | number
    liquidityUSD?: FloatFilter | number
    apr?: FloatFilter | number
    pool?: XOR<PoolRelationFilter, PoolWhereInput>
  }

  export type daySnapshotOrderByWithRelationInput = {
    id?: SortOrder
    poolId?: SortOrder
    date?: SortOrder
    volumeUSD?: SortOrder
    liquidityUSD?: SortOrder
    apr?: SortOrder
    pool?: PoolOrderByWithRelationInput
  }

  export type daySnapshotWhereUniqueInput = {
    id?: number
  }

  export type daySnapshotOrderByWithAggregationInput = {
    id?: SortOrder
    poolId?: SortOrder
    date?: SortOrder
    volumeUSD?: SortOrder
    liquidityUSD?: SortOrder
    apr?: SortOrder
    _count?: daySnapshotCountOrderByAggregateInput
    _avg?: daySnapshotAvgOrderByAggregateInput
    _max?: daySnapshotMaxOrderByAggregateInput
    _min?: daySnapshotMinOrderByAggregateInput
    _sum?: daySnapshotSumOrderByAggregateInput
  }

  export type daySnapshotScalarWhereWithAggregatesInput = {
    AND?: Enumerable<daySnapshotScalarWhereWithAggregatesInput>
    OR?: Enumerable<daySnapshotScalarWhereWithAggregatesInput>
    NOT?: Enumerable<daySnapshotScalarWhereWithAggregatesInput>
    id?: IntWithAggregatesFilter | number
    poolId?: StringWithAggregatesFilter | string
    date?: DateTimeWithAggregatesFilter | Date | string
    volumeUSD?: FloatWithAggregatesFilter | number
    liquidityUSD?: FloatWithAggregatesFilter | number
    apr?: FloatWithAggregatesFilter | number
  }

  export type hourSnapshotWhereInput = {
    AND?: Enumerable<hourSnapshotWhereInput>
    OR?: Enumerable<hourSnapshotWhereInput>
    NOT?: Enumerable<hourSnapshotWhereInput>
    id?: IntFilter | number
    poolId?: StringFilter | string
    date?: DateTimeFilter | Date | string
    volumeUSD?: FloatFilter | number
    liquidityUSD?: FloatFilter | number
    apr?: FloatFilter | number
    pool?: XOR<PoolRelationFilter, PoolWhereInput>
  }

  export type hourSnapshotOrderByWithRelationInput = {
    id?: SortOrder
    poolId?: SortOrder
    date?: SortOrder
    volumeUSD?: SortOrder
    liquidityUSD?: SortOrder
    apr?: SortOrder
    pool?: PoolOrderByWithRelationInput
  }

  export type hourSnapshotWhereUniqueInput = {
    id?: number
  }

  export type hourSnapshotOrderByWithAggregationInput = {
    id?: SortOrder
    poolId?: SortOrder
    date?: SortOrder
    volumeUSD?: SortOrder
    liquidityUSD?: SortOrder
    apr?: SortOrder
    _count?: hourSnapshotCountOrderByAggregateInput
    _avg?: hourSnapshotAvgOrderByAggregateInput
    _max?: hourSnapshotMaxOrderByAggregateInput
    _min?: hourSnapshotMinOrderByAggregateInput
    _sum?: hourSnapshotSumOrderByAggregateInput
  }

  export type hourSnapshotScalarWhereWithAggregatesInput = {
    AND?: Enumerable<hourSnapshotScalarWhereWithAggregatesInput>
    OR?: Enumerable<hourSnapshotScalarWhereWithAggregatesInput>
    NOT?: Enumerable<hourSnapshotScalarWhereWithAggregatesInput>
    id?: IntWithAggregatesFilter | number
    poolId?: StringWithAggregatesFilter | string
    date?: DateTimeWithAggregatesFilter | Date | string
    volumeUSD?: FloatWithAggregatesFilter | number
    liquidityUSD?: FloatWithAggregatesFilter | number
    apr?: FloatWithAggregatesFilter | number
  }

  export type DozerPoolWhereInput = {
    AND?: Enumerable<DozerPoolWhereInput>
    OR?: Enumerable<DozerPoolWhereInput>
    NOT?: Enumerable<DozerPoolWhereInput>
    id?: StringFilter | string
    name?: StringFilter | string
    chainId?: IntFilter | number
    version?: StringFilter | string
    token0Id?: StringFilter | string
    token1Id?: StringFilter | string
    swapFee?: FloatFilter | number
    twapEnabled?: BoolFilter | boolean
    reserve0?: StringFilter | string
    reserve1?: StringFilter | string
    totalSupply?: StringFilter | string
    liquidityUSD?: FloatFilter | number
    volumeUSD?: FloatFilter | number
    token0Price?: StringFilter | string
    token1Price?: StringFilter | string
    feeApr?: FloatFilter | number
    incentiveApr?: FloatFilter | number
    totalApr?: FloatFilter | number
    isIncentivized?: BoolFilter | boolean
    volume1d?: FloatFilter | number
    fees1d?: FloatFilter | number
    volume1w?: FloatFilter | number
    fees1w?: FloatFilter | number
    createdAtBlockNumber?: BigIntFilter | bigint | number
    isBlacklisted?: BoolFilter | boolean
    generatedAt?: DateTimeFilter | Date | string
    updatedAt?: DateTimeFilter | Date | string
    token0?: XOR<TokenRelationFilter, TokenWhereInput>
    token1?: XOR<TokenRelationFilter, TokenWhereInput>
    incentives?: IncentiveListRelationFilter
  }

  export type DozerPoolOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    chainId?: SortOrder
    version?: SortOrder
    token0Id?: SortOrder
    token1Id?: SortOrder
    swapFee?: SortOrder
    twapEnabled?: SortOrder
    reserve0?: SortOrder
    reserve1?: SortOrder
    totalSupply?: SortOrder
    liquidityUSD?: SortOrder
    volumeUSD?: SortOrder
    token0Price?: SortOrder
    token1Price?: SortOrder
    feeApr?: SortOrder
    incentiveApr?: SortOrder
    totalApr?: SortOrder
    isIncentivized?: SortOrder
    volume1d?: SortOrder
    fees1d?: SortOrder
    volume1w?: SortOrder
    fees1w?: SortOrder
    createdAtBlockNumber?: SortOrder
    isBlacklisted?: SortOrder
    generatedAt?: SortOrder
    updatedAt?: SortOrder
    token0?: TokenOrderByWithRelationInput
    token1?: TokenOrderByWithRelationInput
    incentives?: IncentiveOrderByRelationAggregateInput
  }

  export type DozerPoolWhereUniqueInput = {
    id?: string
  }

  export type DozerPoolOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    chainId?: SortOrder
    version?: SortOrder
    token0Id?: SortOrder
    token1Id?: SortOrder
    swapFee?: SortOrder
    twapEnabled?: SortOrder
    reserve0?: SortOrder
    reserve1?: SortOrder
    totalSupply?: SortOrder
    liquidityUSD?: SortOrder
    volumeUSD?: SortOrder
    token0Price?: SortOrder
    token1Price?: SortOrder
    feeApr?: SortOrder
    incentiveApr?: SortOrder
    totalApr?: SortOrder
    isIncentivized?: SortOrder
    volume1d?: SortOrder
    fees1d?: SortOrder
    volume1w?: SortOrder
    fees1w?: SortOrder
    createdAtBlockNumber?: SortOrder
    isBlacklisted?: SortOrder
    generatedAt?: SortOrder
    updatedAt?: SortOrder
    _count?: DozerPoolCountOrderByAggregateInput
    _avg?: DozerPoolAvgOrderByAggregateInput
    _max?: DozerPoolMaxOrderByAggregateInput
    _min?: DozerPoolMinOrderByAggregateInput
    _sum?: DozerPoolSumOrderByAggregateInput
  }

  export type DozerPoolScalarWhereWithAggregatesInput = {
    AND?: Enumerable<DozerPoolScalarWhereWithAggregatesInput>
    OR?: Enumerable<DozerPoolScalarWhereWithAggregatesInput>
    NOT?: Enumerable<DozerPoolScalarWhereWithAggregatesInput>
    id?: StringWithAggregatesFilter | string
    name?: StringWithAggregatesFilter | string
    chainId?: IntWithAggregatesFilter | number
    version?: StringWithAggregatesFilter | string
    token0Id?: StringWithAggregatesFilter | string
    token1Id?: StringWithAggregatesFilter | string
    swapFee?: FloatWithAggregatesFilter | number
    twapEnabled?: BoolWithAggregatesFilter | boolean
    reserve0?: StringWithAggregatesFilter | string
    reserve1?: StringWithAggregatesFilter | string
    totalSupply?: StringWithAggregatesFilter | string
    liquidityUSD?: FloatWithAggregatesFilter | number
    volumeUSD?: FloatWithAggregatesFilter | number
    token0Price?: StringWithAggregatesFilter | string
    token1Price?: StringWithAggregatesFilter | string
    feeApr?: FloatWithAggregatesFilter | number
    incentiveApr?: FloatWithAggregatesFilter | number
    totalApr?: FloatWithAggregatesFilter | number
    isIncentivized?: BoolWithAggregatesFilter | boolean
    volume1d?: FloatWithAggregatesFilter | number
    fees1d?: FloatWithAggregatesFilter | number
    volume1w?: FloatWithAggregatesFilter | number
    fees1w?: FloatWithAggregatesFilter | number
    createdAtBlockNumber?: BigIntWithAggregatesFilter | bigint | number
    isBlacklisted?: BoolWithAggregatesFilter | boolean
    generatedAt?: DateTimeWithAggregatesFilter | Date | string
    updatedAt?: DateTimeWithAggregatesFilter | Date | string
  }

  export type IncentiveWhereInput = {
    AND?: Enumerable<IncentiveWhereInput>
    OR?: Enumerable<IncentiveWhereInput>
    NOT?: Enumerable<IncentiveWhereInput>
    id?: StringFilter | string
    chainId?: IntFilter | number
    apr?: FloatFilter | number
    rewardPerDay?: FloatFilter | number
    rewardTokenId?: StringFilter | string
    poolId?: StringFilter | string
    pid?: IntFilter | number
    rewarderAddress?: StringFilter | string
    rewardToken?: XOR<TokenRelationFilter, TokenWhereInput>
    pool?: XOR<DozerPoolRelationFilter, DozerPoolWhereInput>
  }

  export type IncentiveOrderByWithRelationInput = {
    id?: SortOrder
    chainId?: SortOrder
    apr?: SortOrder
    rewardPerDay?: SortOrder
    rewardTokenId?: SortOrder
    poolId?: SortOrder
    pid?: SortOrder
    rewarderAddress?: SortOrder
    rewardToken?: TokenOrderByWithRelationInput
    pool?: DozerPoolOrderByWithRelationInput
  }

  export type IncentiveWhereUniqueInput = {
    id?: string
  }

  export type IncentiveOrderByWithAggregationInput = {
    id?: SortOrder
    chainId?: SortOrder
    apr?: SortOrder
    rewardPerDay?: SortOrder
    rewardTokenId?: SortOrder
    poolId?: SortOrder
    pid?: SortOrder
    rewarderAddress?: SortOrder
    _count?: IncentiveCountOrderByAggregateInput
    _avg?: IncentiveAvgOrderByAggregateInput
    _max?: IncentiveMaxOrderByAggregateInput
    _min?: IncentiveMinOrderByAggregateInput
    _sum?: IncentiveSumOrderByAggregateInput
  }

  export type IncentiveScalarWhereWithAggregatesInput = {
    AND?: Enumerable<IncentiveScalarWhereWithAggregatesInput>
    OR?: Enumerable<IncentiveScalarWhereWithAggregatesInput>
    NOT?: Enumerable<IncentiveScalarWhereWithAggregatesInput>
    id?: StringWithAggregatesFilter | string
    chainId?: IntWithAggregatesFilter | number
    apr?: FloatWithAggregatesFilter | number
    rewardPerDay?: FloatWithAggregatesFilter | number
    rewardTokenId?: StringWithAggregatesFilter | string
    poolId?: StringWithAggregatesFilter | string
    pid?: IntWithAggregatesFilter | number
    rewarderAddress?: StringWithAggregatesFilter | string
  }

  export type TokenCreateInput = {
    id: string
    uuid: string
    chainId: number
    name: string
    symbol: string
    isFeeOnTransfer?: boolean
    isCommon?: boolean
    derivedUSD?: number | null
    generatedAt?: Date | string
    updatedAt?: Date | string
    decimals?: number
    pools0?: PoolCreateNestedManyWithoutToken0Input
    pools1?: PoolCreateNestedManyWithoutToken1Input
    dozerPools0?: DozerPoolCreateNestedManyWithoutToken0Input
    dozerPools1?: DozerPoolCreateNestedManyWithoutToken1Input
    incentives?: IncentiveCreateNestedManyWithoutRewardTokenInput
  }

  export type TokenUncheckedCreateInput = {
    id: string
    uuid: string
    chainId: number
    name: string
    symbol: string
    isFeeOnTransfer?: boolean
    isCommon?: boolean
    derivedUSD?: number | null
    generatedAt?: Date | string
    updatedAt?: Date | string
    decimals?: number
    pools0?: PoolUncheckedCreateNestedManyWithoutToken0Input
    pools1?: PoolUncheckedCreateNestedManyWithoutToken1Input
    dozerPools0?: DozerPoolUncheckedCreateNestedManyWithoutToken0Input
    dozerPools1?: DozerPoolUncheckedCreateNestedManyWithoutToken1Input
    incentives?: IncentiveUncheckedCreateNestedManyWithoutRewardTokenInput
  }

  export type TokenUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    uuid?: StringFieldUpdateOperationsInput | string
    chainId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    isFeeOnTransfer?: BoolFieldUpdateOperationsInput | boolean
    isCommon?: BoolFieldUpdateOperationsInput | boolean
    derivedUSD?: NullableFloatFieldUpdateOperationsInput | number | null
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    decimals?: IntFieldUpdateOperationsInput | number
    pools0?: PoolUpdateManyWithoutToken0NestedInput
    pools1?: PoolUpdateManyWithoutToken1NestedInput
    dozerPools0?: DozerPoolUpdateManyWithoutToken0NestedInput
    dozerPools1?: DozerPoolUpdateManyWithoutToken1NestedInput
    incentives?: IncentiveUpdateManyWithoutRewardTokenNestedInput
  }

  export type TokenUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    uuid?: StringFieldUpdateOperationsInput | string
    chainId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    isFeeOnTransfer?: BoolFieldUpdateOperationsInput | boolean
    isCommon?: BoolFieldUpdateOperationsInput | boolean
    derivedUSD?: NullableFloatFieldUpdateOperationsInput | number | null
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    decimals?: IntFieldUpdateOperationsInput | number
    pools0?: PoolUncheckedUpdateManyWithoutToken0NestedInput
    pools1?: PoolUncheckedUpdateManyWithoutToken1NestedInput
    dozerPools0?: DozerPoolUncheckedUpdateManyWithoutToken0NestedInput
    dozerPools1?: DozerPoolUncheckedUpdateManyWithoutToken1NestedInput
    incentives?: IncentiveUncheckedUpdateManyWithoutRewardTokenNestedInput
  }

  export type TokenCreateManyInput = {
    id: string
    uuid: string
    chainId: number
    name: string
    symbol: string
    isFeeOnTransfer?: boolean
    isCommon?: boolean
    derivedUSD?: number | null
    generatedAt?: Date | string
    updatedAt?: Date | string
    decimals?: number
  }

  export type TokenUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    uuid?: StringFieldUpdateOperationsInput | string
    chainId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    isFeeOnTransfer?: BoolFieldUpdateOperationsInput | boolean
    isCommon?: BoolFieldUpdateOperationsInput | boolean
    derivedUSD?: NullableFloatFieldUpdateOperationsInput | number | null
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    decimals?: IntFieldUpdateOperationsInput | number
  }

  export type TokenUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    uuid?: StringFieldUpdateOperationsInput | string
    chainId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    isFeeOnTransfer?: BoolFieldUpdateOperationsInput | boolean
    isCommon?: BoolFieldUpdateOperationsInput | boolean
    derivedUSD?: NullableFloatFieldUpdateOperationsInput | number | null
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    decimals?: IntFieldUpdateOperationsInput | number
  }

  export type PoolCreateInput = {
    id: string
    name: string
    apr: number
    chainId: number
    version: string
    swapFee: number
    feeUSD: number
    reserve0?: string
    reserve1?: string
    liquidityUSD: number
    volumeUSD: number
    liquidity: number
    volume1d: number
    fees1d: number
    generatedAt?: Date | string
    updatedAt?: Date | string
    token0: TokenCreateNestedOneWithoutPools0Input
    token1: TokenCreateNestedOneWithoutPools1Input
    daySnapshots?: daySnapshotCreateNestedManyWithoutPoolInput
    hourSnapshots?: hourSnapshotCreateNestedManyWithoutPoolInput
  }

  export type PoolUncheckedCreateInput = {
    id: string
    name: string
    apr: number
    chainId: number
    version: string
    token0Id: string
    token1Id: string
    swapFee: number
    feeUSD: number
    reserve0?: string
    reserve1?: string
    liquidityUSD: number
    volumeUSD: number
    liquidity: number
    volume1d: number
    fees1d: number
    generatedAt?: Date | string
    updatedAt?: Date | string
    daySnapshots?: daySnapshotUncheckedCreateNestedManyWithoutPoolInput
    hourSnapshots?: hourSnapshotUncheckedCreateNestedManyWithoutPoolInput
  }

  export type PoolUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    apr?: FloatFieldUpdateOperationsInput | number
    chainId?: IntFieldUpdateOperationsInput | number
    version?: StringFieldUpdateOperationsInput | string
    swapFee?: FloatFieldUpdateOperationsInput | number
    feeUSD?: FloatFieldUpdateOperationsInput | number
    reserve0?: StringFieldUpdateOperationsInput | string
    reserve1?: StringFieldUpdateOperationsInput | string
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    liquidity?: FloatFieldUpdateOperationsInput | number
    volume1d?: FloatFieldUpdateOperationsInput | number
    fees1d?: FloatFieldUpdateOperationsInput | number
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    token0?: TokenUpdateOneRequiredWithoutPools0NestedInput
    token1?: TokenUpdateOneRequiredWithoutPools1NestedInput
    daySnapshots?: daySnapshotUpdateManyWithoutPoolNestedInput
    hourSnapshots?: hourSnapshotUpdateManyWithoutPoolNestedInput
  }

  export type PoolUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    apr?: FloatFieldUpdateOperationsInput | number
    chainId?: IntFieldUpdateOperationsInput | number
    version?: StringFieldUpdateOperationsInput | string
    token0Id?: StringFieldUpdateOperationsInput | string
    token1Id?: StringFieldUpdateOperationsInput | string
    swapFee?: FloatFieldUpdateOperationsInput | number
    feeUSD?: FloatFieldUpdateOperationsInput | number
    reserve0?: StringFieldUpdateOperationsInput | string
    reserve1?: StringFieldUpdateOperationsInput | string
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    liquidity?: FloatFieldUpdateOperationsInput | number
    volume1d?: FloatFieldUpdateOperationsInput | number
    fees1d?: FloatFieldUpdateOperationsInput | number
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    daySnapshots?: daySnapshotUncheckedUpdateManyWithoutPoolNestedInput
    hourSnapshots?: hourSnapshotUncheckedUpdateManyWithoutPoolNestedInput
  }

  export type PoolCreateManyInput = {
    id: string
    name: string
    apr: number
    chainId: number
    version: string
    token0Id: string
    token1Id: string
    swapFee: number
    feeUSD: number
    reserve0?: string
    reserve1?: string
    liquidityUSD: number
    volumeUSD: number
    liquidity: number
    volume1d: number
    fees1d: number
    generatedAt?: Date | string
    updatedAt?: Date | string
  }

  export type PoolUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    apr?: FloatFieldUpdateOperationsInput | number
    chainId?: IntFieldUpdateOperationsInput | number
    version?: StringFieldUpdateOperationsInput | string
    swapFee?: FloatFieldUpdateOperationsInput | number
    feeUSD?: FloatFieldUpdateOperationsInput | number
    reserve0?: StringFieldUpdateOperationsInput | string
    reserve1?: StringFieldUpdateOperationsInput | string
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    liquidity?: FloatFieldUpdateOperationsInput | number
    volume1d?: FloatFieldUpdateOperationsInput | number
    fees1d?: FloatFieldUpdateOperationsInput | number
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PoolUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    apr?: FloatFieldUpdateOperationsInput | number
    chainId?: IntFieldUpdateOperationsInput | number
    version?: StringFieldUpdateOperationsInput | string
    token0Id?: StringFieldUpdateOperationsInput | string
    token1Id?: StringFieldUpdateOperationsInput | string
    swapFee?: FloatFieldUpdateOperationsInput | number
    feeUSD?: FloatFieldUpdateOperationsInput | number
    reserve0?: StringFieldUpdateOperationsInput | string
    reserve1?: StringFieldUpdateOperationsInput | string
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    liquidity?: FloatFieldUpdateOperationsInput | number
    volume1d?: FloatFieldUpdateOperationsInput | number
    fees1d?: FloatFieldUpdateOperationsInput | number
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type daySnapshotCreateInput = {
    date: Date | string
    volumeUSD: number
    liquidityUSD: number
    apr: number
    pool: PoolCreateNestedOneWithoutDaySnapshotsInput
  }

  export type daySnapshotUncheckedCreateInput = {
    id?: number
    poolId: string
    date: Date | string
    volumeUSD: number
    liquidityUSD: number
    apr: number
  }

  export type daySnapshotUpdateInput = {
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    apr?: FloatFieldUpdateOperationsInput | number
    pool?: PoolUpdateOneRequiredWithoutDaySnapshotsNestedInput
  }

  export type daySnapshotUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    poolId?: StringFieldUpdateOperationsInput | string
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    apr?: FloatFieldUpdateOperationsInput | number
  }

  export type daySnapshotCreateManyInput = {
    id?: number
    poolId: string
    date: Date | string
    volumeUSD: number
    liquidityUSD: number
    apr: number
  }

  export type daySnapshotUpdateManyMutationInput = {
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    apr?: FloatFieldUpdateOperationsInput | number
  }

  export type daySnapshotUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    poolId?: StringFieldUpdateOperationsInput | string
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    apr?: FloatFieldUpdateOperationsInput | number
  }

  export type hourSnapshotCreateInput = {
    date: Date | string
    volumeUSD: number
    liquidityUSD: number
    apr: number
    pool: PoolCreateNestedOneWithoutHourSnapshotsInput
  }

  export type hourSnapshotUncheckedCreateInput = {
    id?: number
    poolId: string
    date: Date | string
    volumeUSD: number
    liquidityUSD: number
    apr: number
  }

  export type hourSnapshotUpdateInput = {
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    apr?: FloatFieldUpdateOperationsInput | number
    pool?: PoolUpdateOneRequiredWithoutHourSnapshotsNestedInput
  }

  export type hourSnapshotUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    poolId?: StringFieldUpdateOperationsInput | string
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    apr?: FloatFieldUpdateOperationsInput | number
  }

  export type hourSnapshotCreateManyInput = {
    id?: number
    poolId: string
    date: Date | string
    volumeUSD: number
    liquidityUSD: number
    apr: number
  }

  export type hourSnapshotUpdateManyMutationInput = {
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    apr?: FloatFieldUpdateOperationsInput | number
  }

  export type hourSnapshotUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    poolId?: StringFieldUpdateOperationsInput | string
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    apr?: FloatFieldUpdateOperationsInput | number
  }

  export type DozerPoolCreateInput = {
    id: string
    name: string
    chainId: number
    version: string
    swapFee: number
    twapEnabled: boolean
    reserve0: string
    reserve1: string
    totalSupply: string
    liquidityUSD: number
    volumeUSD: number
    token0Price: string
    token1Price: string
    feeApr?: number
    incentiveApr?: number
    totalApr?: number
    isIncentivized?: boolean
    volume1d?: number
    fees1d?: number
    volume1w?: number
    fees1w?: number
    createdAtBlockNumber: bigint | number
    isBlacklisted?: boolean
    generatedAt?: Date | string
    updatedAt?: Date | string
    token0: TokenCreateNestedOneWithoutDozerPools0Input
    token1: TokenCreateNestedOneWithoutDozerPools1Input
    incentives?: IncentiveCreateNestedManyWithoutPoolInput
  }

  export type DozerPoolUncheckedCreateInput = {
    id: string
    name: string
    chainId: number
    version: string
    token0Id: string
    token1Id: string
    swapFee: number
    twapEnabled: boolean
    reserve0: string
    reserve1: string
    totalSupply: string
    liquidityUSD: number
    volumeUSD: number
    token0Price: string
    token1Price: string
    feeApr?: number
    incentiveApr?: number
    totalApr?: number
    isIncentivized?: boolean
    volume1d?: number
    fees1d?: number
    volume1w?: number
    fees1w?: number
    createdAtBlockNumber: bigint | number
    isBlacklisted?: boolean
    generatedAt?: Date | string
    updatedAt?: Date | string
    incentives?: IncentiveUncheckedCreateNestedManyWithoutPoolInput
  }

  export type DozerPoolUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    chainId?: IntFieldUpdateOperationsInput | number
    version?: StringFieldUpdateOperationsInput | string
    swapFee?: FloatFieldUpdateOperationsInput | number
    twapEnabled?: BoolFieldUpdateOperationsInput | boolean
    reserve0?: StringFieldUpdateOperationsInput | string
    reserve1?: StringFieldUpdateOperationsInput | string
    totalSupply?: StringFieldUpdateOperationsInput | string
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    token0Price?: StringFieldUpdateOperationsInput | string
    token1Price?: StringFieldUpdateOperationsInput | string
    feeApr?: FloatFieldUpdateOperationsInput | number
    incentiveApr?: FloatFieldUpdateOperationsInput | number
    totalApr?: FloatFieldUpdateOperationsInput | number
    isIncentivized?: BoolFieldUpdateOperationsInput | boolean
    volume1d?: FloatFieldUpdateOperationsInput | number
    fees1d?: FloatFieldUpdateOperationsInput | number
    volume1w?: FloatFieldUpdateOperationsInput | number
    fees1w?: FloatFieldUpdateOperationsInput | number
    createdAtBlockNumber?: BigIntFieldUpdateOperationsInput | bigint | number
    isBlacklisted?: BoolFieldUpdateOperationsInput | boolean
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    token0?: TokenUpdateOneRequiredWithoutDozerPools0NestedInput
    token1?: TokenUpdateOneRequiredWithoutDozerPools1NestedInput
    incentives?: IncentiveUpdateManyWithoutPoolNestedInput
  }

  export type DozerPoolUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    chainId?: IntFieldUpdateOperationsInput | number
    version?: StringFieldUpdateOperationsInput | string
    token0Id?: StringFieldUpdateOperationsInput | string
    token1Id?: StringFieldUpdateOperationsInput | string
    swapFee?: FloatFieldUpdateOperationsInput | number
    twapEnabled?: BoolFieldUpdateOperationsInput | boolean
    reserve0?: StringFieldUpdateOperationsInput | string
    reserve1?: StringFieldUpdateOperationsInput | string
    totalSupply?: StringFieldUpdateOperationsInput | string
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    token0Price?: StringFieldUpdateOperationsInput | string
    token1Price?: StringFieldUpdateOperationsInput | string
    feeApr?: FloatFieldUpdateOperationsInput | number
    incentiveApr?: FloatFieldUpdateOperationsInput | number
    totalApr?: FloatFieldUpdateOperationsInput | number
    isIncentivized?: BoolFieldUpdateOperationsInput | boolean
    volume1d?: FloatFieldUpdateOperationsInput | number
    fees1d?: FloatFieldUpdateOperationsInput | number
    volume1w?: FloatFieldUpdateOperationsInput | number
    fees1w?: FloatFieldUpdateOperationsInput | number
    createdAtBlockNumber?: BigIntFieldUpdateOperationsInput | bigint | number
    isBlacklisted?: BoolFieldUpdateOperationsInput | boolean
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    incentives?: IncentiveUncheckedUpdateManyWithoutPoolNestedInput
  }

  export type DozerPoolCreateManyInput = {
    id: string
    name: string
    chainId: number
    version: string
    token0Id: string
    token1Id: string
    swapFee: number
    twapEnabled: boolean
    reserve0: string
    reserve1: string
    totalSupply: string
    liquidityUSD: number
    volumeUSD: number
    token0Price: string
    token1Price: string
    feeApr?: number
    incentiveApr?: number
    totalApr?: number
    isIncentivized?: boolean
    volume1d?: number
    fees1d?: number
    volume1w?: number
    fees1w?: number
    createdAtBlockNumber: bigint | number
    isBlacklisted?: boolean
    generatedAt?: Date | string
    updatedAt?: Date | string
  }

  export type DozerPoolUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    chainId?: IntFieldUpdateOperationsInput | number
    version?: StringFieldUpdateOperationsInput | string
    swapFee?: FloatFieldUpdateOperationsInput | number
    twapEnabled?: BoolFieldUpdateOperationsInput | boolean
    reserve0?: StringFieldUpdateOperationsInput | string
    reserve1?: StringFieldUpdateOperationsInput | string
    totalSupply?: StringFieldUpdateOperationsInput | string
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    token0Price?: StringFieldUpdateOperationsInput | string
    token1Price?: StringFieldUpdateOperationsInput | string
    feeApr?: FloatFieldUpdateOperationsInput | number
    incentiveApr?: FloatFieldUpdateOperationsInput | number
    totalApr?: FloatFieldUpdateOperationsInput | number
    isIncentivized?: BoolFieldUpdateOperationsInput | boolean
    volume1d?: FloatFieldUpdateOperationsInput | number
    fees1d?: FloatFieldUpdateOperationsInput | number
    volume1w?: FloatFieldUpdateOperationsInput | number
    fees1w?: FloatFieldUpdateOperationsInput | number
    createdAtBlockNumber?: BigIntFieldUpdateOperationsInput | bigint | number
    isBlacklisted?: BoolFieldUpdateOperationsInput | boolean
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DozerPoolUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    chainId?: IntFieldUpdateOperationsInput | number
    version?: StringFieldUpdateOperationsInput | string
    token0Id?: StringFieldUpdateOperationsInput | string
    token1Id?: StringFieldUpdateOperationsInput | string
    swapFee?: FloatFieldUpdateOperationsInput | number
    twapEnabled?: BoolFieldUpdateOperationsInput | boolean
    reserve0?: StringFieldUpdateOperationsInput | string
    reserve1?: StringFieldUpdateOperationsInput | string
    totalSupply?: StringFieldUpdateOperationsInput | string
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    token0Price?: StringFieldUpdateOperationsInput | string
    token1Price?: StringFieldUpdateOperationsInput | string
    feeApr?: FloatFieldUpdateOperationsInput | number
    incentiveApr?: FloatFieldUpdateOperationsInput | number
    totalApr?: FloatFieldUpdateOperationsInput | number
    isIncentivized?: BoolFieldUpdateOperationsInput | boolean
    volume1d?: FloatFieldUpdateOperationsInput | number
    fees1d?: FloatFieldUpdateOperationsInput | number
    volume1w?: FloatFieldUpdateOperationsInput | number
    fees1w?: FloatFieldUpdateOperationsInput | number
    createdAtBlockNumber?: BigIntFieldUpdateOperationsInput | bigint | number
    isBlacklisted?: BoolFieldUpdateOperationsInput | boolean
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IncentiveCreateInput = {
    id: string
    chainId: number
    apr: number
    rewardPerDay: number
    pid: number
    rewarderAddress: string
    rewardToken: TokenCreateNestedOneWithoutIncentivesInput
    pool: DozerPoolCreateNestedOneWithoutIncentivesInput
  }

  export type IncentiveUncheckedCreateInput = {
    id: string
    chainId: number
    apr: number
    rewardPerDay: number
    rewardTokenId: string
    poolId: string
    pid: number
    rewarderAddress: string
  }

  export type IncentiveUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    chainId?: IntFieldUpdateOperationsInput | number
    apr?: FloatFieldUpdateOperationsInput | number
    rewardPerDay?: FloatFieldUpdateOperationsInput | number
    pid?: IntFieldUpdateOperationsInput | number
    rewarderAddress?: StringFieldUpdateOperationsInput | string
    rewardToken?: TokenUpdateOneRequiredWithoutIncentivesNestedInput
    pool?: DozerPoolUpdateOneRequiredWithoutIncentivesNestedInput
  }

  export type IncentiveUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    chainId?: IntFieldUpdateOperationsInput | number
    apr?: FloatFieldUpdateOperationsInput | number
    rewardPerDay?: FloatFieldUpdateOperationsInput | number
    rewardTokenId?: StringFieldUpdateOperationsInput | string
    poolId?: StringFieldUpdateOperationsInput | string
    pid?: IntFieldUpdateOperationsInput | number
    rewarderAddress?: StringFieldUpdateOperationsInput | string
  }

  export type IncentiveCreateManyInput = {
    id: string
    chainId: number
    apr: number
    rewardPerDay: number
    rewardTokenId: string
    poolId: string
    pid: number
    rewarderAddress: string
  }

  export type IncentiveUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    chainId?: IntFieldUpdateOperationsInput | number
    apr?: FloatFieldUpdateOperationsInput | number
    rewardPerDay?: FloatFieldUpdateOperationsInput | number
    pid?: IntFieldUpdateOperationsInput | number
    rewarderAddress?: StringFieldUpdateOperationsInput | string
  }

  export type IncentiveUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    chainId?: IntFieldUpdateOperationsInput | number
    apr?: FloatFieldUpdateOperationsInput | number
    rewardPerDay?: FloatFieldUpdateOperationsInput | number
    rewardTokenId?: StringFieldUpdateOperationsInput | string
    poolId?: StringFieldUpdateOperationsInput | string
    pid?: IntFieldUpdateOperationsInput | number
    rewarderAddress?: StringFieldUpdateOperationsInput | string
  }

  export type StringFilter = {
    equals?: string
    in?: Enumerable<string>
    notIn?: Enumerable<string>
    lt?: string
    lte?: string
    gt?: string
    gte?: string
    contains?: string
    startsWith?: string
    endsWith?: string
    not?: NestedStringFilter | string
  }

  export type IntFilter = {
    equals?: number
    in?: Enumerable<number>
    notIn?: Enumerable<number>
    lt?: number
    lte?: number
    gt?: number
    gte?: number
    not?: NestedIntFilter | number
  }

  export type BoolFilter = {
    equals?: boolean
    not?: NestedBoolFilter | boolean
  }

  export type FloatNullableFilter = {
    equals?: number | null
    in?: Enumerable<number> | null
    notIn?: Enumerable<number> | null
    lt?: number
    lte?: number
    gt?: number
    gte?: number
    not?: NestedFloatNullableFilter | number | null
  }

  export type DateTimeFilter = {
    equals?: Date | string
    in?: Enumerable<Date> | Enumerable<string>
    notIn?: Enumerable<Date> | Enumerable<string>
    lt?: Date | string
    lte?: Date | string
    gt?: Date | string
    gte?: Date | string
    not?: NestedDateTimeFilter | Date | string
  }

  export type PoolListRelationFilter = {
    every?: PoolWhereInput
    some?: PoolWhereInput
    none?: PoolWhereInput
  }

  export type DozerPoolListRelationFilter = {
    every?: DozerPoolWhereInput
    some?: DozerPoolWhereInput
    none?: DozerPoolWhereInput
  }

  export type IncentiveListRelationFilter = {
    every?: IncentiveWhereInput
    some?: IncentiveWhereInput
    none?: IncentiveWhereInput
  }

  export type PoolOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type DozerPoolOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type IncentiveOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TokenChainIdUuidCompoundUniqueInput = {
    chainId: number
    uuid: string
  }

  export type TokenCountOrderByAggregateInput = {
    id?: SortOrder
    uuid?: SortOrder
    chainId?: SortOrder
    name?: SortOrder
    symbol?: SortOrder
    isFeeOnTransfer?: SortOrder
    isCommon?: SortOrder
    derivedUSD?: SortOrder
    generatedAt?: SortOrder
    updatedAt?: SortOrder
    decimals?: SortOrder
  }

  export type TokenAvgOrderByAggregateInput = {
    chainId?: SortOrder
    derivedUSD?: SortOrder
    decimals?: SortOrder
  }

  export type TokenMaxOrderByAggregateInput = {
    id?: SortOrder
    uuid?: SortOrder
    chainId?: SortOrder
    name?: SortOrder
    symbol?: SortOrder
    isFeeOnTransfer?: SortOrder
    isCommon?: SortOrder
    derivedUSD?: SortOrder
    generatedAt?: SortOrder
    updatedAt?: SortOrder
    decimals?: SortOrder
  }

  export type TokenMinOrderByAggregateInput = {
    id?: SortOrder
    uuid?: SortOrder
    chainId?: SortOrder
    name?: SortOrder
    symbol?: SortOrder
    isFeeOnTransfer?: SortOrder
    isCommon?: SortOrder
    derivedUSD?: SortOrder
    generatedAt?: SortOrder
    updatedAt?: SortOrder
    decimals?: SortOrder
  }

  export type TokenSumOrderByAggregateInput = {
    chainId?: SortOrder
    derivedUSD?: SortOrder
    decimals?: SortOrder
  }

  export type StringWithAggregatesFilter = {
    equals?: string
    in?: Enumerable<string>
    notIn?: Enumerable<string>
    lt?: string
    lte?: string
    gt?: string
    gte?: string
    contains?: string
    startsWith?: string
    endsWith?: string
    not?: NestedStringWithAggregatesFilter | string
    _count?: NestedIntFilter
    _min?: NestedStringFilter
    _max?: NestedStringFilter
  }

  export type IntWithAggregatesFilter = {
    equals?: number
    in?: Enumerable<number>
    notIn?: Enumerable<number>
    lt?: number
    lte?: number
    gt?: number
    gte?: number
    not?: NestedIntWithAggregatesFilter | number
    _count?: NestedIntFilter
    _avg?: NestedFloatFilter
    _sum?: NestedIntFilter
    _min?: NestedIntFilter
    _max?: NestedIntFilter
  }

  export type BoolWithAggregatesFilter = {
    equals?: boolean
    not?: NestedBoolWithAggregatesFilter | boolean
    _count?: NestedIntFilter
    _min?: NestedBoolFilter
    _max?: NestedBoolFilter
  }

  export type FloatNullableWithAggregatesFilter = {
    equals?: number | null
    in?: Enumerable<number> | null
    notIn?: Enumerable<number> | null
    lt?: number
    lte?: number
    gt?: number
    gte?: number
    not?: NestedFloatNullableWithAggregatesFilter | number | null
    _count?: NestedIntNullableFilter
    _avg?: NestedFloatNullableFilter
    _sum?: NestedFloatNullableFilter
    _min?: NestedFloatNullableFilter
    _max?: NestedFloatNullableFilter
  }

  export type DateTimeWithAggregatesFilter = {
    equals?: Date | string
    in?: Enumerable<Date> | Enumerable<string>
    notIn?: Enumerable<Date> | Enumerable<string>
    lt?: Date | string
    lte?: Date | string
    gt?: Date | string
    gte?: Date | string
    not?: NestedDateTimeWithAggregatesFilter | Date | string
    _count?: NestedIntFilter
    _min?: NestedDateTimeFilter
    _max?: NestedDateTimeFilter
  }

  export type FloatFilter = {
    equals?: number
    in?: Enumerable<number>
    notIn?: Enumerable<number>
    lt?: number
    lte?: number
    gt?: number
    gte?: number
    not?: NestedFloatFilter | number
  }

  export type TokenRelationFilter = {
    is?: TokenWhereInput
    isNot?: TokenWhereInput
  }

  export type DaySnapshotListRelationFilter = {
    every?: daySnapshotWhereInput
    some?: daySnapshotWhereInput
    none?: daySnapshotWhereInput
  }

  export type HourSnapshotListRelationFilter = {
    every?: hourSnapshotWhereInput
    some?: hourSnapshotWhereInput
    none?: hourSnapshotWhereInput
  }

  export type daySnapshotOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type hourSnapshotOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type PoolCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    apr?: SortOrder
    chainId?: SortOrder
    version?: SortOrder
    token0Id?: SortOrder
    token1Id?: SortOrder
    swapFee?: SortOrder
    feeUSD?: SortOrder
    reserve0?: SortOrder
    reserve1?: SortOrder
    liquidityUSD?: SortOrder
    volumeUSD?: SortOrder
    liquidity?: SortOrder
    volume1d?: SortOrder
    fees1d?: SortOrder
    generatedAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PoolAvgOrderByAggregateInput = {
    apr?: SortOrder
    chainId?: SortOrder
    swapFee?: SortOrder
    feeUSD?: SortOrder
    liquidityUSD?: SortOrder
    volumeUSD?: SortOrder
    liquidity?: SortOrder
    volume1d?: SortOrder
    fees1d?: SortOrder
  }

  export type PoolMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    apr?: SortOrder
    chainId?: SortOrder
    version?: SortOrder
    token0Id?: SortOrder
    token1Id?: SortOrder
    swapFee?: SortOrder
    feeUSD?: SortOrder
    reserve0?: SortOrder
    reserve1?: SortOrder
    liquidityUSD?: SortOrder
    volumeUSD?: SortOrder
    liquidity?: SortOrder
    volume1d?: SortOrder
    fees1d?: SortOrder
    generatedAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PoolMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    apr?: SortOrder
    chainId?: SortOrder
    version?: SortOrder
    token0Id?: SortOrder
    token1Id?: SortOrder
    swapFee?: SortOrder
    feeUSD?: SortOrder
    reserve0?: SortOrder
    reserve1?: SortOrder
    liquidityUSD?: SortOrder
    volumeUSD?: SortOrder
    liquidity?: SortOrder
    volume1d?: SortOrder
    fees1d?: SortOrder
    generatedAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PoolSumOrderByAggregateInput = {
    apr?: SortOrder
    chainId?: SortOrder
    swapFee?: SortOrder
    feeUSD?: SortOrder
    liquidityUSD?: SortOrder
    volumeUSD?: SortOrder
    liquidity?: SortOrder
    volume1d?: SortOrder
    fees1d?: SortOrder
  }

  export type FloatWithAggregatesFilter = {
    equals?: number
    in?: Enumerable<number>
    notIn?: Enumerable<number>
    lt?: number
    lte?: number
    gt?: number
    gte?: number
    not?: NestedFloatWithAggregatesFilter | number
    _count?: NestedIntFilter
    _avg?: NestedFloatFilter
    _sum?: NestedFloatFilter
    _min?: NestedFloatFilter
    _max?: NestedFloatFilter
  }

  export type PoolRelationFilter = {
    is?: PoolWhereInput
    isNot?: PoolWhereInput
  }

  export type daySnapshotCountOrderByAggregateInput = {
    id?: SortOrder
    poolId?: SortOrder
    date?: SortOrder
    volumeUSD?: SortOrder
    liquidityUSD?: SortOrder
    apr?: SortOrder
  }

  export type daySnapshotAvgOrderByAggregateInput = {
    id?: SortOrder
    volumeUSD?: SortOrder
    liquidityUSD?: SortOrder
    apr?: SortOrder
  }

  export type daySnapshotMaxOrderByAggregateInput = {
    id?: SortOrder
    poolId?: SortOrder
    date?: SortOrder
    volumeUSD?: SortOrder
    liquidityUSD?: SortOrder
    apr?: SortOrder
  }

  export type daySnapshotMinOrderByAggregateInput = {
    id?: SortOrder
    poolId?: SortOrder
    date?: SortOrder
    volumeUSD?: SortOrder
    liquidityUSD?: SortOrder
    apr?: SortOrder
  }

  export type daySnapshotSumOrderByAggregateInput = {
    id?: SortOrder
    volumeUSD?: SortOrder
    liquidityUSD?: SortOrder
    apr?: SortOrder
  }

  export type hourSnapshotCountOrderByAggregateInput = {
    id?: SortOrder
    poolId?: SortOrder
    date?: SortOrder
    volumeUSD?: SortOrder
    liquidityUSD?: SortOrder
    apr?: SortOrder
  }

  export type hourSnapshotAvgOrderByAggregateInput = {
    id?: SortOrder
    volumeUSD?: SortOrder
    liquidityUSD?: SortOrder
    apr?: SortOrder
  }

  export type hourSnapshotMaxOrderByAggregateInput = {
    id?: SortOrder
    poolId?: SortOrder
    date?: SortOrder
    volumeUSD?: SortOrder
    liquidityUSD?: SortOrder
    apr?: SortOrder
  }

  export type hourSnapshotMinOrderByAggregateInput = {
    id?: SortOrder
    poolId?: SortOrder
    date?: SortOrder
    volumeUSD?: SortOrder
    liquidityUSD?: SortOrder
    apr?: SortOrder
  }

  export type hourSnapshotSumOrderByAggregateInput = {
    id?: SortOrder
    volumeUSD?: SortOrder
    liquidityUSD?: SortOrder
    apr?: SortOrder
  }

  export type BigIntFilter = {
    equals?: bigint | number
    in?: Enumerable<bigint> | Enumerable<number>
    notIn?: Enumerable<bigint> | Enumerable<number>
    lt?: bigint | number
    lte?: bigint | number
    gt?: bigint | number
    gte?: bigint | number
    not?: NestedBigIntFilter | bigint | number
  }

  export type DozerPoolCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    chainId?: SortOrder
    version?: SortOrder
    token0Id?: SortOrder
    token1Id?: SortOrder
    swapFee?: SortOrder
    twapEnabled?: SortOrder
    reserve0?: SortOrder
    reserve1?: SortOrder
    totalSupply?: SortOrder
    liquidityUSD?: SortOrder
    volumeUSD?: SortOrder
    token0Price?: SortOrder
    token1Price?: SortOrder
    feeApr?: SortOrder
    incentiveApr?: SortOrder
    totalApr?: SortOrder
    isIncentivized?: SortOrder
    volume1d?: SortOrder
    fees1d?: SortOrder
    volume1w?: SortOrder
    fees1w?: SortOrder
    createdAtBlockNumber?: SortOrder
    isBlacklisted?: SortOrder
    generatedAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DozerPoolAvgOrderByAggregateInput = {
    chainId?: SortOrder
    swapFee?: SortOrder
    liquidityUSD?: SortOrder
    volumeUSD?: SortOrder
    feeApr?: SortOrder
    incentiveApr?: SortOrder
    totalApr?: SortOrder
    volume1d?: SortOrder
    fees1d?: SortOrder
    volume1w?: SortOrder
    fees1w?: SortOrder
    createdAtBlockNumber?: SortOrder
  }

  export type DozerPoolMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    chainId?: SortOrder
    version?: SortOrder
    token0Id?: SortOrder
    token1Id?: SortOrder
    swapFee?: SortOrder
    twapEnabled?: SortOrder
    reserve0?: SortOrder
    reserve1?: SortOrder
    totalSupply?: SortOrder
    liquidityUSD?: SortOrder
    volumeUSD?: SortOrder
    token0Price?: SortOrder
    token1Price?: SortOrder
    feeApr?: SortOrder
    incentiveApr?: SortOrder
    totalApr?: SortOrder
    isIncentivized?: SortOrder
    volume1d?: SortOrder
    fees1d?: SortOrder
    volume1w?: SortOrder
    fees1w?: SortOrder
    createdAtBlockNumber?: SortOrder
    isBlacklisted?: SortOrder
    generatedAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DozerPoolMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    chainId?: SortOrder
    version?: SortOrder
    token0Id?: SortOrder
    token1Id?: SortOrder
    swapFee?: SortOrder
    twapEnabled?: SortOrder
    reserve0?: SortOrder
    reserve1?: SortOrder
    totalSupply?: SortOrder
    liquidityUSD?: SortOrder
    volumeUSD?: SortOrder
    token0Price?: SortOrder
    token1Price?: SortOrder
    feeApr?: SortOrder
    incentiveApr?: SortOrder
    totalApr?: SortOrder
    isIncentivized?: SortOrder
    volume1d?: SortOrder
    fees1d?: SortOrder
    volume1w?: SortOrder
    fees1w?: SortOrder
    createdAtBlockNumber?: SortOrder
    isBlacklisted?: SortOrder
    generatedAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DozerPoolSumOrderByAggregateInput = {
    chainId?: SortOrder
    swapFee?: SortOrder
    liquidityUSD?: SortOrder
    volumeUSD?: SortOrder
    feeApr?: SortOrder
    incentiveApr?: SortOrder
    totalApr?: SortOrder
    volume1d?: SortOrder
    fees1d?: SortOrder
    volume1w?: SortOrder
    fees1w?: SortOrder
    createdAtBlockNumber?: SortOrder
  }

  export type BigIntWithAggregatesFilter = {
    equals?: bigint | number
    in?: Enumerable<bigint> | Enumerable<number>
    notIn?: Enumerable<bigint> | Enumerable<number>
    lt?: bigint | number
    lte?: bigint | number
    gt?: bigint | number
    gte?: bigint | number
    not?: NestedBigIntWithAggregatesFilter | bigint | number
    _count?: NestedIntFilter
    _avg?: NestedFloatFilter
    _sum?: NestedBigIntFilter
    _min?: NestedBigIntFilter
    _max?: NestedBigIntFilter
  }

  export type DozerPoolRelationFilter = {
    is?: DozerPoolWhereInput
    isNot?: DozerPoolWhereInput
  }

  export type IncentiveCountOrderByAggregateInput = {
    id?: SortOrder
    chainId?: SortOrder
    apr?: SortOrder
    rewardPerDay?: SortOrder
    rewardTokenId?: SortOrder
    poolId?: SortOrder
    pid?: SortOrder
    rewarderAddress?: SortOrder
  }

  export type IncentiveAvgOrderByAggregateInput = {
    chainId?: SortOrder
    apr?: SortOrder
    rewardPerDay?: SortOrder
    pid?: SortOrder
  }

  export type IncentiveMaxOrderByAggregateInput = {
    id?: SortOrder
    chainId?: SortOrder
    apr?: SortOrder
    rewardPerDay?: SortOrder
    rewardTokenId?: SortOrder
    poolId?: SortOrder
    pid?: SortOrder
    rewarderAddress?: SortOrder
  }

  export type IncentiveMinOrderByAggregateInput = {
    id?: SortOrder
    chainId?: SortOrder
    apr?: SortOrder
    rewardPerDay?: SortOrder
    rewardTokenId?: SortOrder
    poolId?: SortOrder
    pid?: SortOrder
    rewarderAddress?: SortOrder
  }

  export type IncentiveSumOrderByAggregateInput = {
    chainId?: SortOrder
    apr?: SortOrder
    rewardPerDay?: SortOrder
    pid?: SortOrder
  }

  export type PoolCreateNestedManyWithoutToken0Input = {
    create?: XOR<Enumerable<PoolCreateWithoutToken0Input>, Enumerable<PoolUncheckedCreateWithoutToken0Input>>
    connectOrCreate?: Enumerable<PoolCreateOrConnectWithoutToken0Input>
    createMany?: PoolCreateManyToken0InputEnvelope
    connect?: Enumerable<PoolWhereUniqueInput>
  }

  export type PoolCreateNestedManyWithoutToken1Input = {
    create?: XOR<Enumerable<PoolCreateWithoutToken1Input>, Enumerable<PoolUncheckedCreateWithoutToken1Input>>
    connectOrCreate?: Enumerable<PoolCreateOrConnectWithoutToken1Input>
    createMany?: PoolCreateManyToken1InputEnvelope
    connect?: Enumerable<PoolWhereUniqueInput>
  }

  export type DozerPoolCreateNestedManyWithoutToken0Input = {
    create?: XOR<Enumerable<DozerPoolCreateWithoutToken0Input>, Enumerable<DozerPoolUncheckedCreateWithoutToken0Input>>
    connectOrCreate?: Enumerable<DozerPoolCreateOrConnectWithoutToken0Input>
    createMany?: DozerPoolCreateManyToken0InputEnvelope
    connect?: Enumerable<DozerPoolWhereUniqueInput>
  }

  export type DozerPoolCreateNestedManyWithoutToken1Input = {
    create?: XOR<Enumerable<DozerPoolCreateWithoutToken1Input>, Enumerable<DozerPoolUncheckedCreateWithoutToken1Input>>
    connectOrCreate?: Enumerable<DozerPoolCreateOrConnectWithoutToken1Input>
    createMany?: DozerPoolCreateManyToken1InputEnvelope
    connect?: Enumerable<DozerPoolWhereUniqueInput>
  }

  export type IncentiveCreateNestedManyWithoutRewardTokenInput = {
    create?: XOR<Enumerable<IncentiveCreateWithoutRewardTokenInput>, Enumerable<IncentiveUncheckedCreateWithoutRewardTokenInput>>
    connectOrCreate?: Enumerable<IncentiveCreateOrConnectWithoutRewardTokenInput>
    createMany?: IncentiveCreateManyRewardTokenInputEnvelope
    connect?: Enumerable<IncentiveWhereUniqueInput>
  }

  export type PoolUncheckedCreateNestedManyWithoutToken0Input = {
    create?: XOR<Enumerable<PoolCreateWithoutToken0Input>, Enumerable<PoolUncheckedCreateWithoutToken0Input>>
    connectOrCreate?: Enumerable<PoolCreateOrConnectWithoutToken0Input>
    createMany?: PoolCreateManyToken0InputEnvelope
    connect?: Enumerable<PoolWhereUniqueInput>
  }

  export type PoolUncheckedCreateNestedManyWithoutToken1Input = {
    create?: XOR<Enumerable<PoolCreateWithoutToken1Input>, Enumerable<PoolUncheckedCreateWithoutToken1Input>>
    connectOrCreate?: Enumerable<PoolCreateOrConnectWithoutToken1Input>
    createMany?: PoolCreateManyToken1InputEnvelope
    connect?: Enumerable<PoolWhereUniqueInput>
  }

  export type DozerPoolUncheckedCreateNestedManyWithoutToken0Input = {
    create?: XOR<Enumerable<DozerPoolCreateWithoutToken0Input>, Enumerable<DozerPoolUncheckedCreateWithoutToken0Input>>
    connectOrCreate?: Enumerable<DozerPoolCreateOrConnectWithoutToken0Input>
    createMany?: DozerPoolCreateManyToken0InputEnvelope
    connect?: Enumerable<DozerPoolWhereUniqueInput>
  }

  export type DozerPoolUncheckedCreateNestedManyWithoutToken1Input = {
    create?: XOR<Enumerable<DozerPoolCreateWithoutToken1Input>, Enumerable<DozerPoolUncheckedCreateWithoutToken1Input>>
    connectOrCreate?: Enumerable<DozerPoolCreateOrConnectWithoutToken1Input>
    createMany?: DozerPoolCreateManyToken1InputEnvelope
    connect?: Enumerable<DozerPoolWhereUniqueInput>
  }

  export type IncentiveUncheckedCreateNestedManyWithoutRewardTokenInput = {
    create?: XOR<Enumerable<IncentiveCreateWithoutRewardTokenInput>, Enumerable<IncentiveUncheckedCreateWithoutRewardTokenInput>>
    connectOrCreate?: Enumerable<IncentiveCreateOrConnectWithoutRewardTokenInput>
    createMany?: IncentiveCreateManyRewardTokenInputEnvelope
    connect?: Enumerable<IncentiveWhereUniqueInput>
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type NullableFloatFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type PoolUpdateManyWithoutToken0NestedInput = {
    create?: XOR<Enumerable<PoolCreateWithoutToken0Input>, Enumerable<PoolUncheckedCreateWithoutToken0Input>>
    connectOrCreate?: Enumerable<PoolCreateOrConnectWithoutToken0Input>
    upsert?: Enumerable<PoolUpsertWithWhereUniqueWithoutToken0Input>
    createMany?: PoolCreateManyToken0InputEnvelope
    set?: Enumerable<PoolWhereUniqueInput>
    disconnect?: Enumerable<PoolWhereUniqueInput>
    delete?: Enumerable<PoolWhereUniqueInput>
    connect?: Enumerable<PoolWhereUniqueInput>
    update?: Enumerable<PoolUpdateWithWhereUniqueWithoutToken0Input>
    updateMany?: Enumerable<PoolUpdateManyWithWhereWithoutToken0Input>
    deleteMany?: Enumerable<PoolScalarWhereInput>
  }

  export type PoolUpdateManyWithoutToken1NestedInput = {
    create?: XOR<Enumerable<PoolCreateWithoutToken1Input>, Enumerable<PoolUncheckedCreateWithoutToken1Input>>
    connectOrCreate?: Enumerable<PoolCreateOrConnectWithoutToken1Input>
    upsert?: Enumerable<PoolUpsertWithWhereUniqueWithoutToken1Input>
    createMany?: PoolCreateManyToken1InputEnvelope
    set?: Enumerable<PoolWhereUniqueInput>
    disconnect?: Enumerable<PoolWhereUniqueInput>
    delete?: Enumerable<PoolWhereUniqueInput>
    connect?: Enumerable<PoolWhereUniqueInput>
    update?: Enumerable<PoolUpdateWithWhereUniqueWithoutToken1Input>
    updateMany?: Enumerable<PoolUpdateManyWithWhereWithoutToken1Input>
    deleteMany?: Enumerable<PoolScalarWhereInput>
  }

  export type DozerPoolUpdateManyWithoutToken0NestedInput = {
    create?: XOR<Enumerable<DozerPoolCreateWithoutToken0Input>, Enumerable<DozerPoolUncheckedCreateWithoutToken0Input>>
    connectOrCreate?: Enumerable<DozerPoolCreateOrConnectWithoutToken0Input>
    upsert?: Enumerable<DozerPoolUpsertWithWhereUniqueWithoutToken0Input>
    createMany?: DozerPoolCreateManyToken0InputEnvelope
    set?: Enumerable<DozerPoolWhereUniqueInput>
    disconnect?: Enumerable<DozerPoolWhereUniqueInput>
    delete?: Enumerable<DozerPoolWhereUniqueInput>
    connect?: Enumerable<DozerPoolWhereUniqueInput>
    update?: Enumerable<DozerPoolUpdateWithWhereUniqueWithoutToken0Input>
    updateMany?: Enumerable<DozerPoolUpdateManyWithWhereWithoutToken0Input>
    deleteMany?: Enumerable<DozerPoolScalarWhereInput>
  }

  export type DozerPoolUpdateManyWithoutToken1NestedInput = {
    create?: XOR<Enumerable<DozerPoolCreateWithoutToken1Input>, Enumerable<DozerPoolUncheckedCreateWithoutToken1Input>>
    connectOrCreate?: Enumerable<DozerPoolCreateOrConnectWithoutToken1Input>
    upsert?: Enumerable<DozerPoolUpsertWithWhereUniqueWithoutToken1Input>
    createMany?: DozerPoolCreateManyToken1InputEnvelope
    set?: Enumerable<DozerPoolWhereUniqueInput>
    disconnect?: Enumerable<DozerPoolWhereUniqueInput>
    delete?: Enumerable<DozerPoolWhereUniqueInput>
    connect?: Enumerable<DozerPoolWhereUniqueInput>
    update?: Enumerable<DozerPoolUpdateWithWhereUniqueWithoutToken1Input>
    updateMany?: Enumerable<DozerPoolUpdateManyWithWhereWithoutToken1Input>
    deleteMany?: Enumerable<DozerPoolScalarWhereInput>
  }

  export type IncentiveUpdateManyWithoutRewardTokenNestedInput = {
    create?: XOR<Enumerable<IncentiveCreateWithoutRewardTokenInput>, Enumerable<IncentiveUncheckedCreateWithoutRewardTokenInput>>
    connectOrCreate?: Enumerable<IncentiveCreateOrConnectWithoutRewardTokenInput>
    upsert?: Enumerable<IncentiveUpsertWithWhereUniqueWithoutRewardTokenInput>
    createMany?: IncentiveCreateManyRewardTokenInputEnvelope
    set?: Enumerable<IncentiveWhereUniqueInput>
    disconnect?: Enumerable<IncentiveWhereUniqueInput>
    delete?: Enumerable<IncentiveWhereUniqueInput>
    connect?: Enumerable<IncentiveWhereUniqueInput>
    update?: Enumerable<IncentiveUpdateWithWhereUniqueWithoutRewardTokenInput>
    updateMany?: Enumerable<IncentiveUpdateManyWithWhereWithoutRewardTokenInput>
    deleteMany?: Enumerable<IncentiveScalarWhereInput>
  }

  export type PoolUncheckedUpdateManyWithoutToken0NestedInput = {
    create?: XOR<Enumerable<PoolCreateWithoutToken0Input>, Enumerable<PoolUncheckedCreateWithoutToken0Input>>
    connectOrCreate?: Enumerable<PoolCreateOrConnectWithoutToken0Input>
    upsert?: Enumerable<PoolUpsertWithWhereUniqueWithoutToken0Input>
    createMany?: PoolCreateManyToken0InputEnvelope
    set?: Enumerable<PoolWhereUniqueInput>
    disconnect?: Enumerable<PoolWhereUniqueInput>
    delete?: Enumerable<PoolWhereUniqueInput>
    connect?: Enumerable<PoolWhereUniqueInput>
    update?: Enumerable<PoolUpdateWithWhereUniqueWithoutToken0Input>
    updateMany?: Enumerable<PoolUpdateManyWithWhereWithoutToken0Input>
    deleteMany?: Enumerable<PoolScalarWhereInput>
  }

  export type PoolUncheckedUpdateManyWithoutToken1NestedInput = {
    create?: XOR<Enumerable<PoolCreateWithoutToken1Input>, Enumerable<PoolUncheckedCreateWithoutToken1Input>>
    connectOrCreate?: Enumerable<PoolCreateOrConnectWithoutToken1Input>
    upsert?: Enumerable<PoolUpsertWithWhereUniqueWithoutToken1Input>
    createMany?: PoolCreateManyToken1InputEnvelope
    set?: Enumerable<PoolWhereUniqueInput>
    disconnect?: Enumerable<PoolWhereUniqueInput>
    delete?: Enumerable<PoolWhereUniqueInput>
    connect?: Enumerable<PoolWhereUniqueInput>
    update?: Enumerable<PoolUpdateWithWhereUniqueWithoutToken1Input>
    updateMany?: Enumerable<PoolUpdateManyWithWhereWithoutToken1Input>
    deleteMany?: Enumerable<PoolScalarWhereInput>
  }

  export type DozerPoolUncheckedUpdateManyWithoutToken0NestedInput = {
    create?: XOR<Enumerable<DozerPoolCreateWithoutToken0Input>, Enumerable<DozerPoolUncheckedCreateWithoutToken0Input>>
    connectOrCreate?: Enumerable<DozerPoolCreateOrConnectWithoutToken0Input>
    upsert?: Enumerable<DozerPoolUpsertWithWhereUniqueWithoutToken0Input>
    createMany?: DozerPoolCreateManyToken0InputEnvelope
    set?: Enumerable<DozerPoolWhereUniqueInput>
    disconnect?: Enumerable<DozerPoolWhereUniqueInput>
    delete?: Enumerable<DozerPoolWhereUniqueInput>
    connect?: Enumerable<DozerPoolWhereUniqueInput>
    update?: Enumerable<DozerPoolUpdateWithWhereUniqueWithoutToken0Input>
    updateMany?: Enumerable<DozerPoolUpdateManyWithWhereWithoutToken0Input>
    deleteMany?: Enumerable<DozerPoolScalarWhereInput>
  }

  export type DozerPoolUncheckedUpdateManyWithoutToken1NestedInput = {
    create?: XOR<Enumerable<DozerPoolCreateWithoutToken1Input>, Enumerable<DozerPoolUncheckedCreateWithoutToken1Input>>
    connectOrCreate?: Enumerable<DozerPoolCreateOrConnectWithoutToken1Input>
    upsert?: Enumerable<DozerPoolUpsertWithWhereUniqueWithoutToken1Input>
    createMany?: DozerPoolCreateManyToken1InputEnvelope
    set?: Enumerable<DozerPoolWhereUniqueInput>
    disconnect?: Enumerable<DozerPoolWhereUniqueInput>
    delete?: Enumerable<DozerPoolWhereUniqueInput>
    connect?: Enumerable<DozerPoolWhereUniqueInput>
    update?: Enumerable<DozerPoolUpdateWithWhereUniqueWithoutToken1Input>
    updateMany?: Enumerable<DozerPoolUpdateManyWithWhereWithoutToken1Input>
    deleteMany?: Enumerable<DozerPoolScalarWhereInput>
  }

  export type IncentiveUncheckedUpdateManyWithoutRewardTokenNestedInput = {
    create?: XOR<Enumerable<IncentiveCreateWithoutRewardTokenInput>, Enumerable<IncentiveUncheckedCreateWithoutRewardTokenInput>>
    connectOrCreate?: Enumerable<IncentiveCreateOrConnectWithoutRewardTokenInput>
    upsert?: Enumerable<IncentiveUpsertWithWhereUniqueWithoutRewardTokenInput>
    createMany?: IncentiveCreateManyRewardTokenInputEnvelope
    set?: Enumerable<IncentiveWhereUniqueInput>
    disconnect?: Enumerable<IncentiveWhereUniqueInput>
    delete?: Enumerable<IncentiveWhereUniqueInput>
    connect?: Enumerable<IncentiveWhereUniqueInput>
    update?: Enumerable<IncentiveUpdateWithWhereUniqueWithoutRewardTokenInput>
    updateMany?: Enumerable<IncentiveUpdateManyWithWhereWithoutRewardTokenInput>
    deleteMany?: Enumerable<IncentiveScalarWhereInput>
  }

  export type TokenCreateNestedOneWithoutPools0Input = {
    create?: XOR<TokenCreateWithoutPools0Input, TokenUncheckedCreateWithoutPools0Input>
    connectOrCreate?: TokenCreateOrConnectWithoutPools0Input
    connect?: TokenWhereUniqueInput
  }

  export type TokenCreateNestedOneWithoutPools1Input = {
    create?: XOR<TokenCreateWithoutPools1Input, TokenUncheckedCreateWithoutPools1Input>
    connectOrCreate?: TokenCreateOrConnectWithoutPools1Input
    connect?: TokenWhereUniqueInput
  }

  export type daySnapshotCreateNestedManyWithoutPoolInput = {
    create?: XOR<Enumerable<daySnapshotCreateWithoutPoolInput>, Enumerable<daySnapshotUncheckedCreateWithoutPoolInput>>
    connectOrCreate?: Enumerable<daySnapshotCreateOrConnectWithoutPoolInput>
    createMany?: daySnapshotCreateManyPoolInputEnvelope
    connect?: Enumerable<daySnapshotWhereUniqueInput>
  }

  export type hourSnapshotCreateNestedManyWithoutPoolInput = {
    create?: XOR<Enumerable<hourSnapshotCreateWithoutPoolInput>, Enumerable<hourSnapshotUncheckedCreateWithoutPoolInput>>
    connectOrCreate?: Enumerable<hourSnapshotCreateOrConnectWithoutPoolInput>
    createMany?: hourSnapshotCreateManyPoolInputEnvelope
    connect?: Enumerable<hourSnapshotWhereUniqueInput>
  }

  export type daySnapshotUncheckedCreateNestedManyWithoutPoolInput = {
    create?: XOR<Enumerable<daySnapshotCreateWithoutPoolInput>, Enumerable<daySnapshotUncheckedCreateWithoutPoolInput>>
    connectOrCreate?: Enumerable<daySnapshotCreateOrConnectWithoutPoolInput>
    createMany?: daySnapshotCreateManyPoolInputEnvelope
    connect?: Enumerable<daySnapshotWhereUniqueInput>
  }

  export type hourSnapshotUncheckedCreateNestedManyWithoutPoolInput = {
    create?: XOR<Enumerable<hourSnapshotCreateWithoutPoolInput>, Enumerable<hourSnapshotUncheckedCreateWithoutPoolInput>>
    connectOrCreate?: Enumerable<hourSnapshotCreateOrConnectWithoutPoolInput>
    createMany?: hourSnapshotCreateManyPoolInputEnvelope
    connect?: Enumerable<hourSnapshotWhereUniqueInput>
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type TokenUpdateOneRequiredWithoutPools0NestedInput = {
    create?: XOR<TokenCreateWithoutPools0Input, TokenUncheckedCreateWithoutPools0Input>
    connectOrCreate?: TokenCreateOrConnectWithoutPools0Input
    upsert?: TokenUpsertWithoutPools0Input
    connect?: TokenWhereUniqueInput
    update?: XOR<TokenUpdateWithoutPools0Input, TokenUncheckedUpdateWithoutPools0Input>
  }

  export type TokenUpdateOneRequiredWithoutPools1NestedInput = {
    create?: XOR<TokenCreateWithoutPools1Input, TokenUncheckedCreateWithoutPools1Input>
    connectOrCreate?: TokenCreateOrConnectWithoutPools1Input
    upsert?: TokenUpsertWithoutPools1Input
    connect?: TokenWhereUniqueInput
    update?: XOR<TokenUpdateWithoutPools1Input, TokenUncheckedUpdateWithoutPools1Input>
  }

  export type daySnapshotUpdateManyWithoutPoolNestedInput = {
    create?: XOR<Enumerable<daySnapshotCreateWithoutPoolInput>, Enumerable<daySnapshotUncheckedCreateWithoutPoolInput>>
    connectOrCreate?: Enumerable<daySnapshotCreateOrConnectWithoutPoolInput>
    upsert?: Enumerable<daySnapshotUpsertWithWhereUniqueWithoutPoolInput>
    createMany?: daySnapshotCreateManyPoolInputEnvelope
    set?: Enumerable<daySnapshotWhereUniqueInput>
    disconnect?: Enumerable<daySnapshotWhereUniqueInput>
    delete?: Enumerable<daySnapshotWhereUniqueInput>
    connect?: Enumerable<daySnapshotWhereUniqueInput>
    update?: Enumerable<daySnapshotUpdateWithWhereUniqueWithoutPoolInput>
    updateMany?: Enumerable<daySnapshotUpdateManyWithWhereWithoutPoolInput>
    deleteMany?: Enumerable<daySnapshotScalarWhereInput>
  }

  export type hourSnapshotUpdateManyWithoutPoolNestedInput = {
    create?: XOR<Enumerable<hourSnapshotCreateWithoutPoolInput>, Enumerable<hourSnapshotUncheckedCreateWithoutPoolInput>>
    connectOrCreate?: Enumerable<hourSnapshotCreateOrConnectWithoutPoolInput>
    upsert?: Enumerable<hourSnapshotUpsertWithWhereUniqueWithoutPoolInput>
    createMany?: hourSnapshotCreateManyPoolInputEnvelope
    set?: Enumerable<hourSnapshotWhereUniqueInput>
    disconnect?: Enumerable<hourSnapshotWhereUniqueInput>
    delete?: Enumerable<hourSnapshotWhereUniqueInput>
    connect?: Enumerable<hourSnapshotWhereUniqueInput>
    update?: Enumerable<hourSnapshotUpdateWithWhereUniqueWithoutPoolInput>
    updateMany?: Enumerable<hourSnapshotUpdateManyWithWhereWithoutPoolInput>
    deleteMany?: Enumerable<hourSnapshotScalarWhereInput>
  }

  export type daySnapshotUncheckedUpdateManyWithoutPoolNestedInput = {
    create?: XOR<Enumerable<daySnapshotCreateWithoutPoolInput>, Enumerable<daySnapshotUncheckedCreateWithoutPoolInput>>
    connectOrCreate?: Enumerable<daySnapshotCreateOrConnectWithoutPoolInput>
    upsert?: Enumerable<daySnapshotUpsertWithWhereUniqueWithoutPoolInput>
    createMany?: daySnapshotCreateManyPoolInputEnvelope
    set?: Enumerable<daySnapshotWhereUniqueInput>
    disconnect?: Enumerable<daySnapshotWhereUniqueInput>
    delete?: Enumerable<daySnapshotWhereUniqueInput>
    connect?: Enumerable<daySnapshotWhereUniqueInput>
    update?: Enumerable<daySnapshotUpdateWithWhereUniqueWithoutPoolInput>
    updateMany?: Enumerable<daySnapshotUpdateManyWithWhereWithoutPoolInput>
    deleteMany?: Enumerable<daySnapshotScalarWhereInput>
  }

  export type hourSnapshotUncheckedUpdateManyWithoutPoolNestedInput = {
    create?: XOR<Enumerable<hourSnapshotCreateWithoutPoolInput>, Enumerable<hourSnapshotUncheckedCreateWithoutPoolInput>>
    connectOrCreate?: Enumerable<hourSnapshotCreateOrConnectWithoutPoolInput>
    upsert?: Enumerable<hourSnapshotUpsertWithWhereUniqueWithoutPoolInput>
    createMany?: hourSnapshotCreateManyPoolInputEnvelope
    set?: Enumerable<hourSnapshotWhereUniqueInput>
    disconnect?: Enumerable<hourSnapshotWhereUniqueInput>
    delete?: Enumerable<hourSnapshotWhereUniqueInput>
    connect?: Enumerable<hourSnapshotWhereUniqueInput>
    update?: Enumerable<hourSnapshotUpdateWithWhereUniqueWithoutPoolInput>
    updateMany?: Enumerable<hourSnapshotUpdateManyWithWhereWithoutPoolInput>
    deleteMany?: Enumerable<hourSnapshotScalarWhereInput>
  }

  export type PoolCreateNestedOneWithoutDaySnapshotsInput = {
    create?: XOR<PoolCreateWithoutDaySnapshotsInput, PoolUncheckedCreateWithoutDaySnapshotsInput>
    connectOrCreate?: PoolCreateOrConnectWithoutDaySnapshotsInput
    connect?: PoolWhereUniqueInput
  }

  export type PoolUpdateOneRequiredWithoutDaySnapshotsNestedInput = {
    create?: XOR<PoolCreateWithoutDaySnapshotsInput, PoolUncheckedCreateWithoutDaySnapshotsInput>
    connectOrCreate?: PoolCreateOrConnectWithoutDaySnapshotsInput
    upsert?: PoolUpsertWithoutDaySnapshotsInput
    connect?: PoolWhereUniqueInput
    update?: XOR<PoolUpdateWithoutDaySnapshotsInput, PoolUncheckedUpdateWithoutDaySnapshotsInput>
  }

  export type PoolCreateNestedOneWithoutHourSnapshotsInput = {
    create?: XOR<PoolCreateWithoutHourSnapshotsInput, PoolUncheckedCreateWithoutHourSnapshotsInput>
    connectOrCreate?: PoolCreateOrConnectWithoutHourSnapshotsInput
    connect?: PoolWhereUniqueInput
  }

  export type PoolUpdateOneRequiredWithoutHourSnapshotsNestedInput = {
    create?: XOR<PoolCreateWithoutHourSnapshotsInput, PoolUncheckedCreateWithoutHourSnapshotsInput>
    connectOrCreate?: PoolCreateOrConnectWithoutHourSnapshotsInput
    upsert?: PoolUpsertWithoutHourSnapshotsInput
    connect?: PoolWhereUniqueInput
    update?: XOR<PoolUpdateWithoutHourSnapshotsInput, PoolUncheckedUpdateWithoutHourSnapshotsInput>
  }

  export type TokenCreateNestedOneWithoutDozerPools0Input = {
    create?: XOR<TokenCreateWithoutDozerPools0Input, TokenUncheckedCreateWithoutDozerPools0Input>
    connectOrCreate?: TokenCreateOrConnectWithoutDozerPools0Input
    connect?: TokenWhereUniqueInput
  }

  export type TokenCreateNestedOneWithoutDozerPools1Input = {
    create?: XOR<TokenCreateWithoutDozerPools1Input, TokenUncheckedCreateWithoutDozerPools1Input>
    connectOrCreate?: TokenCreateOrConnectWithoutDozerPools1Input
    connect?: TokenWhereUniqueInput
  }

  export type IncentiveCreateNestedManyWithoutPoolInput = {
    create?: XOR<Enumerable<IncentiveCreateWithoutPoolInput>, Enumerable<IncentiveUncheckedCreateWithoutPoolInput>>
    connectOrCreate?: Enumerable<IncentiveCreateOrConnectWithoutPoolInput>
    createMany?: IncentiveCreateManyPoolInputEnvelope
    connect?: Enumerable<IncentiveWhereUniqueInput>
  }

  export type IncentiveUncheckedCreateNestedManyWithoutPoolInput = {
    create?: XOR<Enumerable<IncentiveCreateWithoutPoolInput>, Enumerable<IncentiveUncheckedCreateWithoutPoolInput>>
    connectOrCreate?: Enumerable<IncentiveCreateOrConnectWithoutPoolInput>
    createMany?: IncentiveCreateManyPoolInputEnvelope
    connect?: Enumerable<IncentiveWhereUniqueInput>
  }

  export type BigIntFieldUpdateOperationsInput = {
    set?: bigint | number
    increment?: bigint | number
    decrement?: bigint | number
    multiply?: bigint | number
    divide?: bigint | number
  }

  export type TokenUpdateOneRequiredWithoutDozerPools0NestedInput = {
    create?: XOR<TokenCreateWithoutDozerPools0Input, TokenUncheckedCreateWithoutDozerPools0Input>
    connectOrCreate?: TokenCreateOrConnectWithoutDozerPools0Input
    upsert?: TokenUpsertWithoutDozerPools0Input
    connect?: TokenWhereUniqueInput
    update?: XOR<TokenUpdateWithoutDozerPools0Input, TokenUncheckedUpdateWithoutDozerPools0Input>
  }

  export type TokenUpdateOneRequiredWithoutDozerPools1NestedInput = {
    create?: XOR<TokenCreateWithoutDozerPools1Input, TokenUncheckedCreateWithoutDozerPools1Input>
    connectOrCreate?: TokenCreateOrConnectWithoutDozerPools1Input
    upsert?: TokenUpsertWithoutDozerPools1Input
    connect?: TokenWhereUniqueInput
    update?: XOR<TokenUpdateWithoutDozerPools1Input, TokenUncheckedUpdateWithoutDozerPools1Input>
  }

  export type IncentiveUpdateManyWithoutPoolNestedInput = {
    create?: XOR<Enumerable<IncentiveCreateWithoutPoolInput>, Enumerable<IncentiveUncheckedCreateWithoutPoolInput>>
    connectOrCreate?: Enumerable<IncentiveCreateOrConnectWithoutPoolInput>
    upsert?: Enumerable<IncentiveUpsertWithWhereUniqueWithoutPoolInput>
    createMany?: IncentiveCreateManyPoolInputEnvelope
    set?: Enumerable<IncentiveWhereUniqueInput>
    disconnect?: Enumerable<IncentiveWhereUniqueInput>
    delete?: Enumerable<IncentiveWhereUniqueInput>
    connect?: Enumerable<IncentiveWhereUniqueInput>
    update?: Enumerable<IncentiveUpdateWithWhereUniqueWithoutPoolInput>
    updateMany?: Enumerable<IncentiveUpdateManyWithWhereWithoutPoolInput>
    deleteMany?: Enumerable<IncentiveScalarWhereInput>
  }

  export type IncentiveUncheckedUpdateManyWithoutPoolNestedInput = {
    create?: XOR<Enumerable<IncentiveCreateWithoutPoolInput>, Enumerable<IncentiveUncheckedCreateWithoutPoolInput>>
    connectOrCreate?: Enumerable<IncentiveCreateOrConnectWithoutPoolInput>
    upsert?: Enumerable<IncentiveUpsertWithWhereUniqueWithoutPoolInput>
    createMany?: IncentiveCreateManyPoolInputEnvelope
    set?: Enumerable<IncentiveWhereUniqueInput>
    disconnect?: Enumerable<IncentiveWhereUniqueInput>
    delete?: Enumerable<IncentiveWhereUniqueInput>
    connect?: Enumerable<IncentiveWhereUniqueInput>
    update?: Enumerable<IncentiveUpdateWithWhereUniqueWithoutPoolInput>
    updateMany?: Enumerable<IncentiveUpdateManyWithWhereWithoutPoolInput>
    deleteMany?: Enumerable<IncentiveScalarWhereInput>
  }

  export type TokenCreateNestedOneWithoutIncentivesInput = {
    create?: XOR<TokenCreateWithoutIncentivesInput, TokenUncheckedCreateWithoutIncentivesInput>
    connectOrCreate?: TokenCreateOrConnectWithoutIncentivesInput
    connect?: TokenWhereUniqueInput
  }

  export type DozerPoolCreateNestedOneWithoutIncentivesInput = {
    create?: XOR<DozerPoolCreateWithoutIncentivesInput, DozerPoolUncheckedCreateWithoutIncentivesInput>
    connectOrCreate?: DozerPoolCreateOrConnectWithoutIncentivesInput
    connect?: DozerPoolWhereUniqueInput
  }

  export type TokenUpdateOneRequiredWithoutIncentivesNestedInput = {
    create?: XOR<TokenCreateWithoutIncentivesInput, TokenUncheckedCreateWithoutIncentivesInput>
    connectOrCreate?: TokenCreateOrConnectWithoutIncentivesInput
    upsert?: TokenUpsertWithoutIncentivesInput
    connect?: TokenWhereUniqueInput
    update?: XOR<TokenUpdateWithoutIncentivesInput, TokenUncheckedUpdateWithoutIncentivesInput>
  }

  export type DozerPoolUpdateOneRequiredWithoutIncentivesNestedInput = {
    create?: XOR<DozerPoolCreateWithoutIncentivesInput, DozerPoolUncheckedCreateWithoutIncentivesInput>
    connectOrCreate?: DozerPoolCreateOrConnectWithoutIncentivesInput
    upsert?: DozerPoolUpsertWithoutIncentivesInput
    connect?: DozerPoolWhereUniqueInput
    update?: XOR<DozerPoolUpdateWithoutIncentivesInput, DozerPoolUncheckedUpdateWithoutIncentivesInput>
  }

  export type NestedStringFilter = {
    equals?: string
    in?: Enumerable<string>
    notIn?: Enumerable<string>
    lt?: string
    lte?: string
    gt?: string
    gte?: string
    contains?: string
    startsWith?: string
    endsWith?: string
    not?: NestedStringFilter | string
  }

  export type NestedIntFilter = {
    equals?: number
    in?: Enumerable<number>
    notIn?: Enumerable<number>
    lt?: number
    lte?: number
    gt?: number
    gte?: number
    not?: NestedIntFilter | number
  }

  export type NestedBoolFilter = {
    equals?: boolean
    not?: NestedBoolFilter | boolean
  }

  export type NestedFloatNullableFilter = {
    equals?: number | null
    in?: Enumerable<number> | null
    notIn?: Enumerable<number> | null
    lt?: number
    lte?: number
    gt?: number
    gte?: number
    not?: NestedFloatNullableFilter | number | null
  }

  export type NestedDateTimeFilter = {
    equals?: Date | string
    in?: Enumerable<Date> | Enumerable<string>
    notIn?: Enumerable<Date> | Enumerable<string>
    lt?: Date | string
    lte?: Date | string
    gt?: Date | string
    gte?: Date | string
    not?: NestedDateTimeFilter | Date | string
  }

  export type NestedStringWithAggregatesFilter = {
    equals?: string
    in?: Enumerable<string>
    notIn?: Enumerable<string>
    lt?: string
    lte?: string
    gt?: string
    gte?: string
    contains?: string
    startsWith?: string
    endsWith?: string
    not?: NestedStringWithAggregatesFilter | string
    _count?: NestedIntFilter
    _min?: NestedStringFilter
    _max?: NestedStringFilter
  }

  export type NestedIntWithAggregatesFilter = {
    equals?: number
    in?: Enumerable<number>
    notIn?: Enumerable<number>
    lt?: number
    lte?: number
    gt?: number
    gte?: number
    not?: NestedIntWithAggregatesFilter | number
    _count?: NestedIntFilter
    _avg?: NestedFloatFilter
    _sum?: NestedIntFilter
    _min?: NestedIntFilter
    _max?: NestedIntFilter
  }

  export type NestedFloatFilter = {
    equals?: number
    in?: Enumerable<number>
    notIn?: Enumerable<number>
    lt?: number
    lte?: number
    gt?: number
    gte?: number
    not?: NestedFloatFilter | number
  }

  export type NestedBoolWithAggregatesFilter = {
    equals?: boolean
    not?: NestedBoolWithAggregatesFilter | boolean
    _count?: NestedIntFilter
    _min?: NestedBoolFilter
    _max?: NestedBoolFilter
  }

  export type NestedFloatNullableWithAggregatesFilter = {
    equals?: number | null
    in?: Enumerable<number> | null
    notIn?: Enumerable<number> | null
    lt?: number
    lte?: number
    gt?: number
    gte?: number
    not?: NestedFloatNullableWithAggregatesFilter | number | null
    _count?: NestedIntNullableFilter
    _avg?: NestedFloatNullableFilter
    _sum?: NestedFloatNullableFilter
    _min?: NestedFloatNullableFilter
    _max?: NestedFloatNullableFilter
  }

  export type NestedIntNullableFilter = {
    equals?: number | null
    in?: Enumerable<number> | null
    notIn?: Enumerable<number> | null
    lt?: number
    lte?: number
    gt?: number
    gte?: number
    not?: NestedIntNullableFilter | number | null
  }

  export type NestedDateTimeWithAggregatesFilter = {
    equals?: Date | string
    in?: Enumerable<Date> | Enumerable<string>
    notIn?: Enumerable<Date> | Enumerable<string>
    lt?: Date | string
    lte?: Date | string
    gt?: Date | string
    gte?: Date | string
    not?: NestedDateTimeWithAggregatesFilter | Date | string
    _count?: NestedIntFilter
    _min?: NestedDateTimeFilter
    _max?: NestedDateTimeFilter
  }

  export type NestedFloatWithAggregatesFilter = {
    equals?: number
    in?: Enumerable<number>
    notIn?: Enumerable<number>
    lt?: number
    lte?: number
    gt?: number
    gte?: number
    not?: NestedFloatWithAggregatesFilter | number
    _count?: NestedIntFilter
    _avg?: NestedFloatFilter
    _sum?: NestedFloatFilter
    _min?: NestedFloatFilter
    _max?: NestedFloatFilter
  }

  export type NestedBigIntFilter = {
    equals?: bigint | number
    in?: Enumerable<bigint> | Enumerable<number>
    notIn?: Enumerable<bigint> | Enumerable<number>
    lt?: bigint | number
    lte?: bigint | number
    gt?: bigint | number
    gte?: bigint | number
    not?: NestedBigIntFilter | bigint | number
  }

  export type NestedBigIntWithAggregatesFilter = {
    equals?: bigint | number
    in?: Enumerable<bigint> | Enumerable<number>
    notIn?: Enumerable<bigint> | Enumerable<number>
    lt?: bigint | number
    lte?: bigint | number
    gt?: bigint | number
    gte?: bigint | number
    not?: NestedBigIntWithAggregatesFilter | bigint | number
    _count?: NestedIntFilter
    _avg?: NestedFloatFilter
    _sum?: NestedBigIntFilter
    _min?: NestedBigIntFilter
    _max?: NestedBigIntFilter
  }

  export type PoolCreateWithoutToken0Input = {
    id: string
    name: string
    apr: number
    chainId: number
    version: string
    swapFee: number
    feeUSD: number
    reserve0?: string
    reserve1?: string
    liquidityUSD: number
    volumeUSD: number
    liquidity: number
    volume1d: number
    fees1d: number
    generatedAt?: Date | string
    updatedAt?: Date | string
    token1: TokenCreateNestedOneWithoutPools1Input
    daySnapshots?: daySnapshotCreateNestedManyWithoutPoolInput
    hourSnapshots?: hourSnapshotCreateNestedManyWithoutPoolInput
  }

  export type PoolUncheckedCreateWithoutToken0Input = {
    id: string
    name: string
    apr: number
    chainId: number
    version: string
    token1Id: string
    swapFee: number
    feeUSD: number
    reserve0?: string
    reserve1?: string
    liquidityUSD: number
    volumeUSD: number
    liquidity: number
    volume1d: number
    fees1d: number
    generatedAt?: Date | string
    updatedAt?: Date | string
    daySnapshots?: daySnapshotUncheckedCreateNestedManyWithoutPoolInput
    hourSnapshots?: hourSnapshotUncheckedCreateNestedManyWithoutPoolInput
  }

  export type PoolCreateOrConnectWithoutToken0Input = {
    where: PoolWhereUniqueInput
    create: XOR<PoolCreateWithoutToken0Input, PoolUncheckedCreateWithoutToken0Input>
  }

  export type PoolCreateManyToken0InputEnvelope = {
    data: Enumerable<PoolCreateManyToken0Input>
    skipDuplicates?: boolean
  }

  export type PoolCreateWithoutToken1Input = {
    id: string
    name: string
    apr: number
    chainId: number
    version: string
    swapFee: number
    feeUSD: number
    reserve0?: string
    reserve1?: string
    liquidityUSD: number
    volumeUSD: number
    liquidity: number
    volume1d: number
    fees1d: number
    generatedAt?: Date | string
    updatedAt?: Date | string
    token0: TokenCreateNestedOneWithoutPools0Input
    daySnapshots?: daySnapshotCreateNestedManyWithoutPoolInput
    hourSnapshots?: hourSnapshotCreateNestedManyWithoutPoolInput
  }

  export type PoolUncheckedCreateWithoutToken1Input = {
    id: string
    name: string
    apr: number
    chainId: number
    version: string
    token0Id: string
    swapFee: number
    feeUSD: number
    reserve0?: string
    reserve1?: string
    liquidityUSD: number
    volumeUSD: number
    liquidity: number
    volume1d: number
    fees1d: number
    generatedAt?: Date | string
    updatedAt?: Date | string
    daySnapshots?: daySnapshotUncheckedCreateNestedManyWithoutPoolInput
    hourSnapshots?: hourSnapshotUncheckedCreateNestedManyWithoutPoolInput
  }

  export type PoolCreateOrConnectWithoutToken1Input = {
    where: PoolWhereUniqueInput
    create: XOR<PoolCreateWithoutToken1Input, PoolUncheckedCreateWithoutToken1Input>
  }

  export type PoolCreateManyToken1InputEnvelope = {
    data: Enumerable<PoolCreateManyToken1Input>
    skipDuplicates?: boolean
  }

  export type DozerPoolCreateWithoutToken0Input = {
    id: string
    name: string
    chainId: number
    version: string
    swapFee: number
    twapEnabled: boolean
    reserve0: string
    reserve1: string
    totalSupply: string
    liquidityUSD: number
    volumeUSD: number
    token0Price: string
    token1Price: string
    feeApr?: number
    incentiveApr?: number
    totalApr?: number
    isIncentivized?: boolean
    volume1d?: number
    fees1d?: number
    volume1w?: number
    fees1w?: number
    createdAtBlockNumber: bigint | number
    isBlacklisted?: boolean
    generatedAt?: Date | string
    updatedAt?: Date | string
    token1: TokenCreateNestedOneWithoutDozerPools1Input
    incentives?: IncentiveCreateNestedManyWithoutPoolInput
  }

  export type DozerPoolUncheckedCreateWithoutToken0Input = {
    id: string
    name: string
    chainId: number
    version: string
    token1Id: string
    swapFee: number
    twapEnabled: boolean
    reserve0: string
    reserve1: string
    totalSupply: string
    liquidityUSD: number
    volumeUSD: number
    token0Price: string
    token1Price: string
    feeApr?: number
    incentiveApr?: number
    totalApr?: number
    isIncentivized?: boolean
    volume1d?: number
    fees1d?: number
    volume1w?: number
    fees1w?: number
    createdAtBlockNumber: bigint | number
    isBlacklisted?: boolean
    generatedAt?: Date | string
    updatedAt?: Date | string
    incentives?: IncentiveUncheckedCreateNestedManyWithoutPoolInput
  }

  export type DozerPoolCreateOrConnectWithoutToken0Input = {
    where: DozerPoolWhereUniqueInput
    create: XOR<DozerPoolCreateWithoutToken0Input, DozerPoolUncheckedCreateWithoutToken0Input>
  }

  export type DozerPoolCreateManyToken0InputEnvelope = {
    data: Enumerable<DozerPoolCreateManyToken0Input>
    skipDuplicates?: boolean
  }

  export type DozerPoolCreateWithoutToken1Input = {
    id: string
    name: string
    chainId: number
    version: string
    swapFee: number
    twapEnabled: boolean
    reserve0: string
    reserve1: string
    totalSupply: string
    liquidityUSD: number
    volumeUSD: number
    token0Price: string
    token1Price: string
    feeApr?: number
    incentiveApr?: number
    totalApr?: number
    isIncentivized?: boolean
    volume1d?: number
    fees1d?: number
    volume1w?: number
    fees1w?: number
    createdAtBlockNumber: bigint | number
    isBlacklisted?: boolean
    generatedAt?: Date | string
    updatedAt?: Date | string
    token0: TokenCreateNestedOneWithoutDozerPools0Input
    incentives?: IncentiveCreateNestedManyWithoutPoolInput
  }

  export type DozerPoolUncheckedCreateWithoutToken1Input = {
    id: string
    name: string
    chainId: number
    version: string
    token0Id: string
    swapFee: number
    twapEnabled: boolean
    reserve0: string
    reserve1: string
    totalSupply: string
    liquidityUSD: number
    volumeUSD: number
    token0Price: string
    token1Price: string
    feeApr?: number
    incentiveApr?: number
    totalApr?: number
    isIncentivized?: boolean
    volume1d?: number
    fees1d?: number
    volume1w?: number
    fees1w?: number
    createdAtBlockNumber: bigint | number
    isBlacklisted?: boolean
    generatedAt?: Date | string
    updatedAt?: Date | string
    incentives?: IncentiveUncheckedCreateNestedManyWithoutPoolInput
  }

  export type DozerPoolCreateOrConnectWithoutToken1Input = {
    where: DozerPoolWhereUniqueInput
    create: XOR<DozerPoolCreateWithoutToken1Input, DozerPoolUncheckedCreateWithoutToken1Input>
  }

  export type DozerPoolCreateManyToken1InputEnvelope = {
    data: Enumerable<DozerPoolCreateManyToken1Input>
    skipDuplicates?: boolean
  }

  export type IncentiveCreateWithoutRewardTokenInput = {
    id: string
    chainId: number
    apr: number
    rewardPerDay: number
    pid: number
    rewarderAddress: string
    pool: DozerPoolCreateNestedOneWithoutIncentivesInput
  }

  export type IncentiveUncheckedCreateWithoutRewardTokenInput = {
    id: string
    chainId: number
    apr: number
    rewardPerDay: number
    poolId: string
    pid: number
    rewarderAddress: string
  }

  export type IncentiveCreateOrConnectWithoutRewardTokenInput = {
    where: IncentiveWhereUniqueInput
    create: XOR<IncentiveCreateWithoutRewardTokenInput, IncentiveUncheckedCreateWithoutRewardTokenInput>
  }

  export type IncentiveCreateManyRewardTokenInputEnvelope = {
    data: Enumerable<IncentiveCreateManyRewardTokenInput>
    skipDuplicates?: boolean
  }

  export type PoolUpsertWithWhereUniqueWithoutToken0Input = {
    where: PoolWhereUniqueInput
    update: XOR<PoolUpdateWithoutToken0Input, PoolUncheckedUpdateWithoutToken0Input>
    create: XOR<PoolCreateWithoutToken0Input, PoolUncheckedCreateWithoutToken0Input>
  }

  export type PoolUpdateWithWhereUniqueWithoutToken0Input = {
    where: PoolWhereUniqueInput
    data: XOR<PoolUpdateWithoutToken0Input, PoolUncheckedUpdateWithoutToken0Input>
  }

  export type PoolUpdateManyWithWhereWithoutToken0Input = {
    where: PoolScalarWhereInput
    data: XOR<PoolUpdateManyMutationInput, PoolUncheckedUpdateManyWithoutPools0Input>
  }

  export type PoolScalarWhereInput = {
    AND?: Enumerable<PoolScalarWhereInput>
    OR?: Enumerable<PoolScalarWhereInput>
    NOT?: Enumerable<PoolScalarWhereInput>
    id?: StringFilter | string
    name?: StringFilter | string
    apr?: FloatFilter | number
    chainId?: IntFilter | number
    version?: StringFilter | string
    token0Id?: StringFilter | string
    token1Id?: StringFilter | string
    swapFee?: FloatFilter | number
    feeUSD?: FloatFilter | number
    reserve0?: StringFilter | string
    reserve1?: StringFilter | string
    liquidityUSD?: FloatFilter | number
    volumeUSD?: FloatFilter | number
    liquidity?: FloatFilter | number
    volume1d?: FloatFilter | number
    fees1d?: FloatFilter | number
    generatedAt?: DateTimeFilter | Date | string
    updatedAt?: DateTimeFilter | Date | string
  }

  export type PoolUpsertWithWhereUniqueWithoutToken1Input = {
    where: PoolWhereUniqueInput
    update: XOR<PoolUpdateWithoutToken1Input, PoolUncheckedUpdateWithoutToken1Input>
    create: XOR<PoolCreateWithoutToken1Input, PoolUncheckedCreateWithoutToken1Input>
  }

  export type PoolUpdateWithWhereUniqueWithoutToken1Input = {
    where: PoolWhereUniqueInput
    data: XOR<PoolUpdateWithoutToken1Input, PoolUncheckedUpdateWithoutToken1Input>
  }

  export type PoolUpdateManyWithWhereWithoutToken1Input = {
    where: PoolScalarWhereInput
    data: XOR<PoolUpdateManyMutationInput, PoolUncheckedUpdateManyWithoutPools1Input>
  }

  export type DozerPoolUpsertWithWhereUniqueWithoutToken0Input = {
    where: DozerPoolWhereUniqueInput
    update: XOR<DozerPoolUpdateWithoutToken0Input, DozerPoolUncheckedUpdateWithoutToken0Input>
    create: XOR<DozerPoolCreateWithoutToken0Input, DozerPoolUncheckedCreateWithoutToken0Input>
  }

  export type DozerPoolUpdateWithWhereUniqueWithoutToken0Input = {
    where: DozerPoolWhereUniqueInput
    data: XOR<DozerPoolUpdateWithoutToken0Input, DozerPoolUncheckedUpdateWithoutToken0Input>
  }

  export type DozerPoolUpdateManyWithWhereWithoutToken0Input = {
    where: DozerPoolScalarWhereInput
    data: XOR<DozerPoolUpdateManyMutationInput, DozerPoolUncheckedUpdateManyWithoutDozerPools0Input>
  }

  export type DozerPoolScalarWhereInput = {
    AND?: Enumerable<DozerPoolScalarWhereInput>
    OR?: Enumerable<DozerPoolScalarWhereInput>
    NOT?: Enumerable<DozerPoolScalarWhereInput>
    id?: StringFilter | string
    name?: StringFilter | string
    chainId?: IntFilter | number
    version?: StringFilter | string
    token0Id?: StringFilter | string
    token1Id?: StringFilter | string
    swapFee?: FloatFilter | number
    twapEnabled?: BoolFilter | boolean
    reserve0?: StringFilter | string
    reserve1?: StringFilter | string
    totalSupply?: StringFilter | string
    liquidityUSD?: FloatFilter | number
    volumeUSD?: FloatFilter | number
    token0Price?: StringFilter | string
    token1Price?: StringFilter | string
    feeApr?: FloatFilter | number
    incentiveApr?: FloatFilter | number
    totalApr?: FloatFilter | number
    isIncentivized?: BoolFilter | boolean
    volume1d?: FloatFilter | number
    fees1d?: FloatFilter | number
    volume1w?: FloatFilter | number
    fees1w?: FloatFilter | number
    createdAtBlockNumber?: BigIntFilter | bigint | number
    isBlacklisted?: BoolFilter | boolean
    generatedAt?: DateTimeFilter | Date | string
    updatedAt?: DateTimeFilter | Date | string
  }

  export type DozerPoolUpsertWithWhereUniqueWithoutToken1Input = {
    where: DozerPoolWhereUniqueInput
    update: XOR<DozerPoolUpdateWithoutToken1Input, DozerPoolUncheckedUpdateWithoutToken1Input>
    create: XOR<DozerPoolCreateWithoutToken1Input, DozerPoolUncheckedCreateWithoutToken1Input>
  }

  export type DozerPoolUpdateWithWhereUniqueWithoutToken1Input = {
    where: DozerPoolWhereUniqueInput
    data: XOR<DozerPoolUpdateWithoutToken1Input, DozerPoolUncheckedUpdateWithoutToken1Input>
  }

  export type DozerPoolUpdateManyWithWhereWithoutToken1Input = {
    where: DozerPoolScalarWhereInput
    data: XOR<DozerPoolUpdateManyMutationInput, DozerPoolUncheckedUpdateManyWithoutDozerPools1Input>
  }

  export type IncentiveUpsertWithWhereUniqueWithoutRewardTokenInput = {
    where: IncentiveWhereUniqueInput
    update: XOR<IncentiveUpdateWithoutRewardTokenInput, IncentiveUncheckedUpdateWithoutRewardTokenInput>
    create: XOR<IncentiveCreateWithoutRewardTokenInput, IncentiveUncheckedCreateWithoutRewardTokenInput>
  }

  export type IncentiveUpdateWithWhereUniqueWithoutRewardTokenInput = {
    where: IncentiveWhereUniqueInput
    data: XOR<IncentiveUpdateWithoutRewardTokenInput, IncentiveUncheckedUpdateWithoutRewardTokenInput>
  }

  export type IncentiveUpdateManyWithWhereWithoutRewardTokenInput = {
    where: IncentiveScalarWhereInput
    data: XOR<IncentiveUpdateManyMutationInput, IncentiveUncheckedUpdateManyWithoutIncentivesInput>
  }

  export type IncentiveScalarWhereInput = {
    AND?: Enumerable<IncentiveScalarWhereInput>
    OR?: Enumerable<IncentiveScalarWhereInput>
    NOT?: Enumerable<IncentiveScalarWhereInput>
    id?: StringFilter | string
    chainId?: IntFilter | number
    apr?: FloatFilter | number
    rewardPerDay?: FloatFilter | number
    rewardTokenId?: StringFilter | string
    poolId?: StringFilter | string
    pid?: IntFilter | number
    rewarderAddress?: StringFilter | string
  }

  export type TokenCreateWithoutPools0Input = {
    id: string
    uuid: string
    chainId: number
    name: string
    symbol: string
    isFeeOnTransfer?: boolean
    isCommon?: boolean
    derivedUSD?: number | null
    generatedAt?: Date | string
    updatedAt?: Date | string
    decimals?: number
    pools1?: PoolCreateNestedManyWithoutToken1Input
    dozerPools0?: DozerPoolCreateNestedManyWithoutToken0Input
    dozerPools1?: DozerPoolCreateNestedManyWithoutToken1Input
    incentives?: IncentiveCreateNestedManyWithoutRewardTokenInput
  }

  export type TokenUncheckedCreateWithoutPools0Input = {
    id: string
    uuid: string
    chainId: number
    name: string
    symbol: string
    isFeeOnTransfer?: boolean
    isCommon?: boolean
    derivedUSD?: number | null
    generatedAt?: Date | string
    updatedAt?: Date | string
    decimals?: number
    pools1?: PoolUncheckedCreateNestedManyWithoutToken1Input
    dozerPools0?: DozerPoolUncheckedCreateNestedManyWithoutToken0Input
    dozerPools1?: DozerPoolUncheckedCreateNestedManyWithoutToken1Input
    incentives?: IncentiveUncheckedCreateNestedManyWithoutRewardTokenInput
  }

  export type TokenCreateOrConnectWithoutPools0Input = {
    where: TokenWhereUniqueInput
    create: XOR<TokenCreateWithoutPools0Input, TokenUncheckedCreateWithoutPools0Input>
  }

  export type TokenCreateWithoutPools1Input = {
    id: string
    uuid: string
    chainId: number
    name: string
    symbol: string
    isFeeOnTransfer?: boolean
    isCommon?: boolean
    derivedUSD?: number | null
    generatedAt?: Date | string
    updatedAt?: Date | string
    decimals?: number
    pools0?: PoolCreateNestedManyWithoutToken0Input
    dozerPools0?: DozerPoolCreateNestedManyWithoutToken0Input
    dozerPools1?: DozerPoolCreateNestedManyWithoutToken1Input
    incentives?: IncentiveCreateNestedManyWithoutRewardTokenInput
  }

  export type TokenUncheckedCreateWithoutPools1Input = {
    id: string
    uuid: string
    chainId: number
    name: string
    symbol: string
    isFeeOnTransfer?: boolean
    isCommon?: boolean
    derivedUSD?: number | null
    generatedAt?: Date | string
    updatedAt?: Date | string
    decimals?: number
    pools0?: PoolUncheckedCreateNestedManyWithoutToken0Input
    dozerPools0?: DozerPoolUncheckedCreateNestedManyWithoutToken0Input
    dozerPools1?: DozerPoolUncheckedCreateNestedManyWithoutToken1Input
    incentives?: IncentiveUncheckedCreateNestedManyWithoutRewardTokenInput
  }

  export type TokenCreateOrConnectWithoutPools1Input = {
    where: TokenWhereUniqueInput
    create: XOR<TokenCreateWithoutPools1Input, TokenUncheckedCreateWithoutPools1Input>
  }

  export type daySnapshotCreateWithoutPoolInput = {
    date: Date | string
    volumeUSD: number
    liquidityUSD: number
    apr: number
  }

  export type daySnapshotUncheckedCreateWithoutPoolInput = {
    id?: number
    date: Date | string
    volumeUSD: number
    liquidityUSD: number
    apr: number
  }

  export type daySnapshotCreateOrConnectWithoutPoolInput = {
    where: daySnapshotWhereUniqueInput
    create: XOR<daySnapshotCreateWithoutPoolInput, daySnapshotUncheckedCreateWithoutPoolInput>
  }

  export type daySnapshotCreateManyPoolInputEnvelope = {
    data: Enumerable<daySnapshotCreateManyPoolInput>
    skipDuplicates?: boolean
  }

  export type hourSnapshotCreateWithoutPoolInput = {
    date: Date | string
    volumeUSD: number
    liquidityUSD: number
    apr: number
  }

  export type hourSnapshotUncheckedCreateWithoutPoolInput = {
    id?: number
    date: Date | string
    volumeUSD: number
    liquidityUSD: number
    apr: number
  }

  export type hourSnapshotCreateOrConnectWithoutPoolInput = {
    where: hourSnapshotWhereUniqueInput
    create: XOR<hourSnapshotCreateWithoutPoolInput, hourSnapshotUncheckedCreateWithoutPoolInput>
  }

  export type hourSnapshotCreateManyPoolInputEnvelope = {
    data: Enumerable<hourSnapshotCreateManyPoolInput>
    skipDuplicates?: boolean
  }

  export type TokenUpsertWithoutPools0Input = {
    update: XOR<TokenUpdateWithoutPools0Input, TokenUncheckedUpdateWithoutPools0Input>
    create: XOR<TokenCreateWithoutPools0Input, TokenUncheckedCreateWithoutPools0Input>
  }

  export type TokenUpdateWithoutPools0Input = {
    id?: StringFieldUpdateOperationsInput | string
    uuid?: StringFieldUpdateOperationsInput | string
    chainId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    isFeeOnTransfer?: BoolFieldUpdateOperationsInput | boolean
    isCommon?: BoolFieldUpdateOperationsInput | boolean
    derivedUSD?: NullableFloatFieldUpdateOperationsInput | number | null
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    decimals?: IntFieldUpdateOperationsInput | number
    pools1?: PoolUpdateManyWithoutToken1NestedInput
    dozerPools0?: DozerPoolUpdateManyWithoutToken0NestedInput
    dozerPools1?: DozerPoolUpdateManyWithoutToken1NestedInput
    incentives?: IncentiveUpdateManyWithoutRewardTokenNestedInput
  }

  export type TokenUncheckedUpdateWithoutPools0Input = {
    id?: StringFieldUpdateOperationsInput | string
    uuid?: StringFieldUpdateOperationsInput | string
    chainId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    isFeeOnTransfer?: BoolFieldUpdateOperationsInput | boolean
    isCommon?: BoolFieldUpdateOperationsInput | boolean
    derivedUSD?: NullableFloatFieldUpdateOperationsInput | number | null
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    decimals?: IntFieldUpdateOperationsInput | number
    pools1?: PoolUncheckedUpdateManyWithoutToken1NestedInput
    dozerPools0?: DozerPoolUncheckedUpdateManyWithoutToken0NestedInput
    dozerPools1?: DozerPoolUncheckedUpdateManyWithoutToken1NestedInput
    incentives?: IncentiveUncheckedUpdateManyWithoutRewardTokenNestedInput
  }

  export type TokenUpsertWithoutPools1Input = {
    update: XOR<TokenUpdateWithoutPools1Input, TokenUncheckedUpdateWithoutPools1Input>
    create: XOR<TokenCreateWithoutPools1Input, TokenUncheckedCreateWithoutPools1Input>
  }

  export type TokenUpdateWithoutPools1Input = {
    id?: StringFieldUpdateOperationsInput | string
    uuid?: StringFieldUpdateOperationsInput | string
    chainId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    isFeeOnTransfer?: BoolFieldUpdateOperationsInput | boolean
    isCommon?: BoolFieldUpdateOperationsInput | boolean
    derivedUSD?: NullableFloatFieldUpdateOperationsInput | number | null
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    decimals?: IntFieldUpdateOperationsInput | number
    pools0?: PoolUpdateManyWithoutToken0NestedInput
    dozerPools0?: DozerPoolUpdateManyWithoutToken0NestedInput
    dozerPools1?: DozerPoolUpdateManyWithoutToken1NestedInput
    incentives?: IncentiveUpdateManyWithoutRewardTokenNestedInput
  }

  export type TokenUncheckedUpdateWithoutPools1Input = {
    id?: StringFieldUpdateOperationsInput | string
    uuid?: StringFieldUpdateOperationsInput | string
    chainId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    isFeeOnTransfer?: BoolFieldUpdateOperationsInput | boolean
    isCommon?: BoolFieldUpdateOperationsInput | boolean
    derivedUSD?: NullableFloatFieldUpdateOperationsInput | number | null
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    decimals?: IntFieldUpdateOperationsInput | number
    pools0?: PoolUncheckedUpdateManyWithoutToken0NestedInput
    dozerPools0?: DozerPoolUncheckedUpdateManyWithoutToken0NestedInput
    dozerPools1?: DozerPoolUncheckedUpdateManyWithoutToken1NestedInput
    incentives?: IncentiveUncheckedUpdateManyWithoutRewardTokenNestedInput
  }

  export type daySnapshotUpsertWithWhereUniqueWithoutPoolInput = {
    where: daySnapshotWhereUniqueInput
    update: XOR<daySnapshotUpdateWithoutPoolInput, daySnapshotUncheckedUpdateWithoutPoolInput>
    create: XOR<daySnapshotCreateWithoutPoolInput, daySnapshotUncheckedCreateWithoutPoolInput>
  }

  export type daySnapshotUpdateWithWhereUniqueWithoutPoolInput = {
    where: daySnapshotWhereUniqueInput
    data: XOR<daySnapshotUpdateWithoutPoolInput, daySnapshotUncheckedUpdateWithoutPoolInput>
  }

  export type daySnapshotUpdateManyWithWhereWithoutPoolInput = {
    where: daySnapshotScalarWhereInput
    data: XOR<daySnapshotUpdateManyMutationInput, daySnapshotUncheckedUpdateManyWithoutDaySnapshotsInput>
  }

  export type daySnapshotScalarWhereInput = {
    AND?: Enumerable<daySnapshotScalarWhereInput>
    OR?: Enumerable<daySnapshotScalarWhereInput>
    NOT?: Enumerable<daySnapshotScalarWhereInput>
    id?: IntFilter | number
    poolId?: StringFilter | string
    date?: DateTimeFilter | Date | string
    volumeUSD?: FloatFilter | number
    liquidityUSD?: FloatFilter | number
    apr?: FloatFilter | number
  }

  export type hourSnapshotUpsertWithWhereUniqueWithoutPoolInput = {
    where: hourSnapshotWhereUniqueInput
    update: XOR<hourSnapshotUpdateWithoutPoolInput, hourSnapshotUncheckedUpdateWithoutPoolInput>
    create: XOR<hourSnapshotCreateWithoutPoolInput, hourSnapshotUncheckedCreateWithoutPoolInput>
  }

  export type hourSnapshotUpdateWithWhereUniqueWithoutPoolInput = {
    where: hourSnapshotWhereUniqueInput
    data: XOR<hourSnapshotUpdateWithoutPoolInput, hourSnapshotUncheckedUpdateWithoutPoolInput>
  }

  export type hourSnapshotUpdateManyWithWhereWithoutPoolInput = {
    where: hourSnapshotScalarWhereInput
    data: XOR<hourSnapshotUpdateManyMutationInput, hourSnapshotUncheckedUpdateManyWithoutHourSnapshotsInput>
  }

  export type hourSnapshotScalarWhereInput = {
    AND?: Enumerable<hourSnapshotScalarWhereInput>
    OR?: Enumerable<hourSnapshotScalarWhereInput>
    NOT?: Enumerable<hourSnapshotScalarWhereInput>
    id?: IntFilter | number
    poolId?: StringFilter | string
    date?: DateTimeFilter | Date | string
    volumeUSD?: FloatFilter | number
    liquidityUSD?: FloatFilter | number
    apr?: FloatFilter | number
  }

  export type PoolCreateWithoutDaySnapshotsInput = {
    id: string
    name: string
    apr: number
    chainId: number
    version: string
    swapFee: number
    feeUSD: number
    reserve0?: string
    reserve1?: string
    liquidityUSD: number
    volumeUSD: number
    liquidity: number
    volume1d: number
    fees1d: number
    generatedAt?: Date | string
    updatedAt?: Date | string
    token0: TokenCreateNestedOneWithoutPools0Input
    token1: TokenCreateNestedOneWithoutPools1Input
    hourSnapshots?: hourSnapshotCreateNestedManyWithoutPoolInput
  }

  export type PoolUncheckedCreateWithoutDaySnapshotsInput = {
    id: string
    name: string
    apr: number
    chainId: number
    version: string
    token0Id: string
    token1Id: string
    swapFee: number
    feeUSD: number
    reserve0?: string
    reserve1?: string
    liquidityUSD: number
    volumeUSD: number
    liquidity: number
    volume1d: number
    fees1d: number
    generatedAt?: Date | string
    updatedAt?: Date | string
    hourSnapshots?: hourSnapshotUncheckedCreateNestedManyWithoutPoolInput
  }

  export type PoolCreateOrConnectWithoutDaySnapshotsInput = {
    where: PoolWhereUniqueInput
    create: XOR<PoolCreateWithoutDaySnapshotsInput, PoolUncheckedCreateWithoutDaySnapshotsInput>
  }

  export type PoolUpsertWithoutDaySnapshotsInput = {
    update: XOR<PoolUpdateWithoutDaySnapshotsInput, PoolUncheckedUpdateWithoutDaySnapshotsInput>
    create: XOR<PoolCreateWithoutDaySnapshotsInput, PoolUncheckedCreateWithoutDaySnapshotsInput>
  }

  export type PoolUpdateWithoutDaySnapshotsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    apr?: FloatFieldUpdateOperationsInput | number
    chainId?: IntFieldUpdateOperationsInput | number
    version?: StringFieldUpdateOperationsInput | string
    swapFee?: FloatFieldUpdateOperationsInput | number
    feeUSD?: FloatFieldUpdateOperationsInput | number
    reserve0?: StringFieldUpdateOperationsInput | string
    reserve1?: StringFieldUpdateOperationsInput | string
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    liquidity?: FloatFieldUpdateOperationsInput | number
    volume1d?: FloatFieldUpdateOperationsInput | number
    fees1d?: FloatFieldUpdateOperationsInput | number
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    token0?: TokenUpdateOneRequiredWithoutPools0NestedInput
    token1?: TokenUpdateOneRequiredWithoutPools1NestedInput
    hourSnapshots?: hourSnapshotUpdateManyWithoutPoolNestedInput
  }

  export type PoolUncheckedUpdateWithoutDaySnapshotsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    apr?: FloatFieldUpdateOperationsInput | number
    chainId?: IntFieldUpdateOperationsInput | number
    version?: StringFieldUpdateOperationsInput | string
    token0Id?: StringFieldUpdateOperationsInput | string
    token1Id?: StringFieldUpdateOperationsInput | string
    swapFee?: FloatFieldUpdateOperationsInput | number
    feeUSD?: FloatFieldUpdateOperationsInput | number
    reserve0?: StringFieldUpdateOperationsInput | string
    reserve1?: StringFieldUpdateOperationsInput | string
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    liquidity?: FloatFieldUpdateOperationsInput | number
    volume1d?: FloatFieldUpdateOperationsInput | number
    fees1d?: FloatFieldUpdateOperationsInput | number
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    hourSnapshots?: hourSnapshotUncheckedUpdateManyWithoutPoolNestedInput
  }

  export type PoolCreateWithoutHourSnapshotsInput = {
    id: string
    name: string
    apr: number
    chainId: number
    version: string
    swapFee: number
    feeUSD: number
    reserve0?: string
    reserve1?: string
    liquidityUSD: number
    volumeUSD: number
    liquidity: number
    volume1d: number
    fees1d: number
    generatedAt?: Date | string
    updatedAt?: Date | string
    token0: TokenCreateNestedOneWithoutPools0Input
    token1: TokenCreateNestedOneWithoutPools1Input
    daySnapshots?: daySnapshotCreateNestedManyWithoutPoolInput
  }

  export type PoolUncheckedCreateWithoutHourSnapshotsInput = {
    id: string
    name: string
    apr: number
    chainId: number
    version: string
    token0Id: string
    token1Id: string
    swapFee: number
    feeUSD: number
    reserve0?: string
    reserve1?: string
    liquidityUSD: number
    volumeUSD: number
    liquidity: number
    volume1d: number
    fees1d: number
    generatedAt?: Date | string
    updatedAt?: Date | string
    daySnapshots?: daySnapshotUncheckedCreateNestedManyWithoutPoolInput
  }

  export type PoolCreateOrConnectWithoutHourSnapshotsInput = {
    where: PoolWhereUniqueInput
    create: XOR<PoolCreateWithoutHourSnapshotsInput, PoolUncheckedCreateWithoutHourSnapshotsInput>
  }

  export type PoolUpsertWithoutHourSnapshotsInput = {
    update: XOR<PoolUpdateWithoutHourSnapshotsInput, PoolUncheckedUpdateWithoutHourSnapshotsInput>
    create: XOR<PoolCreateWithoutHourSnapshotsInput, PoolUncheckedCreateWithoutHourSnapshotsInput>
  }

  export type PoolUpdateWithoutHourSnapshotsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    apr?: FloatFieldUpdateOperationsInput | number
    chainId?: IntFieldUpdateOperationsInput | number
    version?: StringFieldUpdateOperationsInput | string
    swapFee?: FloatFieldUpdateOperationsInput | number
    feeUSD?: FloatFieldUpdateOperationsInput | number
    reserve0?: StringFieldUpdateOperationsInput | string
    reserve1?: StringFieldUpdateOperationsInput | string
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    liquidity?: FloatFieldUpdateOperationsInput | number
    volume1d?: FloatFieldUpdateOperationsInput | number
    fees1d?: FloatFieldUpdateOperationsInput | number
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    token0?: TokenUpdateOneRequiredWithoutPools0NestedInput
    token1?: TokenUpdateOneRequiredWithoutPools1NestedInput
    daySnapshots?: daySnapshotUpdateManyWithoutPoolNestedInput
  }

  export type PoolUncheckedUpdateWithoutHourSnapshotsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    apr?: FloatFieldUpdateOperationsInput | number
    chainId?: IntFieldUpdateOperationsInput | number
    version?: StringFieldUpdateOperationsInput | string
    token0Id?: StringFieldUpdateOperationsInput | string
    token1Id?: StringFieldUpdateOperationsInput | string
    swapFee?: FloatFieldUpdateOperationsInput | number
    feeUSD?: FloatFieldUpdateOperationsInput | number
    reserve0?: StringFieldUpdateOperationsInput | string
    reserve1?: StringFieldUpdateOperationsInput | string
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    liquidity?: FloatFieldUpdateOperationsInput | number
    volume1d?: FloatFieldUpdateOperationsInput | number
    fees1d?: FloatFieldUpdateOperationsInput | number
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    daySnapshots?: daySnapshotUncheckedUpdateManyWithoutPoolNestedInput
  }

  export type TokenCreateWithoutDozerPools0Input = {
    id: string
    uuid: string
    chainId: number
    name: string
    symbol: string
    isFeeOnTransfer?: boolean
    isCommon?: boolean
    derivedUSD?: number | null
    generatedAt?: Date | string
    updatedAt?: Date | string
    decimals?: number
    pools0?: PoolCreateNestedManyWithoutToken0Input
    pools1?: PoolCreateNestedManyWithoutToken1Input
    dozerPools1?: DozerPoolCreateNestedManyWithoutToken1Input
    incentives?: IncentiveCreateNestedManyWithoutRewardTokenInput
  }

  export type TokenUncheckedCreateWithoutDozerPools0Input = {
    id: string
    uuid: string
    chainId: number
    name: string
    symbol: string
    isFeeOnTransfer?: boolean
    isCommon?: boolean
    derivedUSD?: number | null
    generatedAt?: Date | string
    updatedAt?: Date | string
    decimals?: number
    pools0?: PoolUncheckedCreateNestedManyWithoutToken0Input
    pools1?: PoolUncheckedCreateNestedManyWithoutToken1Input
    dozerPools1?: DozerPoolUncheckedCreateNestedManyWithoutToken1Input
    incentives?: IncentiveUncheckedCreateNestedManyWithoutRewardTokenInput
  }

  export type TokenCreateOrConnectWithoutDozerPools0Input = {
    where: TokenWhereUniqueInput
    create: XOR<TokenCreateWithoutDozerPools0Input, TokenUncheckedCreateWithoutDozerPools0Input>
  }

  export type TokenCreateWithoutDozerPools1Input = {
    id: string
    uuid: string
    chainId: number
    name: string
    symbol: string
    isFeeOnTransfer?: boolean
    isCommon?: boolean
    derivedUSD?: number | null
    generatedAt?: Date | string
    updatedAt?: Date | string
    decimals?: number
    pools0?: PoolCreateNestedManyWithoutToken0Input
    pools1?: PoolCreateNestedManyWithoutToken1Input
    dozerPools0?: DozerPoolCreateNestedManyWithoutToken0Input
    incentives?: IncentiveCreateNestedManyWithoutRewardTokenInput
  }

  export type TokenUncheckedCreateWithoutDozerPools1Input = {
    id: string
    uuid: string
    chainId: number
    name: string
    symbol: string
    isFeeOnTransfer?: boolean
    isCommon?: boolean
    derivedUSD?: number | null
    generatedAt?: Date | string
    updatedAt?: Date | string
    decimals?: number
    pools0?: PoolUncheckedCreateNestedManyWithoutToken0Input
    pools1?: PoolUncheckedCreateNestedManyWithoutToken1Input
    dozerPools0?: DozerPoolUncheckedCreateNestedManyWithoutToken0Input
    incentives?: IncentiveUncheckedCreateNestedManyWithoutRewardTokenInput
  }

  export type TokenCreateOrConnectWithoutDozerPools1Input = {
    where: TokenWhereUniqueInput
    create: XOR<TokenCreateWithoutDozerPools1Input, TokenUncheckedCreateWithoutDozerPools1Input>
  }

  export type IncentiveCreateWithoutPoolInput = {
    id: string
    chainId: number
    apr: number
    rewardPerDay: number
    pid: number
    rewarderAddress: string
    rewardToken: TokenCreateNestedOneWithoutIncentivesInput
  }

  export type IncentiveUncheckedCreateWithoutPoolInput = {
    id: string
    chainId: number
    apr: number
    rewardPerDay: number
    rewardTokenId: string
    pid: number
    rewarderAddress: string
  }

  export type IncentiveCreateOrConnectWithoutPoolInput = {
    where: IncentiveWhereUniqueInput
    create: XOR<IncentiveCreateWithoutPoolInput, IncentiveUncheckedCreateWithoutPoolInput>
  }

  export type IncentiveCreateManyPoolInputEnvelope = {
    data: Enumerable<IncentiveCreateManyPoolInput>
    skipDuplicates?: boolean
  }

  export type TokenUpsertWithoutDozerPools0Input = {
    update: XOR<TokenUpdateWithoutDozerPools0Input, TokenUncheckedUpdateWithoutDozerPools0Input>
    create: XOR<TokenCreateWithoutDozerPools0Input, TokenUncheckedCreateWithoutDozerPools0Input>
  }

  export type TokenUpdateWithoutDozerPools0Input = {
    id?: StringFieldUpdateOperationsInput | string
    uuid?: StringFieldUpdateOperationsInput | string
    chainId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    isFeeOnTransfer?: BoolFieldUpdateOperationsInput | boolean
    isCommon?: BoolFieldUpdateOperationsInput | boolean
    derivedUSD?: NullableFloatFieldUpdateOperationsInput | number | null
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    decimals?: IntFieldUpdateOperationsInput | number
    pools0?: PoolUpdateManyWithoutToken0NestedInput
    pools1?: PoolUpdateManyWithoutToken1NestedInput
    dozerPools1?: DozerPoolUpdateManyWithoutToken1NestedInput
    incentives?: IncentiveUpdateManyWithoutRewardTokenNestedInput
  }

  export type TokenUncheckedUpdateWithoutDozerPools0Input = {
    id?: StringFieldUpdateOperationsInput | string
    uuid?: StringFieldUpdateOperationsInput | string
    chainId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    isFeeOnTransfer?: BoolFieldUpdateOperationsInput | boolean
    isCommon?: BoolFieldUpdateOperationsInput | boolean
    derivedUSD?: NullableFloatFieldUpdateOperationsInput | number | null
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    decimals?: IntFieldUpdateOperationsInput | number
    pools0?: PoolUncheckedUpdateManyWithoutToken0NestedInput
    pools1?: PoolUncheckedUpdateManyWithoutToken1NestedInput
    dozerPools1?: DozerPoolUncheckedUpdateManyWithoutToken1NestedInput
    incentives?: IncentiveUncheckedUpdateManyWithoutRewardTokenNestedInput
  }

  export type TokenUpsertWithoutDozerPools1Input = {
    update: XOR<TokenUpdateWithoutDozerPools1Input, TokenUncheckedUpdateWithoutDozerPools1Input>
    create: XOR<TokenCreateWithoutDozerPools1Input, TokenUncheckedCreateWithoutDozerPools1Input>
  }

  export type TokenUpdateWithoutDozerPools1Input = {
    id?: StringFieldUpdateOperationsInput | string
    uuid?: StringFieldUpdateOperationsInput | string
    chainId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    isFeeOnTransfer?: BoolFieldUpdateOperationsInput | boolean
    isCommon?: BoolFieldUpdateOperationsInput | boolean
    derivedUSD?: NullableFloatFieldUpdateOperationsInput | number | null
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    decimals?: IntFieldUpdateOperationsInput | number
    pools0?: PoolUpdateManyWithoutToken0NestedInput
    pools1?: PoolUpdateManyWithoutToken1NestedInput
    dozerPools0?: DozerPoolUpdateManyWithoutToken0NestedInput
    incentives?: IncentiveUpdateManyWithoutRewardTokenNestedInput
  }

  export type TokenUncheckedUpdateWithoutDozerPools1Input = {
    id?: StringFieldUpdateOperationsInput | string
    uuid?: StringFieldUpdateOperationsInput | string
    chainId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    isFeeOnTransfer?: BoolFieldUpdateOperationsInput | boolean
    isCommon?: BoolFieldUpdateOperationsInput | boolean
    derivedUSD?: NullableFloatFieldUpdateOperationsInput | number | null
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    decimals?: IntFieldUpdateOperationsInput | number
    pools0?: PoolUncheckedUpdateManyWithoutToken0NestedInput
    pools1?: PoolUncheckedUpdateManyWithoutToken1NestedInput
    dozerPools0?: DozerPoolUncheckedUpdateManyWithoutToken0NestedInput
    incentives?: IncentiveUncheckedUpdateManyWithoutRewardTokenNestedInput
  }

  export type IncentiveUpsertWithWhereUniqueWithoutPoolInput = {
    where: IncentiveWhereUniqueInput
    update: XOR<IncentiveUpdateWithoutPoolInput, IncentiveUncheckedUpdateWithoutPoolInput>
    create: XOR<IncentiveCreateWithoutPoolInput, IncentiveUncheckedCreateWithoutPoolInput>
  }

  export type IncentiveUpdateWithWhereUniqueWithoutPoolInput = {
    where: IncentiveWhereUniqueInput
    data: XOR<IncentiveUpdateWithoutPoolInput, IncentiveUncheckedUpdateWithoutPoolInput>
  }

  export type IncentiveUpdateManyWithWhereWithoutPoolInput = {
    where: IncentiveScalarWhereInput
    data: XOR<IncentiveUpdateManyMutationInput, IncentiveUncheckedUpdateManyWithoutIncentivesInput>
  }

  export type TokenCreateWithoutIncentivesInput = {
    id: string
    uuid: string
    chainId: number
    name: string
    symbol: string
    isFeeOnTransfer?: boolean
    isCommon?: boolean
    derivedUSD?: number | null
    generatedAt?: Date | string
    updatedAt?: Date | string
    decimals?: number
    pools0?: PoolCreateNestedManyWithoutToken0Input
    pools1?: PoolCreateNestedManyWithoutToken1Input
    dozerPools0?: DozerPoolCreateNestedManyWithoutToken0Input
    dozerPools1?: DozerPoolCreateNestedManyWithoutToken1Input
  }

  export type TokenUncheckedCreateWithoutIncentivesInput = {
    id: string
    uuid: string
    chainId: number
    name: string
    symbol: string
    isFeeOnTransfer?: boolean
    isCommon?: boolean
    derivedUSD?: number | null
    generatedAt?: Date | string
    updatedAt?: Date | string
    decimals?: number
    pools0?: PoolUncheckedCreateNestedManyWithoutToken0Input
    pools1?: PoolUncheckedCreateNestedManyWithoutToken1Input
    dozerPools0?: DozerPoolUncheckedCreateNestedManyWithoutToken0Input
    dozerPools1?: DozerPoolUncheckedCreateNestedManyWithoutToken1Input
  }

  export type TokenCreateOrConnectWithoutIncentivesInput = {
    where: TokenWhereUniqueInput
    create: XOR<TokenCreateWithoutIncentivesInput, TokenUncheckedCreateWithoutIncentivesInput>
  }

  export type DozerPoolCreateWithoutIncentivesInput = {
    id: string
    name: string
    chainId: number
    version: string
    swapFee: number
    twapEnabled: boolean
    reserve0: string
    reserve1: string
    totalSupply: string
    liquidityUSD: number
    volumeUSD: number
    token0Price: string
    token1Price: string
    feeApr?: number
    incentiveApr?: number
    totalApr?: number
    isIncentivized?: boolean
    volume1d?: number
    fees1d?: number
    volume1w?: number
    fees1w?: number
    createdAtBlockNumber: bigint | number
    isBlacklisted?: boolean
    generatedAt?: Date | string
    updatedAt?: Date | string
    token0: TokenCreateNestedOneWithoutDozerPools0Input
    token1: TokenCreateNestedOneWithoutDozerPools1Input
  }

  export type DozerPoolUncheckedCreateWithoutIncentivesInput = {
    id: string
    name: string
    chainId: number
    version: string
    token0Id: string
    token1Id: string
    swapFee: number
    twapEnabled: boolean
    reserve0: string
    reserve1: string
    totalSupply: string
    liquidityUSD: number
    volumeUSD: number
    token0Price: string
    token1Price: string
    feeApr?: number
    incentiveApr?: number
    totalApr?: number
    isIncentivized?: boolean
    volume1d?: number
    fees1d?: number
    volume1w?: number
    fees1w?: number
    createdAtBlockNumber: bigint | number
    isBlacklisted?: boolean
    generatedAt?: Date | string
    updatedAt?: Date | string
  }

  export type DozerPoolCreateOrConnectWithoutIncentivesInput = {
    where: DozerPoolWhereUniqueInput
    create: XOR<DozerPoolCreateWithoutIncentivesInput, DozerPoolUncheckedCreateWithoutIncentivesInput>
  }

  export type TokenUpsertWithoutIncentivesInput = {
    update: XOR<TokenUpdateWithoutIncentivesInput, TokenUncheckedUpdateWithoutIncentivesInput>
    create: XOR<TokenCreateWithoutIncentivesInput, TokenUncheckedCreateWithoutIncentivesInput>
  }

  export type TokenUpdateWithoutIncentivesInput = {
    id?: StringFieldUpdateOperationsInput | string
    uuid?: StringFieldUpdateOperationsInput | string
    chainId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    isFeeOnTransfer?: BoolFieldUpdateOperationsInput | boolean
    isCommon?: BoolFieldUpdateOperationsInput | boolean
    derivedUSD?: NullableFloatFieldUpdateOperationsInput | number | null
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    decimals?: IntFieldUpdateOperationsInput | number
    pools0?: PoolUpdateManyWithoutToken0NestedInput
    pools1?: PoolUpdateManyWithoutToken1NestedInput
    dozerPools0?: DozerPoolUpdateManyWithoutToken0NestedInput
    dozerPools1?: DozerPoolUpdateManyWithoutToken1NestedInput
  }

  export type TokenUncheckedUpdateWithoutIncentivesInput = {
    id?: StringFieldUpdateOperationsInput | string
    uuid?: StringFieldUpdateOperationsInput | string
    chainId?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    isFeeOnTransfer?: BoolFieldUpdateOperationsInput | boolean
    isCommon?: BoolFieldUpdateOperationsInput | boolean
    derivedUSD?: NullableFloatFieldUpdateOperationsInput | number | null
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    decimals?: IntFieldUpdateOperationsInput | number
    pools0?: PoolUncheckedUpdateManyWithoutToken0NestedInput
    pools1?: PoolUncheckedUpdateManyWithoutToken1NestedInput
    dozerPools0?: DozerPoolUncheckedUpdateManyWithoutToken0NestedInput
    dozerPools1?: DozerPoolUncheckedUpdateManyWithoutToken1NestedInput
  }

  export type DozerPoolUpsertWithoutIncentivesInput = {
    update: XOR<DozerPoolUpdateWithoutIncentivesInput, DozerPoolUncheckedUpdateWithoutIncentivesInput>
    create: XOR<DozerPoolCreateWithoutIncentivesInput, DozerPoolUncheckedCreateWithoutIncentivesInput>
  }

  export type DozerPoolUpdateWithoutIncentivesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    chainId?: IntFieldUpdateOperationsInput | number
    version?: StringFieldUpdateOperationsInput | string
    swapFee?: FloatFieldUpdateOperationsInput | number
    twapEnabled?: BoolFieldUpdateOperationsInput | boolean
    reserve0?: StringFieldUpdateOperationsInput | string
    reserve1?: StringFieldUpdateOperationsInput | string
    totalSupply?: StringFieldUpdateOperationsInput | string
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    token0Price?: StringFieldUpdateOperationsInput | string
    token1Price?: StringFieldUpdateOperationsInput | string
    feeApr?: FloatFieldUpdateOperationsInput | number
    incentiveApr?: FloatFieldUpdateOperationsInput | number
    totalApr?: FloatFieldUpdateOperationsInput | number
    isIncentivized?: BoolFieldUpdateOperationsInput | boolean
    volume1d?: FloatFieldUpdateOperationsInput | number
    fees1d?: FloatFieldUpdateOperationsInput | number
    volume1w?: FloatFieldUpdateOperationsInput | number
    fees1w?: FloatFieldUpdateOperationsInput | number
    createdAtBlockNumber?: BigIntFieldUpdateOperationsInput | bigint | number
    isBlacklisted?: BoolFieldUpdateOperationsInput | boolean
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    token0?: TokenUpdateOneRequiredWithoutDozerPools0NestedInput
    token1?: TokenUpdateOneRequiredWithoutDozerPools1NestedInput
  }

  export type DozerPoolUncheckedUpdateWithoutIncentivesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    chainId?: IntFieldUpdateOperationsInput | number
    version?: StringFieldUpdateOperationsInput | string
    token0Id?: StringFieldUpdateOperationsInput | string
    token1Id?: StringFieldUpdateOperationsInput | string
    swapFee?: FloatFieldUpdateOperationsInput | number
    twapEnabled?: BoolFieldUpdateOperationsInput | boolean
    reserve0?: StringFieldUpdateOperationsInput | string
    reserve1?: StringFieldUpdateOperationsInput | string
    totalSupply?: StringFieldUpdateOperationsInput | string
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    token0Price?: StringFieldUpdateOperationsInput | string
    token1Price?: StringFieldUpdateOperationsInput | string
    feeApr?: FloatFieldUpdateOperationsInput | number
    incentiveApr?: FloatFieldUpdateOperationsInput | number
    totalApr?: FloatFieldUpdateOperationsInput | number
    isIncentivized?: BoolFieldUpdateOperationsInput | boolean
    volume1d?: FloatFieldUpdateOperationsInput | number
    fees1d?: FloatFieldUpdateOperationsInput | number
    volume1w?: FloatFieldUpdateOperationsInput | number
    fees1w?: FloatFieldUpdateOperationsInput | number
    createdAtBlockNumber?: BigIntFieldUpdateOperationsInput | bigint | number
    isBlacklisted?: BoolFieldUpdateOperationsInput | boolean
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PoolCreateManyToken0Input = {
    id: string
    name: string
    apr: number
    chainId: number
    version: string
    token1Id: string
    swapFee: number
    feeUSD: number
    reserve0?: string
    reserve1?: string
    liquidityUSD: number
    volumeUSD: number
    liquidity: number
    volume1d: number
    fees1d: number
    generatedAt?: Date | string
    updatedAt?: Date | string
  }

  export type PoolCreateManyToken1Input = {
    id: string
    name: string
    apr: number
    chainId: number
    version: string
    token0Id: string
    swapFee: number
    feeUSD: number
    reserve0?: string
    reserve1?: string
    liquidityUSD: number
    volumeUSD: number
    liquidity: number
    volume1d: number
    fees1d: number
    generatedAt?: Date | string
    updatedAt?: Date | string
  }

  export type DozerPoolCreateManyToken0Input = {
    id: string
    name: string
    chainId: number
    version: string
    token1Id: string
    swapFee: number
    twapEnabled: boolean
    reserve0: string
    reserve1: string
    totalSupply: string
    liquidityUSD: number
    volumeUSD: number
    token0Price: string
    token1Price: string
    feeApr?: number
    incentiveApr?: number
    totalApr?: number
    isIncentivized?: boolean
    volume1d?: number
    fees1d?: number
    volume1w?: number
    fees1w?: number
    createdAtBlockNumber: bigint | number
    isBlacklisted?: boolean
    generatedAt?: Date | string
    updatedAt?: Date | string
  }

  export type DozerPoolCreateManyToken1Input = {
    id: string
    name: string
    chainId: number
    version: string
    token0Id: string
    swapFee: number
    twapEnabled: boolean
    reserve0: string
    reserve1: string
    totalSupply: string
    liquidityUSD: number
    volumeUSD: number
    token0Price: string
    token1Price: string
    feeApr?: number
    incentiveApr?: number
    totalApr?: number
    isIncentivized?: boolean
    volume1d?: number
    fees1d?: number
    volume1w?: number
    fees1w?: number
    createdAtBlockNumber: bigint | number
    isBlacklisted?: boolean
    generatedAt?: Date | string
    updatedAt?: Date | string
  }

  export type IncentiveCreateManyRewardTokenInput = {
    id: string
    chainId: number
    apr: number
    rewardPerDay: number
    poolId: string
    pid: number
    rewarderAddress: string
  }

  export type PoolUpdateWithoutToken0Input = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    apr?: FloatFieldUpdateOperationsInput | number
    chainId?: IntFieldUpdateOperationsInput | number
    version?: StringFieldUpdateOperationsInput | string
    swapFee?: FloatFieldUpdateOperationsInput | number
    feeUSD?: FloatFieldUpdateOperationsInput | number
    reserve0?: StringFieldUpdateOperationsInput | string
    reserve1?: StringFieldUpdateOperationsInput | string
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    liquidity?: FloatFieldUpdateOperationsInput | number
    volume1d?: FloatFieldUpdateOperationsInput | number
    fees1d?: FloatFieldUpdateOperationsInput | number
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    token1?: TokenUpdateOneRequiredWithoutPools1NestedInput
    daySnapshots?: daySnapshotUpdateManyWithoutPoolNestedInput
    hourSnapshots?: hourSnapshotUpdateManyWithoutPoolNestedInput
  }

  export type PoolUncheckedUpdateWithoutToken0Input = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    apr?: FloatFieldUpdateOperationsInput | number
    chainId?: IntFieldUpdateOperationsInput | number
    version?: StringFieldUpdateOperationsInput | string
    token1Id?: StringFieldUpdateOperationsInput | string
    swapFee?: FloatFieldUpdateOperationsInput | number
    feeUSD?: FloatFieldUpdateOperationsInput | number
    reserve0?: StringFieldUpdateOperationsInput | string
    reserve1?: StringFieldUpdateOperationsInput | string
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    liquidity?: FloatFieldUpdateOperationsInput | number
    volume1d?: FloatFieldUpdateOperationsInput | number
    fees1d?: FloatFieldUpdateOperationsInput | number
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    daySnapshots?: daySnapshotUncheckedUpdateManyWithoutPoolNestedInput
    hourSnapshots?: hourSnapshotUncheckedUpdateManyWithoutPoolNestedInput
  }

  export type PoolUncheckedUpdateManyWithoutPools0Input = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    apr?: FloatFieldUpdateOperationsInput | number
    chainId?: IntFieldUpdateOperationsInput | number
    version?: StringFieldUpdateOperationsInput | string
    token1Id?: StringFieldUpdateOperationsInput | string
    swapFee?: FloatFieldUpdateOperationsInput | number
    feeUSD?: FloatFieldUpdateOperationsInput | number
    reserve0?: StringFieldUpdateOperationsInput | string
    reserve1?: StringFieldUpdateOperationsInput | string
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    liquidity?: FloatFieldUpdateOperationsInput | number
    volume1d?: FloatFieldUpdateOperationsInput | number
    fees1d?: FloatFieldUpdateOperationsInput | number
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PoolUpdateWithoutToken1Input = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    apr?: FloatFieldUpdateOperationsInput | number
    chainId?: IntFieldUpdateOperationsInput | number
    version?: StringFieldUpdateOperationsInput | string
    swapFee?: FloatFieldUpdateOperationsInput | number
    feeUSD?: FloatFieldUpdateOperationsInput | number
    reserve0?: StringFieldUpdateOperationsInput | string
    reserve1?: StringFieldUpdateOperationsInput | string
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    liquidity?: FloatFieldUpdateOperationsInput | number
    volume1d?: FloatFieldUpdateOperationsInput | number
    fees1d?: FloatFieldUpdateOperationsInput | number
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    token0?: TokenUpdateOneRequiredWithoutPools0NestedInput
    daySnapshots?: daySnapshotUpdateManyWithoutPoolNestedInput
    hourSnapshots?: hourSnapshotUpdateManyWithoutPoolNestedInput
  }

  export type PoolUncheckedUpdateWithoutToken1Input = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    apr?: FloatFieldUpdateOperationsInput | number
    chainId?: IntFieldUpdateOperationsInput | number
    version?: StringFieldUpdateOperationsInput | string
    token0Id?: StringFieldUpdateOperationsInput | string
    swapFee?: FloatFieldUpdateOperationsInput | number
    feeUSD?: FloatFieldUpdateOperationsInput | number
    reserve0?: StringFieldUpdateOperationsInput | string
    reserve1?: StringFieldUpdateOperationsInput | string
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    liquidity?: FloatFieldUpdateOperationsInput | number
    volume1d?: FloatFieldUpdateOperationsInput | number
    fees1d?: FloatFieldUpdateOperationsInput | number
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    daySnapshots?: daySnapshotUncheckedUpdateManyWithoutPoolNestedInput
    hourSnapshots?: hourSnapshotUncheckedUpdateManyWithoutPoolNestedInput
  }

  export type PoolUncheckedUpdateManyWithoutPools1Input = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    apr?: FloatFieldUpdateOperationsInput | number
    chainId?: IntFieldUpdateOperationsInput | number
    version?: StringFieldUpdateOperationsInput | string
    token0Id?: StringFieldUpdateOperationsInput | string
    swapFee?: FloatFieldUpdateOperationsInput | number
    feeUSD?: FloatFieldUpdateOperationsInput | number
    reserve0?: StringFieldUpdateOperationsInput | string
    reserve1?: StringFieldUpdateOperationsInput | string
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    liquidity?: FloatFieldUpdateOperationsInput | number
    volume1d?: FloatFieldUpdateOperationsInput | number
    fees1d?: FloatFieldUpdateOperationsInput | number
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DozerPoolUpdateWithoutToken0Input = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    chainId?: IntFieldUpdateOperationsInput | number
    version?: StringFieldUpdateOperationsInput | string
    swapFee?: FloatFieldUpdateOperationsInput | number
    twapEnabled?: BoolFieldUpdateOperationsInput | boolean
    reserve0?: StringFieldUpdateOperationsInput | string
    reserve1?: StringFieldUpdateOperationsInput | string
    totalSupply?: StringFieldUpdateOperationsInput | string
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    token0Price?: StringFieldUpdateOperationsInput | string
    token1Price?: StringFieldUpdateOperationsInput | string
    feeApr?: FloatFieldUpdateOperationsInput | number
    incentiveApr?: FloatFieldUpdateOperationsInput | number
    totalApr?: FloatFieldUpdateOperationsInput | number
    isIncentivized?: BoolFieldUpdateOperationsInput | boolean
    volume1d?: FloatFieldUpdateOperationsInput | number
    fees1d?: FloatFieldUpdateOperationsInput | number
    volume1w?: FloatFieldUpdateOperationsInput | number
    fees1w?: FloatFieldUpdateOperationsInput | number
    createdAtBlockNumber?: BigIntFieldUpdateOperationsInput | bigint | number
    isBlacklisted?: BoolFieldUpdateOperationsInput | boolean
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    token1?: TokenUpdateOneRequiredWithoutDozerPools1NestedInput
    incentives?: IncentiveUpdateManyWithoutPoolNestedInput
  }

  export type DozerPoolUncheckedUpdateWithoutToken0Input = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    chainId?: IntFieldUpdateOperationsInput | number
    version?: StringFieldUpdateOperationsInput | string
    token1Id?: StringFieldUpdateOperationsInput | string
    swapFee?: FloatFieldUpdateOperationsInput | number
    twapEnabled?: BoolFieldUpdateOperationsInput | boolean
    reserve0?: StringFieldUpdateOperationsInput | string
    reserve1?: StringFieldUpdateOperationsInput | string
    totalSupply?: StringFieldUpdateOperationsInput | string
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    token0Price?: StringFieldUpdateOperationsInput | string
    token1Price?: StringFieldUpdateOperationsInput | string
    feeApr?: FloatFieldUpdateOperationsInput | number
    incentiveApr?: FloatFieldUpdateOperationsInput | number
    totalApr?: FloatFieldUpdateOperationsInput | number
    isIncentivized?: BoolFieldUpdateOperationsInput | boolean
    volume1d?: FloatFieldUpdateOperationsInput | number
    fees1d?: FloatFieldUpdateOperationsInput | number
    volume1w?: FloatFieldUpdateOperationsInput | number
    fees1w?: FloatFieldUpdateOperationsInput | number
    createdAtBlockNumber?: BigIntFieldUpdateOperationsInput | bigint | number
    isBlacklisted?: BoolFieldUpdateOperationsInput | boolean
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    incentives?: IncentiveUncheckedUpdateManyWithoutPoolNestedInput
  }

  export type DozerPoolUncheckedUpdateManyWithoutDozerPools0Input = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    chainId?: IntFieldUpdateOperationsInput | number
    version?: StringFieldUpdateOperationsInput | string
    token1Id?: StringFieldUpdateOperationsInput | string
    swapFee?: FloatFieldUpdateOperationsInput | number
    twapEnabled?: BoolFieldUpdateOperationsInput | boolean
    reserve0?: StringFieldUpdateOperationsInput | string
    reserve1?: StringFieldUpdateOperationsInput | string
    totalSupply?: StringFieldUpdateOperationsInput | string
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    token0Price?: StringFieldUpdateOperationsInput | string
    token1Price?: StringFieldUpdateOperationsInput | string
    feeApr?: FloatFieldUpdateOperationsInput | number
    incentiveApr?: FloatFieldUpdateOperationsInput | number
    totalApr?: FloatFieldUpdateOperationsInput | number
    isIncentivized?: BoolFieldUpdateOperationsInput | boolean
    volume1d?: FloatFieldUpdateOperationsInput | number
    fees1d?: FloatFieldUpdateOperationsInput | number
    volume1w?: FloatFieldUpdateOperationsInput | number
    fees1w?: FloatFieldUpdateOperationsInput | number
    createdAtBlockNumber?: BigIntFieldUpdateOperationsInput | bigint | number
    isBlacklisted?: BoolFieldUpdateOperationsInput | boolean
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DozerPoolUpdateWithoutToken1Input = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    chainId?: IntFieldUpdateOperationsInput | number
    version?: StringFieldUpdateOperationsInput | string
    swapFee?: FloatFieldUpdateOperationsInput | number
    twapEnabled?: BoolFieldUpdateOperationsInput | boolean
    reserve0?: StringFieldUpdateOperationsInput | string
    reserve1?: StringFieldUpdateOperationsInput | string
    totalSupply?: StringFieldUpdateOperationsInput | string
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    token0Price?: StringFieldUpdateOperationsInput | string
    token1Price?: StringFieldUpdateOperationsInput | string
    feeApr?: FloatFieldUpdateOperationsInput | number
    incentiveApr?: FloatFieldUpdateOperationsInput | number
    totalApr?: FloatFieldUpdateOperationsInput | number
    isIncentivized?: BoolFieldUpdateOperationsInput | boolean
    volume1d?: FloatFieldUpdateOperationsInput | number
    fees1d?: FloatFieldUpdateOperationsInput | number
    volume1w?: FloatFieldUpdateOperationsInput | number
    fees1w?: FloatFieldUpdateOperationsInput | number
    createdAtBlockNumber?: BigIntFieldUpdateOperationsInput | bigint | number
    isBlacklisted?: BoolFieldUpdateOperationsInput | boolean
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    token0?: TokenUpdateOneRequiredWithoutDozerPools0NestedInput
    incentives?: IncentiveUpdateManyWithoutPoolNestedInput
  }

  export type DozerPoolUncheckedUpdateWithoutToken1Input = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    chainId?: IntFieldUpdateOperationsInput | number
    version?: StringFieldUpdateOperationsInput | string
    token0Id?: StringFieldUpdateOperationsInput | string
    swapFee?: FloatFieldUpdateOperationsInput | number
    twapEnabled?: BoolFieldUpdateOperationsInput | boolean
    reserve0?: StringFieldUpdateOperationsInput | string
    reserve1?: StringFieldUpdateOperationsInput | string
    totalSupply?: StringFieldUpdateOperationsInput | string
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    token0Price?: StringFieldUpdateOperationsInput | string
    token1Price?: StringFieldUpdateOperationsInput | string
    feeApr?: FloatFieldUpdateOperationsInput | number
    incentiveApr?: FloatFieldUpdateOperationsInput | number
    totalApr?: FloatFieldUpdateOperationsInput | number
    isIncentivized?: BoolFieldUpdateOperationsInput | boolean
    volume1d?: FloatFieldUpdateOperationsInput | number
    fees1d?: FloatFieldUpdateOperationsInput | number
    volume1w?: FloatFieldUpdateOperationsInput | number
    fees1w?: FloatFieldUpdateOperationsInput | number
    createdAtBlockNumber?: BigIntFieldUpdateOperationsInput | bigint | number
    isBlacklisted?: BoolFieldUpdateOperationsInput | boolean
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    incentives?: IncentiveUncheckedUpdateManyWithoutPoolNestedInput
  }

  export type DozerPoolUncheckedUpdateManyWithoutDozerPools1Input = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    chainId?: IntFieldUpdateOperationsInput | number
    version?: StringFieldUpdateOperationsInput | string
    token0Id?: StringFieldUpdateOperationsInput | string
    swapFee?: FloatFieldUpdateOperationsInput | number
    twapEnabled?: BoolFieldUpdateOperationsInput | boolean
    reserve0?: StringFieldUpdateOperationsInput | string
    reserve1?: StringFieldUpdateOperationsInput | string
    totalSupply?: StringFieldUpdateOperationsInput | string
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    token0Price?: StringFieldUpdateOperationsInput | string
    token1Price?: StringFieldUpdateOperationsInput | string
    feeApr?: FloatFieldUpdateOperationsInput | number
    incentiveApr?: FloatFieldUpdateOperationsInput | number
    totalApr?: FloatFieldUpdateOperationsInput | number
    isIncentivized?: BoolFieldUpdateOperationsInput | boolean
    volume1d?: FloatFieldUpdateOperationsInput | number
    fees1d?: FloatFieldUpdateOperationsInput | number
    volume1w?: FloatFieldUpdateOperationsInput | number
    fees1w?: FloatFieldUpdateOperationsInput | number
    createdAtBlockNumber?: BigIntFieldUpdateOperationsInput | bigint | number
    isBlacklisted?: BoolFieldUpdateOperationsInput | boolean
    generatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IncentiveUpdateWithoutRewardTokenInput = {
    id?: StringFieldUpdateOperationsInput | string
    chainId?: IntFieldUpdateOperationsInput | number
    apr?: FloatFieldUpdateOperationsInput | number
    rewardPerDay?: FloatFieldUpdateOperationsInput | number
    pid?: IntFieldUpdateOperationsInput | number
    rewarderAddress?: StringFieldUpdateOperationsInput | string
    pool?: DozerPoolUpdateOneRequiredWithoutIncentivesNestedInput
  }

  export type IncentiveUncheckedUpdateWithoutRewardTokenInput = {
    id?: StringFieldUpdateOperationsInput | string
    chainId?: IntFieldUpdateOperationsInput | number
    apr?: FloatFieldUpdateOperationsInput | number
    rewardPerDay?: FloatFieldUpdateOperationsInput | number
    poolId?: StringFieldUpdateOperationsInput | string
    pid?: IntFieldUpdateOperationsInput | number
    rewarderAddress?: StringFieldUpdateOperationsInput | string
  }

  export type IncentiveUncheckedUpdateManyWithoutIncentivesInput = {
    id?: StringFieldUpdateOperationsInput | string
    chainId?: IntFieldUpdateOperationsInput | number
    apr?: FloatFieldUpdateOperationsInput | number
    rewardPerDay?: FloatFieldUpdateOperationsInput | number
    poolId?: StringFieldUpdateOperationsInput | string
    pid?: IntFieldUpdateOperationsInput | number
    rewarderAddress?: StringFieldUpdateOperationsInput | string
  }

  export type daySnapshotCreateManyPoolInput = {
    id?: number
    date: Date | string
    volumeUSD: number
    liquidityUSD: number
    apr: number
  }

  export type hourSnapshotCreateManyPoolInput = {
    id?: number
    date: Date | string
    volumeUSD: number
    liquidityUSD: number
    apr: number
  }

  export type daySnapshotUpdateWithoutPoolInput = {
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    apr?: FloatFieldUpdateOperationsInput | number
  }

  export type daySnapshotUncheckedUpdateWithoutPoolInput = {
    id?: IntFieldUpdateOperationsInput | number
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    apr?: FloatFieldUpdateOperationsInput | number
  }

  export type daySnapshotUncheckedUpdateManyWithoutDaySnapshotsInput = {
    id?: IntFieldUpdateOperationsInput | number
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    apr?: FloatFieldUpdateOperationsInput | number
  }

  export type hourSnapshotUpdateWithoutPoolInput = {
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    apr?: FloatFieldUpdateOperationsInput | number
  }

  export type hourSnapshotUncheckedUpdateWithoutPoolInput = {
    id?: IntFieldUpdateOperationsInput | number
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    apr?: FloatFieldUpdateOperationsInput | number
  }

  export type hourSnapshotUncheckedUpdateManyWithoutHourSnapshotsInput = {
    id?: IntFieldUpdateOperationsInput | number
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    volumeUSD?: FloatFieldUpdateOperationsInput | number
    liquidityUSD?: FloatFieldUpdateOperationsInput | number
    apr?: FloatFieldUpdateOperationsInput | number
  }

  export type IncentiveCreateManyPoolInput = {
    id: string
    chainId: number
    apr: number
    rewardPerDay: number
    rewardTokenId: string
    pid: number
    rewarderAddress: string
  }

  export type IncentiveUpdateWithoutPoolInput = {
    id?: StringFieldUpdateOperationsInput | string
    chainId?: IntFieldUpdateOperationsInput | number
    apr?: FloatFieldUpdateOperationsInput | number
    rewardPerDay?: FloatFieldUpdateOperationsInput | number
    pid?: IntFieldUpdateOperationsInput | number
    rewarderAddress?: StringFieldUpdateOperationsInput | string
    rewardToken?: TokenUpdateOneRequiredWithoutIncentivesNestedInput
  }

  export type IncentiveUncheckedUpdateWithoutPoolInput = {
    id?: StringFieldUpdateOperationsInput | string
    chainId?: IntFieldUpdateOperationsInput | number
    apr?: FloatFieldUpdateOperationsInput | number
    rewardPerDay?: FloatFieldUpdateOperationsInput | number
    rewardTokenId?: StringFieldUpdateOperationsInput | string
    pid?: IntFieldUpdateOperationsInput | number
    rewarderAddress?: StringFieldUpdateOperationsInput | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}