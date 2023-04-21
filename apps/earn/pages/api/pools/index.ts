import prisma from '@dozer/database'
import type { NextApiRequest, NextApiResponse } from 'next'
import { Pair, pairFromPoolAndTokensList } from '../../../utils/Pair'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=59')
  const pre_pools = await prisma.pool.findMany({
    include: {
      token0: true,
      token1: true,
    },
  })
  const pools: Pair[] = []
  pre_pools.forEach((pool) => {
    pools?.push(pairFromPoolAndTokensList(pool))
  })
  res.status(200).send(pools)
}
