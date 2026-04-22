// Main pool router - merges queries, quotes, and transactions
// This structure maintains backward compatibility with existing API calls

import { createTRPCRouter } from '../../trpc'
import { chartProcedures } from './chart'
import { queryProcedures } from './queries'
import { quoteProcedures } from './quotes'
import { transactionProcedures, type TransactionHistory } from './transactions'

export const poolRouter = createTRPCRouter({
  ...queryProcedures,
  ...quoteProcedures,
  ...transactionProcedures,
  ...chartProcedures,
})

export type { PoolChartPoint } from './chart'

export type { TransactionHistory }
