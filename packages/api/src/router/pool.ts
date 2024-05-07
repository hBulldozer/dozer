import { any, z } from 'zod'

import { createTRPCRouter, procedure } from '../trpc'
import { fetchNodeData } from '../helpers/fetchFunction'
import { FrontEndApiNCObject } from '../types'
import { PrismaClient } from '@dozer/database'
import { LiquidityPool } from '@dozer/nanocontracts'

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

export const idFromHTRPoolByTokenUuid = async (uuid: string, chainId: number, prisma: PrismaClient) => {
  if (uuid == '00') {
    return await prisma.pool.findFirst({
      where: { token0: { uuid: '00' }, chainId: chainId },
      select: { id: true },
    })
  } else {
    return await prisma.pool.findFirst({
      where: { token1: { uuid: uuid, chainId: chainId }, token0: { uuid: '00', chainId: chainId } },
      select: { id: true },
    })
  }
}

export const HTRPoolByTokenUuidFromContract = async (uuid: string, chainId: number, prisma: PrismaClient) => {
  const poolId = await idFromHTRPoolByTokenUuid(uuid, chainId, prisma)
  if (!poolId) return {}
  const endpoint = 'nano_contract/state'
  const queryParams = [`id=${poolId.id}`, `calls[]=front_end_api_pool()`]
  const response = await fetchNodeData(endpoint, queryParams)
  const result = response['calls'][`front_end_api_pool()`]['value']
  return result
}

export const getPoolSnaps24h = async (tokenUuid: string, prisma: PrismaClient) => {
  const result = await prisma.hourSnapshot.findMany({
    where: {
      AND: [
        { date: { gte: new Date(Date.now() - 60 * 60 * 24 * 1000) } },
        {
          pool: {
            token0: {
              uuid: '00',
            },
          },
        },
        {
          pool: {
            token1: {
              uuid: tokenUuid,
            },
          },
        },
      ],
    },
    //we can select vol, liq for example only for the pool page
    select: {
      date: true,
      poolId: true,
      // volumeUSD: true,
      // liquidityUSD: true,
      // apr: true,
      reserve0: true,
      reserve1: true,
      priceHTR: true,
    },
  })
  return result.reverse().map((snap) => {
    return { date: snap.date, priceToken: (snap.reserve0 / snap.reserve1) * snap.priceHTR, priceHTR: snap.priceHTR }
  })
}

