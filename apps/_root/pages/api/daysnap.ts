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
      reserve0: number
      reserve1: number
      volume0: number
      volume1: number
      volumeUSD: number
      fee0: number
      fee1: number
      feeUSD: number
      priceHTR: number
      txCount: number
    }[] = []
    const priceHTR = await client.getPrices.htr.query()
    pools.map((pool) => {
      pools_array.push({
        poolId: pool.id,
        apr: pool.apr,
        date: new Date(),
        liquidityUSD: pool.liquidityUSD,
        reserve0: Number(pool.reserve0),
        reserve1: Number(pool.reserve1),
        volume0: Number(pool.volume0),
        volume1: Number(pool.volume1),
        volumeUSD: pool.volumeUSD,
        fee0: Number(pool.fee0),
        fee1: Number(pool.fee1),
        feeUSD: pool.feeUSD,
        priceHTR: priceHTR,
        txCount: pool.txCount || 0,
      })
    })

    const snaps = await prisma.daySnapshot.createMany({
      data: pools_array,
    })

    prisma.$disconnect()
    return response.status(200).end('Updated!')
  } else return response.status(401).end(`Not Authorized !`)
}
export const config = {
  maxDuration: 60,
}
