import { z } from 'zod'

import { createTRPCRouter, procedure } from '../trpc'
import { fetchNodeData } from '../helpers/fetchFunction'
import { FrontEndApiNCObject } from '../types'
import { PrismaClient } from '@dozer/database'

// Exporting common functions to use in another routers, as is suggested in https://trpc.io/docs/v10/server/server-side-calls

export const HTRPoolByTokenUuid = async (uuid: string, chainId: number, prisma: PrismaClient) => {
  if (uuid == '00') {
    return await prisma.pool.findFirst({
      where: { token0: { uuid: '00' }, chainId: chainId },
      include: {
        token0: true,
        token1: true,
        tokenLP: true,
      },
    })
  } else {
    return await prisma.pool.findFirst({
      where: { token1: { uuid: uuid, chainId: chainId }, token0: { uuid: '00', chainId: chainId } },
      include: {
        token0: true,
        token1: true,
        tokenLP: true,
      },
    })
  }
}

export const idFromHTRPoolByTokenUuid = async (uuid: string, chainId: number, prisma: PrismaClient) => {
  if (uuid == '00') {
    return await prisma.pool.findFirst({
      where: { token0: { uuid: '00' }, chainId: chainId },
      select: { id: true },
    })
  } else {
    return await prisma.pool.findFirst({
      where: { token1: { uuid: uuid, chainId: chainId }, token0: { uuid: '00', chainId: chainId } },
      select: { id: true },
    })
  }
}

export const HTRPoolByTokenUuidFromContract = async (uuid: string, chainId: number, prisma: PrismaClient) => {
  const poolId = await idFromHTRPoolByTokenUuid(uuid, chainId, prisma)
  if (!poolId) return {}
  const endpoint = 'nano_contract/state'
  const queryParams = [`id=${poolId.id}`, `calls[]=front_end_api_pool()`]
  const response = await fetchNodeData(endpoint, queryParams)
  const result = response['calls'][`front_end_api_pool()`]['value']
  return result
}

export const poolRouter = createTRPCRouter({
  //New procedures enhanced SQL
  allNcids: procedure.query(({ ctx }) => {
    return ctx.prisma.pool.findMany({
      select: {
        id: true,
      },
    })
  }),
  contractState: procedure
    .input(z.object({ id: z.string() }))
    .output(FrontEndApiNCObject)
    .output(FrontEndApiNCObject)
    .query(async ({ ctx, input }) => {
      const endpoint = 'nano_contract/state'
      const queryParams = [`id=${input.id}`, `calls[]=front_end_api_pool()`]
      const response = await fetchNodeData(endpoint, queryParams)
      const result = response['calls'][`front_end_api_pool()`]['value']
      return result
    }),
  hourSnaps: procedure
    //change id to id when included on prisma schema
    .input(z.object({ tokenUuid: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.prisma.hourSnapshot.findMany({
        where: {
          AND: [
            { date: { gte: new Date(Date.now() - 60 * 60 * 24 * 1000) } },
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
                  uuid: input.tokenUuid,
                },
              },
            },
          ],
        },
        //we can select vol, liq for example only for the pool page
        select: {
          date: true,
          poolId: true,
          // volumeUSD: true,
          // liquidityUSD: true,
          // apr: true,
          reserve0: true,
          reserve1: true,
          priceHTR: true,
        },
      })
      return result.reverse().map((snap) => {
        return { date: snap.date, priceToken: (snap.reserve0 / snap.reserve1) * snap.priceHTR, priceHTR: snap.priceHTR }
      })
    }),
  all: procedure.query(({ ctx }) => {
    return ctx.prisma.pool.findMany({
      include: {
        token0: true,
        token1: true,
        tokenLP: true,
      },
    })
  }),
  byIdFromContract: procedure
    .input(z.object({ id: z.string() }))
    .output(FrontEndApiNCObject)
    .query(async ({ ctx, input }) => {
      const endpoint = 'nano_contract/state'
      const queryParams = [`id=${input.id}`, `calls[]=front_end_api_pool()`]
      const response = await fetchNodeData(endpoint, queryParams)
      const result = response['calls'][`front_end_api_pool()`]['value']
      return result
    }),
  byIdWithSnaps: procedure.input(z.object({ id: z.string() })).query(({ ctx, input }) => {
    return ctx.prisma.pool.findFirst({
      where: { id: input.id },
      include: {
        token0: true,
        token1: true,
        tokenLP: true,
        hourSnapshots: { orderBy: { date: 'desc' } },
        daySnapshots: { orderBy: { date: 'desc' } },
      },
    })
  }),
  byTokenUuidWithSnaps: procedure.input(z.object({ uuid: z.string(), chainId: z.number() })).query(({ ctx, input }) => {
    if (input.uuid == '00') {
      return ctx.prisma.pool.findFirst({
        where: { token0: { uuid: '00' }, chainId: input.chainId },
        include: {
          token0: true,
          token1: true,
          tokenLP: true,
          hourSnapshots: { orderBy: { date: 'desc' } },
          daySnapshots: { orderBy: { date: 'desc' } },
        },
      })
    } else {
      return ctx.prisma.pool.findFirst({
        where: { token1: { uuid: input.uuid, chainId: input.chainId }, token0: { uuid: '00', chainId: input.chainId } },
        include: {
          token0: true,
          token1: true,
          tokenLP: true,
          hourSnapshots: { orderBy: { date: 'desc' } },
          daySnapshots: { orderBy: { date: 'desc' } },
        },
      })
    }
  }),
  HTRPoolbyTokenUuid: procedure.input(z.object({ uuid: z.string(), chainId: z.number() })).query(({ ctx, input }) => {
    return HTRPoolByTokenUuid(input.uuid, input.chainId, ctx.prisma)
  }),
  byId: procedure.input(z.object({ id: z.string() })).query(({ ctx, input }) => {
    return ctx.prisma.pool.findFirst({
      where: { id: input.id },
      include: {
        token0: true,
        token1: true,
        tokenLP: true,
      },
    })
  }),
  sql: procedure.query(({ ctx }) => {
    const test = ctx.prisma.pool.findMany({
      where: {
        token0: { uuid: '00' },
      },
      select: {
        token1: {
          select: {
            name: true,
            uuid: true,
          },
        },
        hourSnapshots: {
          where: {
            date: {
              gte: new Date(Date.now() - 86400 * 1000),
            },
          },
          select: {
            date: true,
            reserve0: true,
            reserve1: true,
            priceHTR: true,
          },
        },
      },
    })
    return test
  }),
})