export const poolRouter = createTRPCRouter({
  //New procedures enhanced SQL
  allNcids: procedure.query(({ ctx }) => {
    return ctx.prisma.pool.findMany({
      select: {
        id: true,
      },
    })
  }),
  contractState: procedure
    .input(z.object({ id: z.string() }))
    .output(FrontEndApiNCObject)
    .output(FrontEndApiNCObject)
    .query(async ({ ctx, input }) => {
      const endpoint = 'nano_contract/state'
      const queryParams = [`id=${input.id}`, `calls[]=front_end_api_pool()`]
      const response = await fetchNodeData(endpoint, queryParams)
      const result = response['calls'][`front_end_api_pool()`]['value']
      return result
    }),
  hourSnaps: procedure.input(z.object({ tokenUuid: z.string() })).query(async ({ ctx, input }) => {
    return getPoolSnaps24h(input.tokenUuid, ctx.prisma)
  }),
  all: procedure.query(({ ctx }) => {
    return ctx.prisma.pool.findMany({
      include: {
        token0: true,
        token1: true,
        tokenLP: true,
      },
    })
  }),
  byIdFromContract: procedure
    .input(z.object({ id: z.string() }))
    .output(FrontEndApiNCObject)
    .query(async ({ ctx, input }) => {
      const endpoint = 'nano_contract/state'
      const queryParams = [`id=${input.id}`, `calls[]=front_end_api_pool()`]
      const response = await fetchNodeData(endpoint, queryParams)
      const result = response['calls'][`front_end_api_pool()`]['value']
      return result
    }),
  byIdWithSnaps: procedure.input(z.object({ id: z.string() })).query(({ ctx, input }) => {
    return ctx.prisma.pool.findFirst({
      where: { id: input.id },
      include: {
        token0: true,
        token1: true,
        tokenLP: true,
        hourSnapshots: {
          where: {
            date: {
              gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 31), //get only one month from 15min snaps
            },
          },
          orderBy: { date: 'desc' },
        },
        daySnapshots: { orderBy: { date: 'desc' } },
      },
    })
  }),
  byTokenUuidWithSnaps: procedure.input(z.object({ uuid: z.string(), chainId: z.number() })).query(({ ctx, input }) => {
    if (input.uuid == '00') {
      return ctx.prisma.pool.findFirst({
        where: { token0: { uuid: '00' }, chainId: input.chainId },
        include: {
          token0: true,
          token1: true,
          tokenLP: true,
          hourSnapshots: { orderBy: { date: 'desc' } },
          daySnapshots: { orderBy: { date: 'desc' } },
        },
      })
    } else {
      return ctx.prisma.pool.findFirst({
        where: { token1: { uuid: input.uuid, chainId: input.chainId }, token0: { uuid: '00', chainId: input.chainId } },
        include: {
          token0: true,
          token1: true,
          tokenLP: true,
          hourSnapshots: { orderBy: { date: 'desc' } },
          daySnapshots: { orderBy: { date: 'desc' } },
        },
      })
    }
  }),
  HTRPoolbyTokenUuid: procedure.input(z.object({ uuid: z.string(), chainId: z.number() })).query(({ ctx, input }) => {
    return HTRPoolByTokenUuid(input.uuid, input.chainId, ctx.prisma)
  }),
  quote_exact_tokens_for_tokens: procedure
    .input(z.object({ id: z.string(), amount_in: z.number(), token_in: z.string() }))
    .output(z.object({ amount_out: z.number(), price_impact: z.number() }))
    .query(async ({ ctx, input }) => {
      const endpoint = 'nano_contract/state'
      const amount = input.amount_in * 100 // correcting input to the backend
      const queryParams = [
        `id=${input.id}`,
        `calls[]=front_quote_exact_tokens_for_tokens(${amount},\"${input.token_in}\")`,
      ]
      const response = await fetchNodeData(endpoint, queryParams)
      if ('errmsg' in response['calls'][`front_quote_exact_tokens_for_tokens(${amount},\"${input.token_in}\")`])
        return { amount_out: 0, price_impact: 0 }
      else {
        const result =
          response['calls'][`front_quote_exact_tokens_for_tokens(${amount},\"${input.token_in}\")`]['value']
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
        `calls[]=front_quote_tokens_for_exact_tokens(${amount},\"${input.token_in}\")`,
      ]
      const response = await fetchNodeData(endpoint, queryParams)
      if ('errmsg' in response['calls'][`front_quote_tokens_for_exact_tokens(${amount},\"${input.token_in}\")`])
        return { amount_out: 0, price_impact: 0 }
      else {
        const result =
          response['calls'][`front_quote_tokens_for_exact_tokens(${amount},\"${input.token_in}\")`]['value']
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
    .output(z.object({ hash: z.string() }))
    .query(async ({ input }) => {
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
    .query(async ({ input }) => {
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
    // .input(z.object({ address: z.string() }))
    .input(
      z.object({
        hash: z.string(),
        chainId: z.number(),
      })
    )
    .query(async ({ input }) => {
      let response, endpoint, message
      let validation = 'pending'
      if (input.hash == 'Error') {
        return { status: 'failed', message: 'txHash not defined' }
      }
      while (validation == 'pending') {
        await delay(1000)
        try {
          endpoint = 'transaction'
          response = await fetchNodeData(endpoint, [`id=${input.hash}`]).then((res) => {
            console.log('Waiting tx validation...')
            validation = res.success ? (res.meta.first_block ? 'success' : 'pending') : 'failed'
            console.log(res)
            message = res.message
          })
        } catch (e) {
          console.log(e)
        }
      }
      return { status: validation, message: message }
    }),
  byId: procedure.input(z.object({ id: z.string() })).query(({ ctx, input }) => {
    return ctx.prisma.pool.findFirst({
      where: { id: input.id },
      include: {
        token0: true,
        token1: true,
        tokenLP: true,
      },
    })
  }),
  sql: procedure.query(({ ctx }) => {
    const test = ctx.prisma.pool.findMany({
      where: {
        token0: { uuid: '00' },
      },
      select: {
        token1: {
          select: {
            name: true,
            uuid: true,
          },
        },
        hourSnapshots: {
          where: {
            date: {
              gte: new Date(Date.now() - 86400 * 1000),
            },
          },
          select: {
            date: true,
            reserve0: true,
            reserve1: true,
            priceHTR: true,
          },
        },
      },
    })
    return test
  }),
})
