import { z } from 'zod'

import { createTRPCRouter, procedure } from '../trpc'
import { HTRPoolByTokenUuid, HTRPoolByTokenUuidFromContract, idFromHTRPoolByTokenUuid } from './pool'

export const htrKline = async (input: { period: number; size: number }) => {
  const now = Math.round(Date.now() / 1000)
  const period = input.period == 0 ? '5min' : input.period == 1 ? '1hour' : '1day'
  const size = (input.size + 1) * (input.period == 0 ? 15 : input.period == 1 ? 60 : 24 * 60) * 60 // in seconds
  const resp = await fetch(
    `https://api.kucoin.com/api/v1/market/candles\?type\=${period}\&symbol\=HTR-USDT\&startAt\=${
      now - size
    }\&endAt\=${now}`
  )
  const data = await resp.json()
  return data.data.map((item: any) => {
    return Number(item[2])
  })
}

export const pricesRouter = createTRPCRouter({
  allChanges: procedure.query(async ({ ctx }) => {
    const tokens = await ctx.prisma.token.findMany({
      select: {
        uuid: true,
        chainId: true,
      },
    })
    if (!tokens) {
      throw new Error(`Failed to fetch tokens, received ${tokens}`)
    }
    const pricesHTR = await htrKline({ period: 2, size: 1 })
    const priceHTR_now = pricesHTR[0]
    const priceHTR_24h = pricesHTR[1]

    const changes: { [key: string]: number } = {}

    await Promise.all(
      tokens.map(async (token) => {
        if (token.uuid == '00') changes[token.uuid] = (priceHTR_now - priceHTR_24h) / priceHTR_now
        else {
          const poolHTR_nc = await HTRPoolByTokenUuidFromContract(token.uuid, token.chainId, ctx.prisma)
          const poolHTR_db = await HTRPoolByTokenUuid(token.uuid, token.chainId, ctx.prisma)
          if (!changes[token.uuid]) {
            const price_nc = poolHTR_nc
              ? (Number(poolHTR_nc?.reserve0) / Number(poolHTR_nc?.reserve1)) * priceHTR_now
              : 0
            const price_db = poolHTR_db
              ? (Number(poolHTR_db?.reserve0) / Number(poolHTR_db?.reserve1)) * priceHTR_24h
              : 0
            changes[token.uuid] = (price_nc - price_db) / price_nc
          }
        }
      })
    )

    if (!changes) {
      throw new Error(`Failed to fetch changes, received ${changes}`)
    }
    return changes
  }),
  all: procedure.query(async ({ ctx }) => {
    const tokens = await ctx.prisma.token.findMany({
      select: {
        uuid: true,
        chainId: true,
      },
    })
    if (!tokens) {
      throw new Error(`Failed to fetch tokens, received ${tokens}`)
    }
    const resp = await fetch('https://api.kucoin.com/api/v1/prices?currencies=HTR')
    const data = await resp.json()
    const priceHTR = data.data.HTR
    const prices: { [key: string]: number } = {}

    await Promise.all(
      tokens.map(async (token) => {
        if (token.uuid == '00') prices[token.uuid] = Number(priceHTR)
        else {
          const poolHTR = await HTRPoolByTokenUuidFromContract(token.uuid, token.chainId, ctx.prisma)
          if (!prices[token.uuid]) {
            // console.log(token.uuid, poolHTR ? (Number(poolHTR?.reserve0) / Number(poolHTR?.reserve1)) * priceHTR : 0)
            prices[token.uuid] = poolHTR ? (Number(poolHTR?.reserve0) / Number(poolHTR?.reserve1)) * priceHTR : 0
          }
        }
      })
    )

    if (!prices) {
      throw new Error(`Failed to fetch prices, received ${prices}`)
    }
    return prices
  }),
  byTokens: procedure.input(z.object({ tokens: z.any() })).query(async ({ ctx, input }) => {
    const resp = await fetch('https://api.kucoin.com/api/v1/prices?currencies=HTR')
    const data = await resp.json()
    const priceHTR = data.data.HTR
    const prices: { [key: string]: number } = {}
    const tokens = input.tokens

    tokens.forEach(async (token: any) => {
      const poolHTR = await HTRPoolByTokenUuidFromContract(token.uuid, token.chainId, ctx.prisma)
      if (!prices[token.uuid])
        prices[token.uuid] = poolHTR ? (Number(poolHTR?.reserve0) / Number(poolHTR?.reserve1)) * priceHTR : 0
    })

    if (!prices) {
      throw new Error(`Failed to fetch prices, received ${prices}`)
    }
    return prices
  }),
  fromPair: procedure.input(z.object({ pairMerged: z.any() })).query(async ({ input }) => {
    const row = input.pairMerged
    const tokenReserve: { reserve0: number; reserve1: number } = {
      reserve0: row.reserve0,
      reserve1: row.reserve1,
    }
    return row.id.includes('native') ? 1 : Number(tokenReserve.reserve0) / Number(tokenReserve.reserve1)
  }),
  htr: procedure.output(z.number()).query(async () => {
    const resp = await fetch('https://api.kucoin.com/api/v1/prices?currencies=HTR')
    const data = await resp.json()
    return Number(data.data.HTR)
  }),
  htrKline: procedure
    .output(z.array(z.number()))
    .input(z.object({ size: z.number(), period: z.number() }))
    .query(async ({ input }) => {
      const result = await htrKline(input)
      return result
    }),
})
