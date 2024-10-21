import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@dozer/database'
import { client } from 'utils/api'
export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  const payload = request.body
  const tokenCreatedUuid = await client.getTokens.checkCreatedBy.query({
    address: payload.accounts['zealy-connect'].replace(/['"]+/g, ''),
  })
  if (!tokenCreatedUuid) {
    return response.status(400).json({ message: 'User created token not found !' })
  }
  const tokenCreated = await prisma.token.findFirst({
    where: {
      uuid: tokenCreatedUuid,
    },
  })
  const pool_ncid = await prisma.pool.findFirst({
    where: {
      token1Id: tokenCreated?.id,
    },
  })
  if (!pool_ncid) {
    return response.status(400).json({ message: 'Pool not found !' })
  }

  const { latest_timestamp } = await client.getNetwork.getBestBlock.query()
  const success = await client.getRewards.checkClaim.query({
    contractId: pool_ncid.id,
    address: payload.accounts['zealy-connect'].replace(/['"]+/g, ''),
    methods: ['add_liquidity'],
    minimum_amount: 10000,
    latest_timestamp: latest_timestamp,
  })
  // const success = false
  if (request.headers['x-api-key'] && request.headers['x-api-key'] === process.env.API_KEY) {
    if (success) {
      return response.status(200).json({ message: 'Claimed!' })
    } else {
      return response.status(400).json({
        message:
          "Not Claimed! You didn't complete the task within 24 hours or you didn't added the minimum amount of tokens.",
      })
    }
  } else return response.status(400).json({ message: 'Not Authorized !' })
}
