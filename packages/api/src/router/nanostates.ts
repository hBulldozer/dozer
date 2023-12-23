import { z } from 'zod'

import { createTRPCRouter, procedure } from '../trpc'

export const NanoStateRouter = createTRPCRouter({
  byUser: procedure.input(z.string()).query(async ({ input }) => {
    const contractId = '00000076646da548460355a81b05f99ff4cefb2851f7de3e758a1a1ae3dbabb1 '
    const resp = await fetch(
      `http://localhost:8080/v1a/nano_contract/state?id=${contractId}&fields[]=earnings_per_second&fields[]=owner_balance&fields[]=user_deposits.a'${input}'`
    )
    const data = await resp.json()
    return data.fields.earnings_per_second.value
  }),
  maxWithdrawByUser: procedure.input(z.string()).query(async ({ input }) => {
    const contractId = '00000076646da548460355a81b05f99ff4cefb2851f7de3e758a1a1ae3dbabb1'
    const resp = await fetch(
      `http://localhost:8080/v1a/nano_contract/state?id=${contractId}&calls[]=get_max_withdrawal("a'${input}'",${
        new Date().getTime() / 1000
      })`
    )
    const data = await resp.json()
    return data
  }),
  api: procedure.query(async () => {
    const contractId = '0000020a0d5702f866bdd595ec4fdb72fe245ae2c4cd16cb11473fd9495e4de3'
    const resp = await fetch(`http://localhost:8080/v1a/nano_contract/state?id=${contractId}&calls[]=front_end_api()`)
    const data = await resp.json()
    const result: ApiResult = data['calls']['front_end_api()']['value']
    return result
  }),
})

interface ApiResult {
  owner_balance: number
  total_staked: number
  rewards_per_share: number
}
