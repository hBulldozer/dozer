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
    try {
      const start = await fetch(`${process.env.LOCAL_WALLET_MASTER_URL}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.WALLET_API_KEY || '',
        },
        body: JSON.stringify({ 'wallet-id': process.env.WALLET_ID, seedKey: 'genesis' }),
      })
      console.log(`Started wallet. Sending TX`)
      const balancePromise = fetchNodeData('thin_wallet/address_balance', [`address=${input.address}`])
      const balance = await balancePromise
      console.log(balance)
      const htrAmount = !('00' in balance.tokens_data)
        ? 0
        : balance.tokens_data['00'].received - balance.tokens_data['00'].spent
      console.log('htrAmount', htrAmount)
      if (htrAmount > 5_000_00) {
        return { success: false, message: 'Create a new wallet to join the Event.', hash: '0x0' }
      } else {
        const response = await fetch(`${process.env.LOCAL_WALLET_MASTER_URL}/wallet/simple-send-tx`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-wallet-id': process.env.WALLET_ID || '',
            'x-api-key': process.env.WALLET_API_KEY || '',
          },
          body: JSON.stringify({
            address: input.address,
            value: 5_000_00 - htrAmount,
            token: '00',
            change_address: process.env.LOCAL_WALLET_MASTER_ADDRESS || '',
          }),
        })

        const data = await response.json()

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
      }
    } catch (e) {
      console.log(e)
      return { success: false, message: 'Failed to send HTR' }
    }
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
