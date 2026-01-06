import { z } from 'zod'

import { createTRPCRouter, procedure } from '../trpc'
import { fetchNodeData } from '../helpers/fetchFunction'

export const NanoStateRouter = createTRPCRouter({
  byUser: procedure.input(z.string()).query(async ({ input }) => {
    const contractId = '00000076646da548460355a81b05f99ff4cefb2851f7de3e758a1a1ae3dbabb1 '
    const resp = await fetch(
      `http://localhost:8080/v1a/nano_contract/state?id=${contractId}&fields[]=earnings_per_second&fields[]=owner_balance&fields[]=user_deposits.a'${input}'`
    )
    const data = await resp.json()
    return data.fields.earnings_per_second.value
  }),
  maxWithdrawByUser: procedure
    .input(
      z.object({
        address: z.string(),
        contractId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const endpoint = 'nano_contract/state'
      const now = new Date().getTime() / 1000
      const queryParams = [`id=${input.contractId}`, `calls[]=get_max_withdrawal("a'${input.address}'",${now})`]

      const response = await fetchNodeData(endpoint, queryParams)
      const result = response['calls'][`get_max_withdrawal("a'${input.address}'",${now})`]['value']
      return result
    }),
  api: procedure.query(async ({ ctx }) => {
    // This method was using legacy pool_data() call which doesn't exist in DozerPoolManager
    // Return empty result for now - update if specific functionality is needed
    return {
      owner_balance: 0,
      total_staked: 0,
      rewards_per_share: 0,
    }
  }),
})

interface ApiResult {
  owner_balance: number
  total_staked: number
  rewards_per_share: number
}
