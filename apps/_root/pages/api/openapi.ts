import { NextApiRequest, NextApiResponse } from 'next'
import { doc } from '../api-doc'

/**
 * API endpoint that serves the OpenAPI specification in JSON format
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers to allow access from anywhere
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  // Return the OpenAPI document as JSON
  res.status(200).json(doc)
}
