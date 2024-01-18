import { z } from 'zod'

import { createTRPCRouter, procedure } from '../trpc'
import { fetchNodeData } from '../helpers/fetchFunction'
import { FrontEndApiNCObject } from '../types'

export const poolRouter = createTRPCRouter({
  //New procedures enhanced SQL
  allNcids: procedure.query(({ ctx }) => {
    return ctx.prisma.pool.findMany({
      select: {
        ncid: true,
      },
    })
  }),
  contractState: procedure
    .input(z.object({ ncid: z.string() }))
    .output(FrontEndApiNCObject)
    .output(FrontEndApiNCObject)
    .query(async ({ ctx, input }) => {
      const endpoint = 'nano_contract/state'
      const queryParams = [`id=${input.ncid}`, `calls[]=front_end_api_pool()`]
      const response = await fetchNodeData(endpoint, queryParams)
      const result = response['calls'][`front_end_api_pool()`]['value']
      return result
    }),
  hourSnaps: procedure
    //change id to ncid when included on prisma schema
    .input(z.object({ poolId: z.string(), interval: z.number() }))
    .query(({ ctx, input }) => {
      const result = ctx.prisma.hourSnapshot.findMany({
        where: {
          AND: [{ date: { gte: new Date(Date.now() - input.interval) } }, { poolId: input.poolId }],
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
      return result
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
    .input(z.object({ ncid: z.string() }))
    .output(FrontEndApiNCObject)
    .query(async ({ ctx, input }) => {
      const endpoint = 'nano_contract/state'
      const queryParams = [`id=${input.ncid}`, `calls[]=front_end_api_pool()`]
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
