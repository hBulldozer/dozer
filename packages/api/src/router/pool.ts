import { symbol, z } from 'zod'

import { createTRPCRouter, procedure } from '../trpc'
import { fetchNodeData } from '../helpers/fetchFunction'
import { PrismaClient, Token } from '@dozer/database'
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
const fetchAndProcessPoolData = async (
  pool: {
    id: string
    chainId: number
    token0: Token
    token1: Token
    hourSnapshots: {
      liquidityUSD: number
      volumeUSD: number
      priceHTR: number
      reserve0: number
      reserve1: number
      volume0: number
      volume1: number
    }[]
  },
  priceHTR: number
): Promise<Pair> => {
  const endpoint = 'nano_contract/state'
  const queryParams = [`id=${pool.id}`, `calls[]=pool_data()`]

  const rawPoolData = await fetchNodeData(endpoint, queryParams)
  const poolData = rawPoolData.calls['pool_data()'].value
  const { fee, reserve0, reserve1, fee0, fee1, volume0, volume1 } = poolData

  const { id, chainId, token0, token1 } = pool

  const liquidityUSD = (2 * priceHTR * reserve0) / 100
  const volumeUSD = (volume0 * priceHTR + (volume1 * priceHTR * reserve0) / reserve1) / 100
  const priceHTRold = pool.hourSnapshots[0]?.priceHTR || 1
  const volume0old = pool.hourSnapshots[0]?.volume0 || 0
  const volume1old = pool.hourSnapshots[0]?.volume1 || 0
  const reserve0old = pool.hourSnapshots[0]?.reserve0 || 0
  const reserve1old = pool.hourSnapshots[0]?.reserve1 || 0
  const volume1d =
    (volume0 * priceHTR - volume0old * priceHTRold) / 100 +
    ((volume1 * priceHTR * reserve0) / reserve1 - (volume1old * priceHTRold * reserve0old) / reserve1old) / 100
  const feeUSD = (fee0 * priceHTR + (fee1 * priceHTR * reserve0) / reserve1) / 100
  return {
    id: id,
    name: `${token0.symbol}-${token1.symbol}`,
    liquidityUSD: liquidityUSD, //calculateLiquidityUSD(poolData, token0, token1), // Placeholder
    volume0: volume0,
    volume1: volume1,
    volumeUSD: volumeUSD,
    feeUSD: feeUSD,
    swapFee: fee, // !!TODO remove hardcoded
    apr: Math.pow(1 + (volume1d * fee) / liquidityUSD / 100, 365) - 1,
    token0: token0,
    token1: token1,
    reserve0: reserve0 / 100,
    reserve1: reserve1 / 100,
    chainId: chainId, // Or another way to get chainId
    liquidity: (2 * reserve0) / 100, //poolData.reserve0 + poolData.reserve1, // Or a more complex calculation
    volume1d: volume1d > 0.00001 ? volume1d : 0,
    fees1d: feeUSD - (pool.hourSnapshots[0]?.volumeUSD || 0),
    daySnapshots: [],
    hourSnapshots: [],
  }
}

