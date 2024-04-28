import { z } from 'zod'

const transactionType = z.string().refine(
  (value) => {
    return value === 'deposit' || value === 'withdrawal'
  },
  { message: 'Invalid transaction type. Must be "deposit" or "withdrawal".' }
)

export const ZNCAction = z.object({
  type: transactionType,
  token: z.string(),
  amount: z.number(),
  address: z.optional(z.string()),
  changeAddress: z.optional(z.string()),
})

export const ZNCArgs = z.string().or(z.number())

export type NCAction = z.infer<typeof ZNCAction>
export type NCArgs = z.infer<typeof ZNCArgs>
