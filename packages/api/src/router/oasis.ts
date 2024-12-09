import { z } from 'zod'

import { fetchNodeData } from '../helpers/fetchFunction'
import { createTRPCRouter, procedure } from '../trpc'

export const oasisRouter = createTRPCRouter({
  getFrontQuoteLiquidityIn: procedure
    .input(
      z.object({
        amount_in: z.number(),
        token_in: z.string(),
      })
    )
    .query(async ({ input }) => {
      const endpoint = 'oasis/liquidity/front_quote'
      const queryParams = [`amount_in=${input.amount_in}`, `token_in=${input.token_in}`]
      const response = await fetchNodeData(endpoint, queryParams)
      const result = response['quotes']['front_quote']
      return result
    }),
})
