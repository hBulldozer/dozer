import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@dozer/database'

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  // const pools = await prisma.pool.findMany()
  // pools.forEach(async (pool) => {
  //   const snap = await prisma.hourSnapshot.create({
  //     data: {
  //       poolId: pool.id,
  //       apr: pool.apr,
  //       date: new Date(),
  //       liquidityUSD: pool.liquidityUSD,
  //       volumeUSD: pool.volumeUSD,
  //     },
  //   })
  // })
  if (request.query.key && request.query.key === process.env.API_KEY) return response.end(`Hello !`)
  else return response.end(`Not Hello !`)
}
