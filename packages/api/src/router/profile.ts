import { z } from 'zod'

import { createTRPCRouter, procedure } from '../trpc'
import { fetchNodeData } from '../helpers/fetchFunction'
import { useTempTxStore } from '@dozer/zustand'

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
        last_tx: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        const endpoint = 'nano_contract/state'
        const queryParams = [`id=${input.contractId}`, `calls[]=user_info("a'${input.address}'")`]

        const response = await fetchNodeData(endpoint, queryParams)
        const result = response['calls'][`user_info("a'${input.address}'")`]['value']

        const endpoint_lasttx = 'nano_contract/history'
        const queryParams_lasttx = [`id=${input.contractId}`]
        const response_lasttx = await fetchNodeData(endpoint_lasttx, queryParams_lasttx)

        const add_remove_liquidity_txs = response_lasttx['history'].filter(
          (tx: any) => tx['nc_method'] == 'add_liquidity' || tx['nc_method'] == 'remove_liquidity'
        )

        const result_lasttx =
          add_remove_liquidity_txs.length > 0
            ? Math.max(
                ...add_remove_liquidity_txs
                  .filter((tx: any) => tx['inputs'].some((input: any) => input['address'] == input.address))
                  .map((tx: any) => tx['timestamp'])
              )
            : Math.max(
                ...response_lasttx['history']
                  .filter((tx: any) => tx['nc_method'] == 'initialize')
                  .map((tx: any) => tx['timestamp'])
              )

        // Get temporary transaction data
        const tempTxs = useTempTxStore.getState().getTempTx(input.contractId, input.address)

        // Adjust max_withdraw values based on temporary transactions
        const adjustedMaxWithdrawA =
          result.max_withdraw_a + tempTxs.addedLiquidity.tokenA - tempTxs.removedLiquidity.tokenA
        const adjustedMaxWithdrawB =
          result.max_withdraw_b + tempTxs.addedLiquidity.tokenB - tempTxs.removedLiquidity.tokenB

        return {
          ...result,
          max_withdraw_a: Math.max(0, adjustedMaxWithdrawA), // Ensure non-negative values
          max_withdraw_b: Math.max(0, adjustedMaxWithdrawB),
          last_tx: result_lasttx,
        }
      } catch (error) {
        console.log(error)
        return {
          balance_a: 0,
          balance_b: 0,
          liquidity: 0,
          max_withdraw_a: 0,
          max_withdraw_b: 0,
          last_tx: 0,
        }
      }
    }),
})
