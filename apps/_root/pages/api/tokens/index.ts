import type { NextApiRequest, NextApiResponse } from 'next'
import { getTokens } from '../../../utils/functions'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=59')
  const tokens = await getTokens()

  if (!tokens) {
    throw new Error(`Failed to fetch tokens, received ${tokens}`)
  }

  res.status(200).send(tokens)
}
