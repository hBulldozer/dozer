import { NextApiRequest, NextApiResponse } from 'next'
import { client } from 'utils/api'
export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  const payload = request.body
  const faucetAvailable = await client.getFaucet.checkFaucet.query({
    address: payload.accounts['zealy-connect'].replace(/['"]+/g, ''),
  })
  // const success = false
  if (request.headers['x-api-key'] && request.headers['x-api-key'] === process.env.API_KEY) {
    if (!faucetAvailable) {
      return response.status(200).json({ message: 'Claimed!' })
    } else {
      return response.status(400).json({
        message: "Not Claimed! You didn't complete the task of use the Dozer Faucet.",
      })
    }
  } else return response.status(400).json({ message: 'Not Authorized !' })
}
