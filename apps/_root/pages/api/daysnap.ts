import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@dozer/database'
import { client } from 'utils/api'
export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  if (request.query.key && request.query.key === process.env.API_KEY) {
    const pools = await client.getPools.all.query()
    const pools_array: {
      poolId: string
      apr: number
      date: Date
      liquidityUSD: number
      volumeUSD: number
      reserve0: number
      reserve1: number
      volume0: number
      volume1: number
      priceHTR: number
    }[] = []
    const priceHTR = await client.getPrices.htr.query()
    pools.map((pool) => {
      pools_array.push({
        poolId: pool.id,
        apr: pool.apr + Math.random(),
        date: new Date(),
        liquidityUSD: pool.liquidityUSD,
        volumeUSD: pool.volumeUSD,
        reserve0: Number(pool.reserve0),
        reserve1: Number(pool.reserve1),
        volume0: Number(pool.volume0),
        volume1: Number(pool.volume1),
        priceHTR: priceHTR,
      })
    })

    const snaps = await prisma.daySnapshot.createMany({
      data: pools_array,
    })

    prisma.$disconnect()
    return response.status(200).end('Updated!')
  } else return response.status(401).end(`Not Authorized !`)
}
