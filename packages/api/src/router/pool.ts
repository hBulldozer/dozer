import { z } from 'zod'

import { createTRPCRouter, procedure } from '../trpc'
import { fetchNodeData } from '../helpers/fetchFunction'
import { PrismaClient } from '@dozer/database'
import { LiquidityPool } from '@dozer/nanocontracts'
import { toToken } from '../functions'
import { Pair } from '../..'
// Exporting common functions to use in another routers, as is suggested in https://trpc.io/docs/v10/server/server-side-calls
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
export const HTRPoolByTokenUuid = async (uuid: string, chainId: number, prisma: PrismaClient) => {
  if (uuid == '00') {
    return await prisma.pool.findFirst({
      where: { token0: { uuid: '00' }, chainId: chainId },
      include: {
        token0: true,
        token1: true,
        tokenLP: true,
      },
    })
  } else {
    return await prisma.pool.findFirst({
      where: { token1: { uuid: uuid, chainId: chainId }, token0: { uuid: '00', chainId: chainId } },
      include: {
        token0: true,
        token1: true,
        tokenLP: true,
      },
    })
  }
}

// 1. Modular Function to Fetch and Process Pool Data
const fetchAndProcessPoolData = async (prisma: PrismaClient, poolId: string): Promise<Pair> => {
  const endpoint = 'nano_contract/state'
  const queryParams = [`id=${poolId}`, `calls[]=front_end_api_pool()`]

  const rawPoolData = await fetchNodeData(endpoint, queryParams)
  const poolData = rawPoolData.calls['front_end_api_pool()'].value

  // Assuming you have functions for the calculations, e.g.,
  // calculateLiquidityUSD, calculateVolumeUSD, etc.
  const tokens = await prisma.pool.findUnique({
    where: { id: poolId },
    select: { token0: true, token1: true, tokenLP: true },
  })
  if (!tokens) {
    throw new Error(`Pool with id ${poolId} not found`)
  }

  const { token0, token1 } = tokens

  return {
    id: poolId,
    name: `${token0.symbol}-${token1.symbol}`,
    liquidityUSD: 5555, //calculateLiquidityUSD(poolData, token0, token1), // Placeholder
    volumeUSD: 5555, //calculateVolumeUSD(poolData, token0, token1), // Placeholder
    feeUSD: 5555, // or a calculation using poolData.fee0/fee1
    swapFee: poolData.fee, // Adjust if needed
    apr: 5555, //calculateAPR(poolData), // Placeholder
    token0: token0,
    token1: token1,
    reserve0: poolData.reserve0,
    reserve1: poolData.reserve1,
    chainId: token0.chainId, // Or another way to get chainId
    liquidity: 5555, //poolData.reserve0 + poolData.reserve1, // Or a more complex calculation
    volume1d: 5555, // poolData.volume, // Or calculate based on timestamps
    fees1d: 5555, //poolData.fee, // Or calculate based on timestamps
    daySnapshots: [],
    hourSnapshots: [],
  }
}

