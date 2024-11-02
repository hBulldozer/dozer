import { hathorLib } from '@dozer/nanocontracts'
import { NextApiRequest, NextApiResponse } from 'next'
import { client } from 'utils/api'
export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  const payload = request.body
  const checkZealyUserAddress = await client.getRewards.checkZealyUserAddress.query({
    zealyId: payload.userId.replace(/['"]+/g, ''),
    subdomain: 'rewardstest',
  })
  // const success = false
  if (request.headers['x-api-key'] && request.headers['x-api-key'] === process.env.API_KEY) {
    if (checkZealyUserAddress) {
      const network = hathorLib.config.getNetwork()
      console.log(network)
      console.log(checkZealyUserAddress)
      const addressObj = new hathorLib.Address(checkZealyUserAddress, { network })
      if (addressObj.isValid()) {
        return response.status(200).json({ message: 'Claimed!' })
      } else {
        return response.status(400).json({
          message:
            'Not Claimed! Your address is not valid.\nIf you are certain that your address is valid, Zealy delays address insertion/update. Please wait about 30 minutes and try again.',
        })
      }
    } else {
      return response.status(400).json({
        message:
          "Not Claimed! You didn't insert your address in the zealy platform.\nIf you already inserted your address, Zealy delays address insertion/update. Please wait about 30 minutes and try again.",
      })
    }
  } else return response.status(400).json({ message: 'Not Authorized !' })
}
