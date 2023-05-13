import { z } from 'zod'

import { createTRPCRouter, procedure } from '../trpc'

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
  byId: procedure.input(z.object({ id: z.string() })).query(({ ctx, input }) => {
    const pool = ctx.prisma.pool.findUnique({
      where: { id: input.id },
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
