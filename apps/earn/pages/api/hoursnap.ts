import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@dozer/database'

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  // if (request.query.key && request.query.key === process.env.API_KEY) {
  // const pools = await prisma.pool.findMany()
  // let snaps = []
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
  //   snaps.push(snap)
  // })
  const snap = await prisma.hourSnapshot.create({
    data: {
      poolId: '0',
      apr: 10,
      date: new Date(),
      liquidityUSD: 100,
      volumeUSD: 1000,
    },
  })
  return response.status(200).end('snap ' + snap.id + ' criado')
  // } else return response.status(401).end(`Not Authorized !`)
}
