import type { NextApiRequest, NextApiResponse } from 'next'
import { getPairs } from '../../../utils/api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=59')
  const pairs = await getPairs()
  if (!pairs) {
    throw new Error(`Failed to fetch pairs, received ${pairs}`)
  }
  res.status(200).send(pairs)
}
