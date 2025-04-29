import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { getPriceServiceData } from '../helpers/fetch'

import { createTRPCRouter, procedure } from '../trpc'

// Types for pool data

// Define types for pool data
interface PoolDataPoint {
  time: number
  value: number
}

interface PoolChartResponse {
  poolId: string
  metric: string
  interval: string
  data: PoolDataPoint[]
  token0?: string
  token1?: string
}

/**
 * Router to interact with pool data from the price service
 */
export const newPoolRouter = createTRPCRouter({
  // Check if a specific pool is available in the price service
  isPoolAvailable: procedure
    .input(z.object({ poolId: z.string() }))
    .output(z.boolean())
    .query(async ({ input, ctx }) => {
      try {
        // First check if the pool exists in our database
        const poolInDb = await ctx.prisma.pool.findFirst({
          where: { id: input.poolId },
          select: { id: true },
        })

        if (!poolInDb) {
          console.warn(`Pool ${input.poolId} not found in database`)
          return false
        }

        // Then check if it's available in the price service
        try {
          const data = await getPriceServiceData(`/api/v1/pools/current/${input.poolId}`, {
            timeout: 2000
          })

          return !!data
        } catch (error) {
          console.warn(`Pool ${input.poolId} not available in price service`)
          return false
        }
      } catch (error) {
        console.error(`Error checking pool availability: ${error}`)
        return false
      }
    }),

  // Get current pool data
  poolData: procedure.input(z.object({ poolId: z.string() })).query(async ({ input, ctx }) => {
    try {
      // Check if pool exists in DB first
      const pool = await ctx.prisma.pool.findFirst({
        where: { id: input.poolId },
        select: { id: true },
      })

      if (!pool) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Pool ${input.poolId} not found`,
        })
      }

      const data = await getPriceServiceData(`/api/v1/pools/current/${input.poolId}`, {
        timeout: 5000
      })

      return data
    } catch (error) {
      console.error(`Error fetching pool data: ${error}`)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch pool data from price service',
      })
    }
  }),

  // Get pool chart data
  poolChart: procedure
    .input(
      z.object({
        poolId: z.string(),
        from: z.number().optional(),
        to: z.number().optional(),
        interval: z.string().optional(),
        metric: z.enum(['tvl', 'volume', 'apr']).optional(),
      })
    )
    .output(
      z.object({
        poolId: z.string(),
        metric: z.string(),
        interval: z.string(),
        data: z.array(
          z.object({
            time: z.number(),
            value: z.number(),
          })
        ),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Check if pool exists in DB first
        const pool = await ctx.prisma.pool.findFirst({
          where: { id: input.poolId },
          select: { id: true },
        })

        if (!pool) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Pool ${input.poolId} not found`,
          })
        }

        // Apply a timeout specific to volume queries that take longer
        const requestTimeout = input.metric === 'volume' ? 20000 : 10000;
        
        const response = await getPriceServiceData(`/api/v1/chart/pool/${input.poolId}`, {
          params: {
            from: input.from,
            to: input.to,
            interval: input.interval || '1h',
            metric: input.metric || 'tvl',
          },
          timeout: requestTimeout // Longer timeout for volume data
        })

          // The response structure may vary depending on the API
          // Let's be resilient to both formats
          let chartData: any[] = [];
          
          if (response && Array.isArray(response)) {
            // Direct array response
            chartData = response;
          } else if (response && response.data && Array.isArray(response.data)) {
            // Object with data property as array
            chartData = response.data;
          } else {
            console.error('Invalid pool chart response format:', response)
            throw new Error('Invalid response format from price service')
          }
          
          // Parse and aggregate data points by timestamp to ensure valid data
          const timestampMap = new Map<number, number[]>();
          
          chartData.forEach((point: any) => {
            const time = typeof point.time === 'number' ? point.time : Number(point.time);
            const value = typeof point.value === 'number' ? point.value : Number(point.value);
            
            // Skip any NaN values
            if (isNaN(value)) {
              return;
            }
            
            // Add to timestamp map for aggregation
            if (!timestampMap.has(time)) {
              timestampMap.set(time, [value]);
            } else {
              timestampMap.get(time)!.push(value);
            }
          });
          
          // Convert map to array and calculate average for each timestamp
          const processedData = Array.from(timestampMap.entries())
            .map(([time, values]) => ({
              time,
              value: values.reduce((sum, val) => sum + val, 0) / values.length
            }))
            .sort((a, b) => a.time - b.time);
          
          return {
            poolId: input.poolId,
            metric: input.metric || 'tvl',
            interval: input.interval || '1h',
            data: processedData
          }
      } catch (error) {
        // Log the error for debugging but keep it out of the response
        console.error('Error fetching pool chart data:', error)

        if (error instanceof TRPCError) {
          throw error
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch pool chart data from price service',
        })
      }
    }),
})
