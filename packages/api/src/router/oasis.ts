import { z } from 'zod'

import { fetchNodeData } from '../helpers/fetchFunction'
import { createTRPCRouter, procedure } from '../trpc'

const fetchAndProcessUserOasis = async (
  oasis: { id: string; token: { symbol: string; uuid: string }; pool: { id: string } },
  address: string
) => {
  const endpoint = 'nano_contract/state'
  const call = `user_info("a'${address}'")`
  const queryParams = [`id=${oasis.id}`, `calls[]=${call}`]
  const response = await fetchNodeData(endpoint, queryParams)
  const result = response['calls'][`${call}`]['value']
  const parsed_result = result
    ? {
        token: oasis.token,
        pool: oasis.pool,
        id: oasis.id,
        user_deposit_b: result.user_deposit_b / 100 || 0,
        user_deposit_a: result.user_deposit_a / 100 || 0,
        user_liquidity: result.user_liquidity || 0,
        user_withdrawal_time: new Date((result.user_withdrawal_time || 0) * 1000),
        dev_balance: result.dev_balance / 100 || 0,
        total_liquidity: result.total_liquidity || 0,
        user_balance_a: result.user_balance_a / 100 || 0,
        user_balance_b: result.user_balance_b / 100 || 0,
        user_lp_b: result.user_lp_b || 0,
        user_lp_htr: result.user_lp_htr || 0,
        max_withdraw_htr: result.max_withdraw_htr / 100 || 0,
        max_withdraw_b: result.max_withdraw_b / 100 || 0,
      }
    : {
        token: oasis.token,
        pool: oasis.pool,
        id: oasis.id,
        user_deposit_b: 0,
        user_deposit_a: 0,
        user_liquidity: 0,
        user_withdrawal_time: new Date(0),
        dev_balance: 0,
        total_liquidity: 0,
        user_balance_a: 0,
        user_balance_b: 0,
        user_lp_b: 0,
        user_lp_htr: 0,
        max_withdraw_htr: 0,
        max_withdraw_b: 0,
      }
  return parsed_result
}

const fetchAndProcessReserves = async (oasis: {
  id: string
  token: { symbol: string; uuid: string }
  pool: { id: string }
}) => {
  const endpoint = 'nano_contract/state'
  const call = `oasis_info()`
  const queryParams = [`id=${oasis.id}`, `calls[]=${call}`]
  const response = await fetchNodeData(endpoint, queryParams)
  const result = response['calls'][`${call}`]['value']
  const parsed_result = {
    token: oasis.token,
    pool: oasis.pool,
    id: oasis.id,
    dev_balance: result['dev_balance'] / 100,
    total_liquidity: result['total_liquidity'],
    token_b: result['token_b'],
  }
  return parsed_result
}

export const oasisRouter = createTRPCRouter({
  all: procedure.query(async ({ ctx }) => {
    const oasisContracts = await ctx.prisma.oasis.findMany({
      include: {
        token: {
          select: {
            symbol: true,
            uuid: true,
          },
        },
        pool: {
          select: {
            id: true,
          },
        },
      },
    })
    return oasisContracts
  }),
  allUser: procedure.input(z.object({ address: z.string() })).query(async ({ ctx, input }) => {
    const allOasis = await ctx.prisma.oasis.findMany({
      include: {
        token: {
          select: {
            symbol: true,
            uuid: true,
          },
        },
        pool: {
          select: {
            id: true,
          },
        },
      },
    })
    const userOasisPromises = allOasis.map((oasis) => fetchAndProcessUserOasis(oasis, input.address))
    const userOasis = await Promise.all(userOasisPromises)

    return userOasis.filter(
      (oasis) => oasis.user_deposit_b && oasis.user_deposit_b > 0 && oasis.user_liquidity && oasis.user_liquidity > 0
    )
  }),
  allReserves: procedure.query(async ({ ctx }) => {
    const allOasis = await ctx.prisma.oasis.findMany({
      include: {
        token: {
          select: {
            symbol: true,
            uuid: true,
          },
        },
        pool: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!allOasis) {
      throw new Error(`Failed to fetch oasis, received ${allOasis}`)
    }

    const reservesPromises = allOasis.map((oasis) => fetchAndProcessReserves(oasis))
    const reserves = await Promise.all(reservesPromises)

    return reserves
  }),

  getFrontQuoteLiquidityIn: procedure
    .input(
      z.object({
        id: z.string(),
        amount_in: z.number(),
        timelock: z.number(),
        now: z.number(),
        address: z.string(),
      })
    )
    .output(
      z.object({
        bonus: z.number(),
        htr_amount: z.number(),
        withdrawal_time: z.date(),
        has_position: z.boolean(),
      })
    )
    .query(async ({ input }) => {
      const endpoint = 'nano_contract/state'
      const amount = input.amount_in * 100 // correcting input to the backend
      const call = `front_quote_add_liquidity_in(${amount},${input.timelock},${Math.floor(input.now / 1000)},"a'${
        input.address
      }'")`
      const queryParams = [`id=${input.id}`, `calls[]=${call}`]
      const response = await fetchNodeData(endpoint, queryParams)
      const result = response['calls'][`${call}`]['value']
      const parsed_result = {
        bonus: result['bonus'] / 100,
        htr_amount: result['htr_amount'] / 100,
        withdrawal_time: new Date(result['withdrawal_time'] * 1000),
        has_position: Boolean(result['has_position']),
      }
      return parsed_result
    }),
})
