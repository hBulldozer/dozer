import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@dozer/database'
import { client } from 'utils/api'
export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  const payload = request.body

  const success = await client.getRewards.checkAnotherCustomToken.query({
    address: payload.accounts['zealy-connect'].replace(/['"]+/g, ''),
  })

  if (request.headers['x-api-key'] && request.headers['x-api-key'] === process.env.API_KEY) {
    if (success) {
      return response.status(200).json({ message: 'Claimed!' })
    } else {
      return response.status(400).json({
        message: "Not Claimed! You didn't complete the task or you didn't added the minimum amount of tokens.",
      })
    }
  } else return response.status(400).json({ message: 'Not Authorized !' })
}
