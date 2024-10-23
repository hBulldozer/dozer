import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@dozer/database'
import { client } from 'utils/api'
export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  const payload = request.body
  const ncid = request.query.ncid as string

  if (!ncid) {
    return response.status(400).json({ message: 'Bet not found !' })
  }

  const success = await client.getRewards.checkClaim.query({
    contractId: ncid,
    address: payload.accounts['zealy-connect'].replace(/['"]+/g, ''),
    methods: ['make_bet'],
    minimum_amount: 0,
  })

  if (request.headers['x-api-key'] && request.headers['x-api-key'] === process.env.API_KEY) {
    if (success) {
      return response.status(200).json({ message: 'Claimed !' })
    } else {
      return response.status(400).json({
        message: "Not Claimed! You didn't complete the task.",
      })
    }
  } else return response.status(400).json({ message: 'Not Authorized !' })
}
