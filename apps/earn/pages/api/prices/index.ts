import prisma from '@dozer/database'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=59')
  const tokens = await prisma.token.findMany({
    select: {
      id: true,
      name: true,
      uuid: true,
      symbol: true,
      chainId: true,
      decimals: true,
      pools0: {
        select: {
          id: true,
          reserve0: true,
          reserve1: true,
          token1: {
            select: {
              uuid: true,
            },
          },
        },
      },
      pools1: {
        select: {
          id: true,
          reserve0: true,
          reserve1: true,
          token0: {
            select: {
              uuid: true,
            },
          },
        },
      },
      poolsLP: {
        select: {
          id: true,
          reserve0: true,
          reserve1: true,
          tokenLP: {
            select: {
              uuid: true,
            },
          },
        },
      },
    },
  })
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
  res.status(200).send({ tokens, prices })
}
