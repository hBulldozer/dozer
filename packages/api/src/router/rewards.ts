import { TRPCError } from '@trpc/server'
import crypto from 'crypto'
import { z } from 'zod'

import { createTRPCRouter, procedure } from '../trpc'
import { fetchNodeData } from '../helpers/fetchFunction'

export const rewardsRouter = createTRPCRouter({
  zealyConnect: procedure
    .input(
      z.object({
        address: z.string(),
        zealyUserId: z.string(),
        signature: z.string(),
        callbackUrl: z.string().url(),
        fullUrl: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { zealyUserId, signature, callbackUrl, fullUrl } = input

      // Verify signature
      const url = new URL(fullUrl)
      url.searchParams.delete('signature')
      const hmac = crypto.createHmac('sha256', process.env.ZEALY_CONNECT_SECRET as string)
      hmac.update(url.toString())
      const generatedSignature = hmac.digest('hex')

      if (generatedSignature !== signature) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid signature',
        })
      }

      // Check if user is authenticated
      //   if (!ctx.address) {
      //     throw new TRPCError({
      //       code: 'UNAUTHORIZED',
      //       message: 'User not authenticated',
      //     })
      //   }

      // Save Zealy User ID (you might want to implement this)
      // await updateUser(ctx.address, { zealyId: zealyUserId });

      // Prepare callback URL
      const callbackWithParams = new URL(callbackUrl)
      callbackWithParams.searchParams.append('identifier', input.address)

      const callbackHmac = crypto.createHmac('sha256', process.env.ZEALY_CONNECT_SECRET as string)
      callbackHmac.update(callbackWithParams.toString())
      const callbackSignature = callbackHmac.digest('hex')
      callbackWithParams.searchParams.append('signature', callbackSignature)

      return {
        redirectUrl: callbackWithParams.toString(),
        zealyUserId,
      }
    }),
  checkClaim: procedure
    .input(
      z.object({
        contractId: z.string(),
        address: z.string(),
        methods: z.array(z.string()),
        minimum_amount: z.number().optional(),
        latest_timestamp: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const endpoint = 'nano_contract/history'
      const queryParams = [`id=${input.contractId}`]
      const response = await fetchNodeData(endpoint, queryParams)
      const checkClaim = response['history']
        .filter((tx: any) => input.methods.includes(tx['nc_method'])) // Filter out transactions not involving the specified methods
        .filter((tx: any) => tx['inputs'].some((x: any) => x['decoded']['address'] == input.address)) // Filter out transactions not involving the specified address
        .filter((tx: any) => (input.latest_timestamp ? tx['timestamp'] > input.latest_timestamp - 24 * 60 * 60 : true)) // Filter out transactions older than 24 hours
        .filter(
          (tx: any) =>
            tx['nc_context']['actions'].filter((x: any) =>
              input.minimum_amount ? x['token_uid'] == '00' && x['amount'] >= input.minimum_amount : true
            ).length > 0
        ) // Filter out transactions with less than the specified minimum amount, if minimum_amount is not provided, it will not filter
      const success = checkClaim.length > 0 ? true : false
      return success
    }),
  checkClaimFriends: procedure
    .input(
      z.object({
        contractId: z.string(),
        address: z.string(),
        methods: z.array(z.string()),
        n_of_friends: z.number(),
      })
    )
    .query(async ({ input }) => {
      const endpoint = 'nano_contract/history'
      const queryParams = [`id=${input.contractId}`]
      const response = await fetchNodeData(endpoint, queryParams)
      const checkClaim = response['history']
        .filter((tx: any) => input.methods.includes(tx['nc_method'])) // Filter out transactions not involving the specified methods
        .filter((tx: any) => tx['inputs'].some((x: any) => x['decoded']['address'] != input.address)) // Filter out transactions not involving the specified address
      const success = checkClaim.length >= input.n_of_friends ? true : false
      return success
    }),
  checkAnotherCustomToken: procedure
    .input(
      z.object({
        address: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const endpoint = 'thin_wallet/address_search'
      const queryParams = [`address=${input.address}`, 'count=50']
      const data = await fetchNodeData(endpoint, queryParams)
      if (!data || !data.success || !data.transactions) {
        throw new Error('Failed to fetch transactions')
      }
      const transactions = data.transactions
      const anotherCustomTokens = await ctx.prisma.token.findMany({
        where: { createdBy: { notIn: [input.address, ''] } },
        select: { uuid: true },
      })
      const anotherCustomTokensUuid = anotherCustomTokens.map((token) => token.uuid)
      const anotherPools = await ctx.prisma.pool.findMany({
        where: { token1: { uuid: { in: anotherCustomTokensUuid } } },
        select: { id: true },
      })
      const anotherPoolsId = anotherPools.map((pool) => pool.id)
      if (transactions.has_more) {
        // If more than 50 transactions, check only in database
        const endpoint_balance = 'thin_wallet/address_balance'
        const queryParams_balance = [`address=${input.address}`]
        const data_balance = await fetchNodeData(endpoint_balance, queryParams_balance)
        const balance = Object.keys(data_balance.tokens_data)
        console.log(balance)
        const checkInBalance = balance.filter((token: string) =>
          anotherCustomTokensUuid.some((token_uuid: string) => token == token_uuid)
        )
        return checkInBalance.length > 0 ? true : false
      } else {
        // If less than 50 transactions, check in the node address_search endpoint
        const swapAnotherCustomTokenTx = transactions
          .filter(
            (tx: any) =>
              'nc_method' in tx &&
              (tx['nc_method'] == 'swap_tokens_for_exact_tokens' || tx['nc_method'] == 'swap_exact_tokens_for_tokens')
          )
          .filter((tx: any) => 'nc_id' in tx && anotherPoolsId.includes(tx['nc_id']))
        return swapAnotherCustomTokenTx.length > 0 ? true : false
      }
    }),
})
