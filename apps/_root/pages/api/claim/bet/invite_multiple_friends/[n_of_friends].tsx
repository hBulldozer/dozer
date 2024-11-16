import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@dozer/database'
import { client } from 'utils/api'
export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  const payload = request.body
  const nFriends = request.query.n_of_friends as string
  const betCreatedId = await client.getRewards.checkBetCreatedBy.query({
    address: payload.accounts['zealy-connect'].replace(/['"]+/g, ''),
  })
  if (!betCreatedId) {
    return response.status(400).json({ message: 'User created bet not found !' })
  }

  const success = await client.getRewards.checkClaimFriends.query({
    contractId: betCreatedId,
    address: payload.accounts['zealy-connect'].replace(/['"]+/g, ''),
    methods: ['bet'],
    n_of_friends: parseInt(nFriends),
  })

  if (request.headers['x-api-key'] && request.headers['x-api-key'] === process.env.API_KEY) {
    if (success) {
      return response.status(200).json({ message: 'Claimed!' })
    } else {
      return response.status(400).json({
        message: "Not Claimed! You didn't complete the task.",
      })
    }
  } else return response.status(400).json({ message: 'Not Authorized !' })
}
