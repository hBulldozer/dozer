import type { NextApiRequest, NextApiResponse } from 'next'
import { getPools } from '../../../utils/functions'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=59')
  const pools = await getPools()
  if (!pools) {
    throw new Error(`Failed to fetch pools, received ${pools}`)
  }
  res.status(200).send({ pools })
}
