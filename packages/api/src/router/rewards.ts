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
    .input(z.object({ contractId: z.string(), address: z.string(), methods: z.array(z.string()) }))
    .query(async ({ input }) => {
      const endpoint = 'nano_contract/history'
      const queryParams = [`id=${input.contractId}`]
      const response = await fetchNodeData(endpoint, queryParams)

      const checkClaim = response['history']
        .filter((tx: any) => input.methods.includes(tx['nc_method']))
        .filter((tx: any) => tx['inputs'].some((x: any) => x['decoded']['address'] == input.address))
      const success = checkClaim.length > 0 ? true : false
      return success
    }),
})
