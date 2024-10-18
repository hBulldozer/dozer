import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@dozer/database'
import { client } from 'utils/api'
export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  const payload = request.body
  const pool_ncid = await prisma.pool.findFirst({
    where: {
      name: 'HTR-USDT',
    },
  })
  if (!pool_ncid) {
    return response.status(400).json({ message: 'Pool not found !' })
  }
  console.log(payload.accounts)
  const success = await client.getRewards.checkClaim.query({
    contractId: pool_ncid.id,
    address: payload.accounts['zealy-connect'].replace(/['"]+/g, ''),
    methods: ['swap_exact_tokens_for_tokens', 'swap_tokens_for_exact_tokens'],
  })
  // const success = false
  if (request.headers['x-api-key'] && request.headers['x-api-key'] === process.env.API_KEY) {
    if (success) {
      return response.status(200).json({ message: 'Claimed !' })
    } else {
      return response.status(400).json({ message: 'Not Claimed !' })
    }
  } else return response.status(400).json({ message: 'Not Authorized !' })
}
