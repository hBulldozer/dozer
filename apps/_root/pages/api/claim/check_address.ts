import { hathorLib } from '@dozer/nanocontracts'
import { NextApiRequest, NextApiResponse } from 'next'
import { client } from 'utils/api'
export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  const payload = request.body
  const checkZealyUser = await client.getRewards.checkZealyUserAddress.query({
    zealyId: payload.userId.replace(/['"]+/g, ''),
    subdomain: 'hathornetwork',
  })
  // const success = false
  if (request.headers['x-api-key'] && request.headers['x-api-key'] === process.env.API_KEY) {
    if (checkZealyUser.address) {
      const network = hathorLib.config.getNetwork()
      console.log(network)
      console.log(checkZealyUser)
      const addressObj = new hathorLib.Address(checkZealyUser.address, { network })
      if (addressObj.isValid()) {
        try {
          await client.getRewards.dzdOptin.mutate({ zealyUser: checkZealyUser })
          return response.status(200).json({ message: 'You successfully opted-in to receive DZD!' })
        } catch (e) {
          console.log(e)
          return response.status(400).json({
            message: 'Error in trying to opt-in to receive DZD. Please try again later.',
          })
        }
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
