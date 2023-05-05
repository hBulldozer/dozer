import type { NextApiRequest, NextApiResponse } from 'next'
import { Pair, pairFromPoolAndTokens } from '../../../utils/Pair'
import { getPoolWithTokensAndSnaps, getPrices } from '../../../utils/functions'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=59')
  if (!req.query?.id) res.status(422)
  const id = req.query?.id as string
  const pool = await getPoolWithTokensAndSnaps(id)
  const tokens = [pool.token0, pool.token1]
  const prices = await getPrices(tokens)

  const pair: Pair = pairFromPoolAndTokens(pool)

  if (!pair) {
    throw new Error(`Failed to fetch pair, received ${pair}`)
  }

  if (!tokens) {
    throw new Error(`Failed to fetch tokens, received ${tokens}`)
  }

  if (!prices) {
    throw new Error(`Failed to fetch prices, received ${prices}`)
  }

  res.status(200).send({ pair, prices })
}
