import { NextApiRequest, NextApiResponse } from 'next'
import { client } from 'utils/api'
export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  const payload = request.body
  const betCreated = await client.getRewards.checkBetCreatedBy.query({
    address: payload.accounts['zealy-connect'].replace(/['"]+/g, ''),
  })
  if (request.headers['x-api-key'] && request.headers['x-api-key'] === process.env.API_KEY) {
    if (betCreated) {
      return response.status(200).json({ message: 'Claimed!' })
    } else {
      return response.status(400).json({
        message: "Not Claimed! You didn't complete the task of create a custom bet.",
      })
    }
  } else return response.status(400).json({ message: 'Not Authorized !' })
}
