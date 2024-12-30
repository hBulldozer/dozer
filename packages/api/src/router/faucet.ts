import { z } from 'zod'

import { fetchNodeData } from '../helpers/fetchFunction'
import { createTRPCRouter, procedure } from '../trpc'

export const faucetRouter = createTRPCRouter({
  sendHTR: procedure.input(z.object({ address: z.string() })).mutation(async ({ ctx, input }) => {
    console.log(`Sending HTR to ${input.address}`)
    const transactions = await ctx.prisma.faucet.findMany()
    for (const transaction of transactions) {
      if (transaction.address == input.address)
        return {
          success: false,
          message: `You already have a faucet transaction on ${transaction.date}`,
          hash: transaction.hash,
        }
    }
    console.log(`Trying to start wallet`)
    const start = await fetch(`${process.env.LOCAL_WALLET_MASTER_URL}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.WALLET_API_KEY || '',
      },
      body: JSON.stringify({ 'wallet-id': process.env.WALLET_ID, seedKey: 'genesis' }),
    })
    console.log(`Started wallet. Sending TX`)
    const response = await fetch(`${process.env.LOCAL_WALLET_MASTER_URL}/wallet/simple-send-tx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-wallet-id': process.env.WALLET_ID || '',
        'x-api-key': process.env.WALLET_API_KEY || '',
      },
      body: JSON.stringify({
        address: input.address,
        value: 5_000_00,
        token: '00',
      }),
    })
    console.log(response)

    const data = await response.json()

    console.log(data)

    if (!data || !data.hash) {
      throw new Error('Failed to create token on blockchain')
    }

    const database_save = await ctx.prisma.faucet.create({
      data: {
        address: input.address,
        amount: 5_000_00,
        date: new Date(),
        hash: data.hash,
      },
    })

    if (!database_save) {
      throw new Error('Failed to create token on blockchain')
    }

    return { success: true, message: 'Faucet transaction created', hash: data.hash }
  }),
  checkFaucet: procedure.input(z.object({ address: z.string() })).query(async ({ ctx, input }) => {
    const transactions = await ctx.prisma.faucet.findMany({
      where: {
        address: input.address,
      },
    })
    if (transactions.length == 0) {
      return true
    } else {
      return false
    }
  }),
})
