import { z } from 'zod'

import { createTRPCRouter, procedure } from '../trpc'
import { fetchNodeData } from '../helpers/fetchFunction'
import { FrontEndApiNCObject } from '../types'

export const poolRouter = createTRPCRouter({
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
  reserveChangeById: procedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const pool = await ctx.prisma.pool.findFirst({
      where: { id: input.id },
      include: {
        hourSnapshots: { orderBy: { date: 'desc' } },
        token0: true,
        token1: true,
      },
    })
    const poolSnaps = pool?.hourSnapshots
    const previousReserve: { HTRReserve: number; TokenReserve: number } =
      poolSnaps && poolSnaps.length > 1
        ? pool?.token0.uuid == '00'
          ? [poolSnaps[1]?.reserve0, poolSnaps[1]?.reserve1]
          : [poolSnaps[1]?.reserve1, poolSnaps[1]?.reserve0]
        : 0

    const previousPrice =
      previousReserve.HTRReserve != 0 ? previousReserve.TokenReserve / previousReserve.HTRReserve : 0
  }),
  // create: procedure
  //   .input(
  //     z.object({
  //       title: z.string().min(1),
  //       content: z.string().min(1),
  //     }),
  //   )
  //   .mutation(({ ctx, input }) => {
  //     return ctx.prisma.pool.create({ data: input });
  //   }),
  // delete: procedure.input(z.string()).mutation(({ ctx, input }) => {
  //   return ctx.prisma.pool.delete({ where: { id: input } });
  // }),
})
