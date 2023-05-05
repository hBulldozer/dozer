import type { NextApiRequest, NextApiResponse } from 'next'
import { getPrices, getTokens } from '../../../utils/functions'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=59')
  const tokens = await getTokens()
  const prices = await getPrices(tokens)

  if (!tokens) {
    throw new Error(`Failed to fetch tokens, received ${tokens}`)
  }

  if (!prices) {
    throw new Error(`Failed to fetch prices, received ${prices}`)
  }
  res.status(200).send({ tokens, prices })
}
