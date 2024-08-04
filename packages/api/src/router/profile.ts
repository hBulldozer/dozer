import { z } from 'zod'

import { createTRPCRouter, procedure } from '../trpc'
import { fetchNodeData } from '../helpers/fetchFunction'

export const profileRouter = createTRPCRouter({
  balance: procedure
    // .input(z.object({ address: z.string() }))
    .input(
      z.object({
        address: z
          .string()
          .length(34)
          .refine((val) => val.startsWith('W') || val.startsWith('H'), {
            message: "Invalid address: must initiatewith 'W' or 'H'.",
          }),
      })
    )
    .query(async ({ input }) => {
      const endpoint = 'thin_wallet/address_balance'
      const response = await fetchNodeData(endpoint, [`address=${input.address}`])
      return response
    }),
  poolInfo: procedure
    .input(
      z.object({
        address: z.string(),
        contractId: z.string(),
      })
    )
    .output(
      z.object({
        balance_a: z.number(),
        balance_b: z.number(),
        liquidity: z.number(),
        max_withdraw_a: z.number(),
        max_withdraw_b: z.number(),
        // user_deposited_a: z.number(),
        // user_deposited_b: z.number(),
        last_tx: z.number(),
      })
    )
    .query(async ({ input }) => {
      const endpoint = 'nano_contract/state'
      const queryParams = [`id=${input.contractId}`, `calls[]=user_info("a'${input.address}'")`]

      const response = await fetchNodeData(endpoint, queryParams)
      const result = response['calls'][`user_info("a'${input.address}'")`]['value']

      const endpoint_lasttx = 'nano_contract/history'
      const queryParams_lasttx = [`id=${input.contractId}`]
      const response_lasttx = await fetchNodeData(endpoint_lasttx, queryParams_lasttx)
      const result_lasttx = response_lasttx['history']
        .filter((tx: any) => tx['nc_context']['address'] == input.address)
        .filter((tx: any) => tx['nc_method'] == 'add_liquidity' || tx['nc_method'] == 'remove_liquidity')[0][
        'timestamp'
      ]

      return { ...result, last_tx: result_lasttx }
    }),
})
