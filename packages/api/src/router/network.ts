import { z } from 'zod'

import { fetchNodeData } from '../helpers/fetchFunction'
import { createTRPCRouter, procedure } from '../trpc'

export const networkRouter = createTRPCRouter({
  getBestBlock: procedure.query(async () => {
    const response = await fetchNodeData('status', [])
    const hash = z.string().parse(response.dag.best_block.hash)
    const number = z.number().parse(response.dag.best_block.height)
    return { hash: hash, number: number }
  }),
})