export const poolRouter = createTRPCRouter({
  all: procedure.query(async ({ ctx }) => {
    // Fetch all pool IDs from the database
    const pools = await ctx.prisma.pool.findMany({
      select: {
        id: true,
        chainId: true,
        token0: true,
        token1: true,
        hourSnapshots: {
          select: {
            volumeUSD: true,
            volume0: true,
            volume1: true,
            reserve0: true,
            reserve1: true,
            liquidityUSD: true,
            priceHTR: true,
          },
          where: {
            date: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
            },
          },
          orderBy: {
            date: 'asc',
          },
          take: 1, // Get only the latest snapshot within the 24-hour period
        },
      },
    })
    const htrUsdtPool = pools.find((pool) => {
      const symbols = [pool.token0.symbol, pool.token1.symbol]
      return symbols.includes('HTR') && symbols.includes('USDT')
    })

    const endpoint = 'nano_contract/state'
    const queryParams = [`id=${htrUsdtPool?.id}`, `calls[]=pool_data()`]

    const rawPoolData = await fetchNodeData(endpoint, queryParams)
    const poolData = rawPoolData.calls['pool_data()'].value
    const htrPrice = htrUsdtPool
      ? htrUsdtPool.token0.symbol === 'HTR'
        ? poolData.reserve1 / poolData.reserve0
        : poolData.reserve0 / poolData.reserve1
      : 1 // Default to 1 if htrUsdtPool is undefined
    // Process each pool concurrently (for efficiency)
    const poolDataPromises = pools.map((pool) => fetchAndProcessPoolData(pool, htrPrice))
    const allPoolData = await Promise.all(poolDataPromises)

    return allPoolData
  }),
  snapsById: procedure.input(z.object({ id: z.string() })).query(({ ctx, input }) => {
    return ctx.prisma.pool.findFirst({
      where: { id: input.id },
      include: {
        hourSnapshots: { orderBy: { date: 'desc' } },
        daySnapshots: { orderBy: { date: 'desc' } },
      },
    })
  }),

  front_quote_add_liquidity_in: procedure
    .input(z.object({ id: z.string(), amount_in: z.number(), token_in: z.string() }))
    .output(z.number())
    .query(async ({ ctx, input }) => {
      const endpoint = 'nano_contract/state'
      const amount = input.amount_in * 100 // correcting input to the backend
      const queryParams = [`id=${input.id}`, `calls[]=front_quote_add_liquidity_in(${amount},"${input.token_in}")`]
      const response = await fetchNodeData(endpoint, queryParams)
      if ('errmsg' in response['calls'][`front_quote_add_liquidity_in(${amount},"${input.token_in}")`]) return 0
      else {
        const result = response['calls'][`front_quote_add_liquidity_in(${amount},"${input.token_in}")`]['value']
        const quote = result / 100 // correcting output to the frontend
        return quote
      }
    }),
  front_quote_add_liquidity_out: procedure
    .input(z.object({ id: z.string(), amount_out: z.number(), token_in: z.string() }))
    .output(z.number())
    .query(async ({ ctx, input }) => {
      const endpoint = 'nano_contract/state'
      const amount = input.amount_out * 100 // correcting input to the backend
      const queryParams = [`id=${input.id}`, `calls[]=front_quote_add_liquidity_out(${amount},"${input.token_in}")`]
      const response = await fetchNodeData(endpoint, queryParams)
      if ('errmsg' in response['calls'][`front_quote_add_liquidity_out(${amount},"${input.token_in}")`]) return 0
      else {
        const result = response['calls'][`front_quote_add_liquidity_out(${amount},"${input.token_in}")`]['value']
        const quote = result / 100 // correcting output to the frontend
        return quote
      }
    }),

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
    .input(z.object({ id: z.string(), amount_out: z.number(), token_in: z.string() }))
    .output(z.object({ amount_in: z.number(), price_impact: z.number() }))
    .query(async ({ ctx, input }) => {
      const endpoint = 'nano_contract/state'
      const amount = input.amount_out * 100 // correcting input to the backend
      const queryParams = [
        `id=${input.id}`,
        `calls[]=front_quote_tokens_for_exact_tokens(${amount},"${input.token_in}")`,
      ]
      const response = await fetchNodeData(endpoint, queryParams)
      if ('errmsg' in response['calls'][`front_quote_tokens_for_exact_tokens(${amount},"${input.token_in}")`])
        return { amount_in: 0, price_impact: 0 }
      else {
        const result = response['calls'][`front_quote_tokens_for_exact_tokens(${amount},"${input.token_in}")`]['value']
        const amount_in = result['amount_in'] / 100 // correcting output to the frontend
        return { amount_in, price_impact: result['price_impact'] }
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

      return response
    }),
  add_liquidity: procedure
    .input(
      z.object({
        ncid: z.string(),
        token_a: z.string(),
        amount_a: z.number(),
        token_b: z.string(),
        amount_b: z.number(),
        address: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { ncid, token_a, amount_a, token_b, amount_b, address } = input
      const pool = new LiquidityPool(token_a, token_b, 5, ncid)
      const response = await pool.add_liquidity(token_a, amount_a, token_b, amount_b, address, 'users')
      return response
    }),
  remove_liquidity: procedure
    .input(
      z.object({
        ncid: z.string(),
        token_a: z.string(),
        amount_a: z.number(),
        token_b: z.string(),
        amount_b: z.number(),
        address: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { ncid, token_a, amount_a, token_b, amount_b, address } = input
      const pool = new LiquidityPool(token_a, token_b, 5, ncid)
      const response = await pool.remove_liquidity(token_a, amount_a, token_b, amount_b, address, 'users')
      return response
    }),
  getTxStatus: procedure
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
