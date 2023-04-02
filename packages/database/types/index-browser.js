
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum
} = require('./runtime/index-browser')


const Prisma = {}

exports.Prisma = Prisma

/**
 * Prisma Client JS version: 4.12.0
 * Query Engine version: 659ef412370fa3b41cd7bf6e94587c1dfb7f67e7
 */
Prisma.prismaVersion = {
  client: "4.12.0",
  engine: "659ef412370fa3b41cd7bf6e94587c1dfb7f67e7"
}

Prisma.PrismaClientKnownRequestError = () => {
  throw new Error(`PrismaClientKnownRequestError is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  throw new Error(`PrismaClientUnknownRequestError is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.PrismaClientRustPanicError = () => {
  throw new Error(`PrismaClientRustPanicError is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.PrismaClientInitializationError = () => {
  throw new Error(`PrismaClientInitializationError is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.PrismaClientValidationError = () => {
  throw new Error(`PrismaClientValidationError is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.NotFoundError = () => {
  throw new Error(`NotFoundError is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  throw new Error(`sqltag is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.empty = () => {
  throw new Error(`empty is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.join = () => {
  throw new Error(`join is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.raw = () => {
  throw new Error(`raw is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.validator = () => (val) => val


/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}

/**
 * Enums
 */
// Based on
// https://github.com/microsoft/TypeScript/issues/3192#issuecomment-261720275
function makeEnum(x) { return x; }

exports.Prisma.DaySnapshotScalarFieldEnum = makeEnum({
  id: 'id',
  poolId: 'poolId',
  date: 'date',
  volumeUSD: 'volumeUSD',
  liquidityUSD: 'liquidityUSD',
  apr: 'apr'
});

exports.Prisma.DozerPoolScalarFieldEnum = makeEnum({
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
});

exports.Prisma.HourSnapshotScalarFieldEnum = makeEnum({
  id: 'id',
  poolId: 'poolId',
  date: 'date',
  volumeUSD: 'volumeUSD',
  liquidityUSD: 'liquidityUSD',
  apr: 'apr'
});

exports.Prisma.IncentiveScalarFieldEnum = makeEnum({
  id: 'id',
  chainId: 'chainId',
  apr: 'apr',
  rewardPerDay: 'rewardPerDay',
  rewardTokenId: 'rewardTokenId',
  poolId: 'poolId',
  pid: 'pid',
  rewarderAddress: 'rewarderAddress'
});

exports.Prisma.PoolScalarFieldEnum = makeEnum({
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
});

exports.Prisma.SortOrder = makeEnum({
  asc: 'asc',
  desc: 'desc'
});

exports.Prisma.TokenScalarFieldEnum = makeEnum({
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
});

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});


exports.Prisma.ModelName = makeEnum({
  Token: 'Token',
  Pool: 'Pool',
  daySnapshot: 'daySnapshot',
  hourSnapshot: 'hourSnapshot',
  DozerPool: 'DozerPool',
  Incentive: 'Incentive'
});

/**
 * Create the Client
 */
class PrismaClient {
  constructor() {
    throw new Error(
      `PrismaClient is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
    )
  }
}
exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
