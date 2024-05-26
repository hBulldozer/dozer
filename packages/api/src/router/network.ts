import { z } from 'zod'

import { fetchNodeData } from '../helpers/fetchFunction'
import { createTRPCRouter, procedure } from '../trpc'

export const networkRouter = createTRPCRouter({
  getBestBlock: procedure.query(async () => {
    console.log('getBestBlock')
    const response = await fetchNodeData('status', [])
    const bestBlock = z.string().parse(response.dag.best_block.hash)
    return bestBlock
  }),
})
