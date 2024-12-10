import { z } from 'zod'

import { fetchNodeData } from '../helpers/fetchFunction'
import { createTRPCRouter, procedure } from '../trpc'

export const oasisRouter = createTRPCRouter({
  all: procedure.query(async ({ ctx }) => {
    const oasisContracts = await ctx.prisma.oasis.findMany({
      include: {
        token: {
          select: {
            symbol: true,
            uuid: true,
          },
        },
        pool: {
          select: {
            id: true,
          },
        },
      },
    })
    return oasisContracts
  }),
  getFrontQuoteLiquidityIn: procedure
    .input(
      z.object({
        id: z.string(),
        amount_in: z.number(),
        timelock: z.number(),
        now: z.number(),
        address: z.string(),
      })
    )
    .output(
      z.object({
        bonus: z.number(),
        htr_amount: z.number(),
        withdrawal_time: z.date(),
        has_position: z.boolean(),
      })
    )
    .query(async ({ input }) => {
      const endpoint = 'nano_contract/state'
      const amount = input.amount_in * 100 // correcting input to the backend
      const call = `front_quote_add_liquidity_in(${amount},${input.timelock},${Math.floor(input.now / 1000)},"a'${
        input.address
      }'")`
      const queryParams = [`id=${input.id}`, `calls[]=${call}`]
      const response = await fetchNodeData(endpoint, queryParams)
      const result = response['calls'][`${call}`]['value']
      const parsed_result = {
        bonus: result['bonus'] / 100,
        htr_amount: result['htr_amount'] / 100,
        withdrawal_time: new Date(result['withdrawal_time'] * 1000),
        has_position: Boolean(result['has_position']),
      }
      return parsed_result
    }),
})
