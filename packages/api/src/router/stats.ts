import { z } from 'zod'

import { fetchNodeData } from '../helpers/fetchFunction'
import { createTRPCRouter, procedure } from '../trpc'

const matomoFetch = async (period: string, date: string) => {
  const matomo_url = process.env.NEXT_PUBLIC_MATOMO_URL || 'https://matomo.self2.dozer.finance'
  const matomo_id = process.env.NEXT_PUBLIC_MATOMO_SITE_ID || '1'
  const method = 'VisitsSummary.get'
  const token = process.env.MATOMO_API_KEY || '9d68d36aad2ca42cd2a1d856abb42ecd'
  const params: Record<string, string> = {
    module: 'API',
    method: method,
    idSite: matomo_id,
    period: period,
    date: date,
    format: 'json',
  }
  const url = `${matomo_url}?${new URLSearchParams(params)}`
  console.log(url)
  const response = await fetch(url, {
    method: 'POST',
    body: `token_auth=${token}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  const data = await response.json()
  return data
}

export const statsRouter = createTRPCRouter({
  tokensQty: procedure.query(async ({ ctx }) => {
    const tokens = await ctx.prisma.token.findMany()
    return tokens.length
  }),
  userFaucetQty: procedure.query(async ({ ctx }) => {
    const users = await ctx.prisma.faucet.findMany()
    return users.length
  }),
  visitors24h: procedure.query(async ({ ctx }) => {
    const period = 'day'
    const yesterday = new Date(new Date().setDate(new Date().getDate() - 1))
    const date = yesterday.toISOString().split('T')[0] || ''
    const data = await matomoFetch(period, date)
    return data
  }),
  qtyVisitors: procedure.query(async ({ ctx }) => {
    const data = await matomoFetch('year', 'today')
    return data
  }),
  poolsStats: procedure.query(async ({ ctx }) => {
    const pools = await ctx.prisma.pool.findMany()
    const stats = pools.map((pool) => {
      return {
        volumeUSD: pool.volumeUSD,
        feeUSD: pool.feeUSD,
        liquidityUSD: pool.liquidityUSD,
      }
    })
    return stats
  }),
})
