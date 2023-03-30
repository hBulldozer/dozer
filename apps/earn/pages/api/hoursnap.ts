import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@dozer/database'

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  // if (request.query.key && request.query.key === process.env.API_KEY) {
  const pools = await prisma.pool.findMany()
  const pools_array: { poolId: string; apr: number; date: Date; liquidityUSD: number; volumeUSD: number }[] = []
  pools.forEach((pool) => {
    pools_array.push({
      poolId: pool.id,
      apr: pool.apr,
      date: new Date(),
      liquidityUSD: pool.liquidityUSD,
      volumeUSD: pool.volumeUSD,
    })
  })
  const snaps = await prisma.hourSnapshot.createMany({
    data: pools_array,
  })
  return response.status(200).end('criado')
  // } else return response.status(401).end(`Not Authorized !`)
}
