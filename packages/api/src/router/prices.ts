import prisma, { PrismaClient } from '@dozer/database'
import { z } from 'zod'

import { fetchNodeData } from '../helpers/fetchFunction'
import { createTRPCRouter, procedure } from '../trpc'

const idFromHTRPoolByTokenUuid = async (uuid: string, chainId: number, prisma: PrismaClient) => {
  if (uuid == '00') {
    return await prisma.pool.findFirst({
      where: { token0: { uuid: '00' }, chainId: chainId },
      select: { id: true },
    })
  } else {
    return await prisma.pool.findFirst({
      where: { token1: { uuid: uuid, chainId: chainId } },
      select: { id: true },
    })
  }
}

const HTRPoolByTokenUuidFromContract = async (uuid: string, chainId: number, prisma: PrismaClient) => {
  const poolId = await idFromHTRPoolByTokenUuid(uuid, chainId, prisma)
  if (!poolId) return {}
  const endpoint = 'nano_contract/state'
  const queryParams = [`id=${poolId.id}`, `calls[]=pool_data()`]
  const response = await fetchNodeData(endpoint, queryParams)
  const result = response['calls'][`pool_data()`]['value']
  return result
}
const htrKline = async (input: { period: number; size: number; prisma: PrismaClient }) => {
  // const period = input.period == 0 ? '15min' : input.period == 1 ? '1hour' : '1day'

  // const now = Math.round(Date.now() / 1000)
  // const period = input.period == 0 ? '15min' : input.period == 1 ? '1hour' : '1day'
  // const start = (input.size + 1) * (input.period == 0 ? 15 : input.period == 1 ? 60 : 24 * 60) * 60 // in seconds
  // const resp = await fetch(
  //   `https://api.kucoin.com/api/v1/market/candles?type=${period}&symbol=HTR-USDT&startAt=${now - start}&endAt=${now}`
  // )
  // const data = await resp.json()
  // return data.data
  //   .sort((a: number[], b: number[]) => (a[0] && b[0] ? a[0] - b[0] : null))
  //   .map((item: number[]) => {
  //     return { price: Number(item[2]), date: Number(item[0]) }})

  // Filter pools by token symbols
  const pool = await prisma.pool.findFirst({
    where: {
      token0: { symbol: 'HTR' },
      token1: { symbol: 'USDT' },
    },
  })
  if (!pool) {
    throw new Error('Pool with HTR-USDT pair not found')
  }

  const now = Math.round(Date.now() / 1000)
  const start = (input.size + 1) * (input.period == 0 ? 15 : input.period == 1 ? 60 : 24 * 60) * 60 // in seconds

  const snapshots = await prisma.hourSnapshot.findMany({
    where: {
      poolId: pool.id,
      date: {
        gte: new Date((now - start) * 1000), // convert to milliseconds
        lte: new Date(now * 1000),
      },
    },
    orderBy: { date: 'asc' }, // sort by date ascending
  })
  return snapshots.map((snapshot) => ({
    price: parseFloat((snapshot.reserve1 / snapshot.reserve0).toFixed(6)),
    date: snapshot.date.getTime(),
  }))
}
const getPricesSince = async (tokenUuid: string, prisma: PrismaClient, since: number) => {
  let result
  if (tokenUuid == '00') {
    result = await prisma.hourSnapshot.findMany({
      where: {
        AND: [
          { date: { gte: new Date(since) } },
          {
            pool: {
              token0: {
                uuid: '00',
              },
            },
          },
          {
            pool: {
              token1: {
                symbol: 'USDT',
              },
            },
          },
        ],
      },
      select: {
        date: true,
        poolId: true,
        reserve0: true,
        reserve1: true,
        priceHTR: true,
      },
    })
  } else {
    result = await prisma.hourSnapshot.findMany({
      where: {
        AND: [
          { date: { gte: new Date(since) } },
          {
            pool: {
              token0: {
                uuid: '00',
              },
            },
          },
          {
            pool: {
              token1: {
                uuid: tokenUuid,
              },
            },
          },
        ],
      },
      select: {
        date: true,
        poolId: true,
        reserve0: true,
        reserve1: true,
        priceHTR: true,
      },
    })
  }
  return result
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((snap) => {
      return { price: parseFloat((snap.reserve0 / snap.reserve1).toFixed(6)), priceHTR: snap.priceHTR }
    })
}

