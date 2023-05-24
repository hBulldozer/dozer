import { z } from 'zod'

import { createTRPCRouter, procedure } from '../trpc'

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
})

