import prisma from '@dozer/database'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=59')
  const pools = await prisma.pool.findMany({
    include: {
      token0: true,
      token1: true,
    },
  })
  res.status(200).send({ pools })
}
