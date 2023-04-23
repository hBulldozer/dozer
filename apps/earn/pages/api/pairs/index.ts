import prisma from '@dozer/database'
import type { NextApiRequest, NextApiResponse } from 'next'
import { Pair, pairFromPoolAndTokensList } from '../../../utils/Pair'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=59')
  const pre_pairs = await prisma.pool.findMany({
    include: {
      token0: true,
      token1: true,
    },
  })
  const pairs: Pair[] = []
  pre_pairs.forEach((pair) => {
    pairs?.push(pairFromPoolAndTokensList(pair))
  })
  res.status(200).send(pairs)
}
