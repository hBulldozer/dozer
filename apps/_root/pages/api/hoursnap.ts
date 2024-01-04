import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@dozer/database'

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  if (request.query.key && request.query.key === process.env.API_KEY) {
    const pools = await prisma.pool.findMany()
    const pools_array: {
      poolId: string
      apr: number
      date: Date
      liquidityUSD: number
      volumeUSD: number
      dozerpoolId: string
    }[] = []
    pools.forEach((pool) => {
      pools_array.push({
        poolId: pool.id,
        dozerpoolId: pool.id,
        apr: pool.apr + Math.random(),
        date: new Date(),
        liquidityUSD: pool.liquidityUSD + Math.random() * 10,
        volumeUSD: pool.volumeUSD + Math.random() * 100,
      })
    })
    const snaps = await prisma.hourSnapshot.createMany({
      data: pools_array,
    })
    return response.status(200).end('Updated!')
  } else return response.status(401).end(`Not Authorized !`)
}
