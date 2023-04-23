import prisma from '@dozer/database'
import type { NextApiRequest, NextApiResponse } from 'next'
import { Pair, pairFromPoolAndTokens } from '../../../utils/Pair'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=59')
  if (!req.query?.id) res.status(422)
  const id = req.query?.id as string
  const pool = await prisma.pool.findUnique({
    where: { id: id },
    include: {
      token0: {
        include: {
          pools0: { include: { token0: true, token1: true } },
          pools1: { include: { token0: true, token1: true } },
        },
      },
      token1: {
        include: {
          pools0: { include: { token0: true, token1: true } },
          pools1: { include: { token0: true, token1: true } },
        },
      },
      // hourSnapshots: { orderBy: { date: 'desc' } },
      // daySnapshots: { orderBy: { date: 'desc' } },
    },
  })
  if (!pool) {
    throw new Error(`Failed to fetch pool, received ${pool}`)
  }
  const tokens = [pool.token0, pool.token1]
  const resp = await fetch('https://api.kucoin.com/api/v1/prices?currencies=HTR')
  const data = await resp.json()
  const priceHTR = data.data.HTR
  const prices: { [key: string]: number | undefined } = {}

  tokens.forEach((token) => {
    if (token.uuid == '00') prices[token.uuid] = Number(priceHTR)
    else if (token.pools0.length > 0) {
      const poolHTR = token.pools0.find((pool) => {
        return pool.token1.uuid == '00'
      })
      if (!prices[token.uuid]) prices[token.uuid] = (Number(poolHTR?.reserve1) / Number(poolHTR?.reserve0)) * priceHTR
    } else if (token.pools1.length > 0) {
      const poolHTR = token.pools1.find((pool) => {
        return pool.token0.uuid == '00'
      })
      if (!prices[token.uuid]) prices[token.uuid] = (Number(poolHTR?.reserve0) / Number(poolHTR?.reserve1)) * priceHTR
    }
  })

  if (!prices) {
    throw new Error(`Failed to fetch prices, received ${prices}`)
  }
  res.status(200).send({ pool, prices })
}
