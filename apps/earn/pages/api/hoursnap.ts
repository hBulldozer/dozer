import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@dozer/database'

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  // if (request.query.key && request.query.key === process.env.API_KEY) {
  // const pools = await prisma.pool.findMany()
  const pool = await prisma.pool.findFirst()
  // pools.forEach(async (pool) => {
  const snap = await prisma.hourSnapshot.create({
    data: {
      poolId: pool ? pool.id : '0',
      apr: pool ? pool.apr : 0,
      date: new Date(),
      liquidityUSD: pool ? pool.liquidityUSD : 10,
      volumeUSD: pool ? pool.volumeUSD : 100,
    },
  })
  // })
  // const snap = await prisma.hourSnapshot.create({
  //   data: {
  //     poolId: '0',
  //     apr: 10,
  //     date: new Date(),
  //     liquidityUSD: 100,
  //     volumeUSD: 1000,
  //   },
  // })
  return response.status(200).end('snap ' + snap.id + ' criado')
  // } else return response.status(401).end(`Not Authorized !`)
}
