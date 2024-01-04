import { z } from 'zod'
import { RouterOutputs } from '..'

// Defining api return from Nanocontracts
export const FrontEndApiNCObject = z.object({
  reserve0: z.number(),
  reserve1: z.number(),
  fee: z.number(),
  volume: z.number(),
  fee0: z.number(),
  fee1: z.number(),
  dzr_rewards: z.number(),
  transactions: z.number(),
})

// Exporting all types to be used through the app
export type AllPoolsDBOutput = RouterOutputs['getPools']['all']
export type FrontEndApiNCOutput = RouterOutputs['getPools']['byIdFromContract']