export const poolRouter = createTRPCRouter({
  all: procedure.query(async ({ ctx }) => {
    // Fetch all pool IDs from the database
    const poolIds = await ctx.prisma.pool.findMany({
      select: { id: true },
    })

    // Process each pool concurrently (for efficiency)
    const poolDataPromises = poolIds.map((pool) => fetchAndProcessPoolData(ctx.prisma, pool.id))
    const allPoolData = await Promise.all(poolDataPromises)

    return allPoolData
  }),
  //New procedures enhanced SQL

  quote_exact_tokens_for_tokens: procedure
    .input(z.object({ id: z.string(), amount_in: z.number(), token_in: z.string() }))
    .output(z.object({ amount_out: z.number(), price_impact: z.number() }))
    .query(async ({ ctx, input }) => {
      const endpoint = 'nano_contract/state'
      const amount = input.amount_in * 100 // correcting input to the backend
      const queryParams = [
        `id=${input.id}`,
        `calls[]=front_quote_exact_tokens_for_tokens(${amount},"${input.token_in}")`,
      ]
      const response = await fetchNodeData(endpoint, queryParams)
      if ('errmsg' in response['calls'][`front_quote_exact_tokens_for_tokens(${amount},"${input.token_in}")`])
        return { amount_out: 0, price_impact: 0 }
      else {
        const result = response['calls'][`front_quote_exact_tokens_for_tokens(${amount},"${input.token_in}")`]['value']
        const amount_out = result['amount_out'] / 100 // correcting output to the frontend
        return { amount_out, price_impact: result['price_impact'] }
      }
    }),
  quote_tokens_for_exact_tokens: procedure
    .input(z.object({ id: z.string(), amount_in: z.number(), token_in: z.string() }))
    .output(z.object({ amount_out: z.number(), price_impact: z.number() }))
    .query(async ({ ctx, input }) => {
      const endpoint = 'nano_contract/state'
      const amount = input.amount_in * 100 // correcting input to the backend
      const queryParams = [
        `id=${input.id}`,
        `calls[]=front_quote_tokens_for_exact_tokens(${amount},"${input.token_in}")`,
      ]
      const response = await fetchNodeData(endpoint, queryParams)
      if ('errmsg' in response['calls'][`front_quote_tokens_for_exact_tokens(${amount},"${input.token_in}")`])
        return { amount_out: 0, price_impact: 0 }
      else {
        const result = response['calls'][`front_quote_tokens_for_exact_tokens(${amount},"${input.token_in}")`]['value']
        const amount_out = result['amount_out'] / 100 // correcting output to the frontend
        return { amount_out, price_impact: result['price_impact'] }
      }
    }),
  swap_tokens_for_exact_tokens: procedure
    .input(
      z.object({
        ncid: z.string(),
        token_in: z.string(),
        amount_in: z.number(),
        token_out: z.string(),
        amount_out: z.number(),
        address: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { ncid, token_in, amount_in, token_out, amount_out, address } = input
      const pool = new LiquidityPool(token_in, token_out, 5, ncid)
      const response = await pool.swap_tokens_for_exact_tokens(
        token_in,
        amount_in,
        token_out,
        amount_out,
        address,
        'users'
      )
      return response
    }),
  swap_exact_tokens_for_tokens: procedure
    .input(
      z.object({
        ncid: z.string(),
        token_in: z.string(),
        amount_in: z.number(),
        token_out: z.string(),
        amount_out: z.number(),
        address: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { ncid, token_in, amount_in, token_out, amount_out, address } = input
      const pool = new LiquidityPool(token_in, token_out, 0, ncid)
      const response = await pool.swap_exact_tokens_for_tokens(
        token_in,
        amount_in,
        token_out,
        amount_out,
        address,
        'users'
      )
      console.log(response)
      return response
    }),
  waitForTx: procedure
    .input(
      z.object({
        hash: z.string(),
        chainId: z.number(),
      })
    )
    .query(async ({ input }) => {
      let response, endpoint
      let message = ''
      let validation = 'pending'
      if (input.hash == 'Error') {
        return { status: 'failed', message: 'txHash not defined' }
      }
      // while (validation == 'pending') {
      //   await delay(5000)
      try {
        endpoint = 'transaction'
        response = await fetchNodeData(endpoint, [`id=${input.hash}`]).then((res) => {
          console.log('Waiting tx validation...')
          validation = res.success
            ? res.meta.voided_by.length
              ? 'failed'
              : res.meta.first_block
              ? 'success'
              : 'pending'
            : 'failed'
          // console.log(res.success, res.meta.first_block, !res.meta.voided_by.length ? true : false)
          // console.log(res)
          message =
            res.message || res.meta.voided_by.length
              ? `Error on TX Validation, voided by: ${res.meta.voided_by}`
              : 'Error on TX Validation'
        })
      } catch (e) {
        console.log(e)
      }
      // }
      return { status: validation, message: message }
    }),
})
