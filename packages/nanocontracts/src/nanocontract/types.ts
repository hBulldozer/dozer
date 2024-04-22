import { z } from 'zod'

const transactionType = z.string().refine(
  (value) => {
    return value === 'deposit' || value === 'withdrawal'
  },
  { message: 'Invalid transaction type. Must be "deposit" or "withdrawal".' }
)

const argsType = z.string().refine(
  (value) => {
    return value === 'byte' || value === 'int'
  },
  { message: 'Invalid arguments type. Must be "byte" or "int".' }
)

export const ZNCAction = z.object({
  type: transactionType,
  token: z.string(),
  data: z.object({
    amount: z.number(),
  }),
})

export const ZNCArgs = z.object({
  type: argsType,
  value: z.string(),
})

export type NCAction = z.infer<typeof ZNCAction>
export type NCArgs = z.infer<typeof ZNCArgs>
