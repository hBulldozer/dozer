import { z } from 'zod'

import { createTRPCRouter, procedure } from '../trpc'

export const priceRouter = createTRPCRouter({
  all: procedure.input(z.object({ tokens: z.any().array() })).query(async ({ ctx, input }) => {
    const resp = await fetch('https://api.kucoin.com/api/v1/prices?currencies=HTR')
    const data = await resp.json()
    const priceHTR = data.data.HTR
    const prices: { [key: string]: number } = {}
    const tokens = input.tokens

    tokens.forEach((token) => {
      if (token.uuid == '00') prices[token.uuid] = Number(priceHTR)
      else if (token.pools0.length > 0) {
        const poolHTR = token.pools0.find((pool: { token1: { uuid: string } }) => {
          return pool.token1.uuid == '00'
        })
        if (!prices[token.uuid]) prices[token.uuid] = (Number(poolHTR?.reserve1) / Number(poolHTR?.reserve0)) * priceHTR
      } else if (token.pools1.length > 0) {
        const poolHTR = token.pools1.find((pool: { token0: { uuid: string } }) => {
          return pool.token0.uuid == '00'
        })
        if (!prices[token.uuid]) prices[token.uuid] = (Number(poolHTR?.reserve0) / Number(poolHTR?.reserve1)) * priceHTR
      }
    })

    if (!prices) {
      throw new Error(`Failed to fetch prices, received ${prices}`)
    }
    return prices
  }),
})