const getPriceHTRAtTimestamp = async (tokenUuid: string, prisma: PrismaClient, since: number) => {
  let result
  try {
    if (tokenUuid == '00') {
      result = await prisma.hourSnapshot.findMany({
        where: {
          AND: [
            { date: { gte: new Date(since) } },
            {
              pool: {
                token0: {
                  uuid: '00',
                },
              },
            },
            {
              pool: {
                token1: {
                  symbol: 'USDT',
                },
              },
            },
          ],
        },
        select: {
          date: true,
          poolId: true,
          reserve0: true,
          reserve1: true,
          priceHTR: true,
        },
        take: 1,
      })
    } else {
      result = await prisma.hourSnapshot.findMany({
        where: {
          AND: [
            { date: { gte: new Date(since) } },
            {
              pool: {
                token0: {
                  uuid: '00',
                },
              },
            },
            {
              pool: {
                token1: {
                  uuid: tokenUuid,
                },
              },
            },
          ],
        },
        select: {
          date: true,
          poolId: true,
          reserve0: true,
          reserve1: true,
          priceHTR: true,
        },
        take: 1,
      })
    }

    return result
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((snap) => {
        return { price: parseFloat((snap.reserve0 / snap.reserve1).toFixed(6)), priceHTR: snap.priceHTR }
      })[0]
  } catch (error) {
    return {
      price: 0,
      priceHTR: 0,
    }
  }
}
export const pricesRouter = createTRPCRouter({
  all: procedure.query(async ({ ctx }) => {
    const tokens = await ctx.prisma.token.findMany({
      select: {
        uuid: true,
        symbol: true,
        chainId: true,
      },
    })
    if (!tokens) {
      throw new Error(`Failed to fetch tokens, received ${tokens}`)
    }
    const pools = await ctx.prisma.pool.findMany({
      select: {
        id: true,
        chainId: true,
        token0: { select: { symbol: true } },
        token1: { select: { symbol: true } },
      },
    })
    const htrUsdtPool = pools.find((pool) => {
      const symbols = [pool.token0.symbol, pool.token1.symbol]
      return symbols.includes('HTR') && symbols.includes('USDT')
    })

    const endpoint = 'nano_contract/state'
    const queryParams = [`id=${htrUsdtPool?.id}`, `calls[]=pool_data()`]

    const rawPoolData = await fetchNodeData(endpoint, queryParams)
    const poolData = rawPoolData.calls['pool_data()'].value
    const priceHTR = htrUsdtPool
      ? htrUsdtPool.token0.symbol === 'HTR'
        ? poolData.reserve1 / poolData.reserve0
        : poolData.reserve0 / poolData.reserve1
      : 1
    const prices: { [key: string]: number } = {}

    await Promise.all(
      tokens.map(async (token) => {
        if (token.uuid == '00') prices[token.uuid] = Number(priceHTR)
        else if (token.symbol == 'USDT') prices[token.uuid] = 1
        else {
          const poolHTR = pools.find((pool) => {
            const symbols = [pool.token0.symbol, pool.token1.symbol]
            return symbols.includes(token.symbol) && symbols.includes('HTR')
          })
          if (!prices[token.uuid] && poolHTR) {
            const queryParams = [`id=${poolHTR.id}`, `calls[]=pool_data()`]
            const rawPoolData = await fetchNodeData(endpoint, queryParams)
            const poolData = rawPoolData.calls['pool_data()'].value
            const tokenPrice = poolHTR
              ? poolHTR.token0.symbol === 'HTR'
                ? poolData.reserve0 / poolData.reserve1
                : poolData.reserve1 / poolData.reserve0
              : 1
            // console.log(token.uuid, poolHTR ? (Number(poolHTR?.reserve0) / Number(poolHTR?.reserve1)) * priceHTR : 0)
            prices[token.uuid] = poolHTR ? parseFloat((tokenPrice * priceHTR).toFixed(6)) : 0
          }
        }
      })
    )

    if (!prices) {
      throw new Error(`Failed to fetch prices, received ${prices}`)
    }
    return prices
  }),
  all24h: procedure.query(async ({ ctx }) => {
    const tokens = await ctx.prisma.token.findMany({
      select: {
        uuid: true,
        chainId: true,
      },
    })
    if (!tokens) {
      throw new Error(`Failed to fetch tokens, received ${tokens}`)
    }
    const prices24hUSD: { [key: string]: number[] } = {}
    await Promise.all(
      tokens.map(async (token) => {
        const token_prices24hUSD: number[] = []

        const since = Date.now() - 24 * 60 * 60 * 1000 // 24 hours ago
        const snaps24h = await getPricesSince(token.uuid, ctx.prisma, since) //from db snaps
        snaps24h.forEach((snaps) => {
          const priceHTR = snaps.priceHTR
          token_prices24hUSD.push((token.uuid == '00' ? 1 : snaps.price) * priceHTR)
        })
        if (!prices24hUSD[token.uuid]) prices24hUSD[token.uuid] = token_prices24hUSD
      })
    )
    return prices24hUSD
  }),
  allAtTimestamp: procedure.input(z.object({ timestamp: z.number() })).query(async ({ ctx, input }) => {
    const tokens = await ctx.prisma.token.findMany({
      select: {
        uuid: true,
        symbol: true,
        chainId: true,
      },
    })
    if (!tokens) {
      throw new Error(`Failed to fetch tokens, received ${tokens}`)
    }
    const prices: { [key: string]: number } = {}
    await Promise.all(
      tokens.map(async (token) => {
        const price_old = await getPriceHTRAtTimestamp(token.uuid, ctx.prisma, input.timestamp) //from db snaps
        if (!prices[token.uuid])
          prices[token.uuid] =
            price_old && price_old.price && price_old.priceHTR
              ? token.uuid == '00'
                ? price_old.priceHTR
                : token.symbol == 'USDT'
                ? 1
                : price_old.price * price_old.priceHTR
              : 0
      })
    )
    return prices
  }),

  htr: procedure.output(z.number()).query(async () => {
    // const resp = await fetch('https://api.kucoin.com/api/v1/prices?currencies=HTR')
    // const data = await resp.json()
    // return Number(data.data.HTR)
    const USDT = await prisma.token.findFirst({ where: { symbol: 'USDT' } })
    if (!USDT) {
      throw new Error('Failed to get USDT Token')
    }
    const pool = await HTRPoolByTokenUuidFromContract(USDT?.uuid, USDT?.chainId, prisma)
    return Number(pool?.reserve1) / Number(pool?.reserve0)
  }),
  htrKline: procedure
    .output(z.array(z.object({ price: z.number(), date: z.number() })))
    .input(z.object({ size: z.number(), period: z.number() }))
    .query(async ({ ctx, input }) => {
      const result = await htrKline({ ...input, prisma: ctx.prisma })
      return result
    }),
})
