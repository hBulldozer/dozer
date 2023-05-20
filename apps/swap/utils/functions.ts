import prisma from '@dozer/database'
import { Pair, pairFromPoolAndTokensList } from './Pair'

export const getPoolWithTokensAndSnaps = async (id: string) => {
  const pool = await prisma.pool.findUnique({
    where: { id: id },
    include: {
      token0: {
        include: {
          pools0: { include: { token0: true, token1: true } },
          pools1: { include: { token0: true, token1: true } },
        },
      },
      token1: {
        include: {
          pools0: { include: { token0: true, token1: true } },
          pools1: { include: { token0: true, token1: true } },
        },
      },
      tokenLP: {
        include: {
          poolsLP: { include: { tokenLP: true } },
        },
      },
      hourSnapshots: { orderBy: { date: 'desc' } },
      daySnapshots: { orderBy: { date: 'desc' } },
    },
  })
  if (!pool) {
    throw new Error(`Failed to fetch pool, received ${pool}`)
  }
  return pool
}

export const getPoolWithTokens = async (id: string) => {
  const pool = await prisma.pool.findUnique({
    where: { id: id },
    include: {
      token0: {
        include: {
          pools0: { include: { token0: true, token1: true } },
          pools1: { include: { token0: true, token1: true } },
        },
      },
      token1: {
        include: {
          pools0: { include: { token0: true, token1: true } },
          pools1: { include: { token0: true, token1: true } },
        },
      },
      tokenLP: {
        include: {
          poolsLP: { include: { tokenLP: true } },
        },
      },
      // hourSnapshots: { orderBy: { date: 'desc' } },
      // daySnapshots: { orderBy: { date: 'desc' } },
    },
  })
  if (!pool) {
    throw new Error(`Failed to fetch pool, received ${pool}`)
  }
  return pool
}

export const getPools = async () => {
  return await prisma.pool.findMany({
    include: {
      token0: true,
      token1: true,
      tokenLP: true,
    },
  })
}
export const getPairs = async () => {
  const pre_pools = await prisma.pool.findMany({
    include: {
      token0: true,
      token1: true,
      tokenLP: true,
    },
  })
  const pools: Pair[] = []
  pre_pools.forEach((pool) => {
    pools?.push(pairFromPoolAndTokensList(pool))
  })
  if (!pools) {
    throw new Error(`Failed to fetch pools, received ${pools}`)
  }
  return pools
}

export const getTokens = async () => {
  const tokens = await prisma.token.findMany({
    select: {
      id: true,
      name: true,
      uuid: true,
      symbol: true,
      chainId: true,
      decimals: true,
      pools0: {
        select: {
          id: true,
          reserve0: true,
          reserve1: true,
          token1: {
            select: {
              uuid: true,
            },
          },
        },
      },
      pools1: {
        select: {
          id: true,
          reserve0: true,
          reserve1: true,
          token0: {
            select: {
              uuid: true,
            },
          },
        },
      },
      poolsLP: {
        select: {
          id: true,
          reserve0: true,
          reserve1: true,
          tokenLP: {
            select: {
              uuid: true,
            },
          },
        },
      },
    },
  })

  if (!tokens) {
    throw new Error(`Failed to fetch tokens, received ${tokens}`)
  }
  return tokens
}

export const getPrices = async (tokens: any[]) => {
  const resp = await fetch('https://api.kucoin.com/api/v1/prices?currencies=HTR')
  const data = await resp.json()
  const priceHTR = data.data.HTR
  const prices: { [key: string]: number } = {}

  tokens.forEach((token) => {
    if (token.uuid == '00') prices[token.uuid] = Number(priceHTR)
    else if (token.pools0.length > 0) {
      const poolHTR = token.pools0.find((pool: { token1: { uuid: string } }) => {
        return pool.token1.uuid == '00'
      })
      if (!prices[token.uuid]) prices[token.uuid] = (Number(poolHTR?.reserve1) / Number(poolHTR?.reserve0)) * priceHTR
    } else if (token.pools1.length > 0) {
      const poolHTR = token.pools1.find((pool: { token0: { uuid: string } }) => {
        return pool.token0.uuid == '00'
      })
      if (!prices[token.uuid]) prices[token.uuid] = (Number(poolHTR?.reserve0) / Number(poolHTR?.reserve1)) * priceHTR
    }
  })

  if (!prices) {
    throw new Error(`Failed to fetch prices, received ${prices}`)
  }
  return prices
}
