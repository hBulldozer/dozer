import { Prisma, Pool as _Pool, Token as _Token } from '@dozer/database'

export type dbPool = _Pool
export type dbToken = _Token

const dbPoolWithTokens = Prisma.validator<Prisma.PoolArgs>()({
  include: { token0: true, token1: true, tokenLP: true },
})

const dbTokensWithPools = Prisma.validator<Prisma.TokenArgs>()({
  include: { pools0: true, pools1: true, poolsLP: true },
})

export type dbPoolWithTokens = Prisma.PoolGetPayload<typeof dbPoolWithTokens>
export type dbTokenWithPools = Prisma.TokenGetPayload<typeof dbTokensWithPools>
