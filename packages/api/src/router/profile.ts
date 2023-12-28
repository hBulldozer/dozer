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
      const response = await fetch(
        `https://node1.testnet.hathor.network/v1a/thin_wallet/address_balance?address=${input.address}`
      )
      const data = await response.json()
      return data
    }),
  pool: procedure
    .input(
      z.object({
        address: z.string(),
        contractId: z.string(),
      })
    )
    .output(
      z.object({
        user_deposit_a: z.number(),
        user_deposit_b: z.number(),
        rewards_user_dzr: z.number(),
      })
    )
    .query(async ({ input }) => {
      const endpoint = 'nano_contract/state'
      const queryParams = [`id=${input.contractId}`, `calls[]=front_end_api_user("a'${input.address}'")`]

      const response = await fetchNodeData(endpoint, queryParams)
      const result = response['calls'][`front_end_api_user("a'${input.address}'")`]['value']
      return result
    }),
})
