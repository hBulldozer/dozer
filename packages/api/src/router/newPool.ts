import { TRPCError } from '@trpc/server'
import axios from 'axios'
import { z } from 'zod'

import { createTRPCRouter, procedure } from '../trpc'

// Price service configuration
const PRICE_SERVICE_URL = process.env.PRICE_SERVICE_URL || 'http://localhost:3000'

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
          const response = await axios.get(`${PRICE_SERVICE_URL}/api/v1/pools/current/${input.poolId}`, {
            timeout: 2000,
          })

          return response.status === 200 && !!response.data
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

      const response = await axios.get(`${PRICE_SERVICE_URL}/api/v1/pools/current/${input.poolId}`, {
        timeout: 5000,
      })

      return response.data
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

        const response = await axios.get(`${PRICE_SERVICE_URL}/api/v1/chart/pool/${input.poolId}`, {
          params: {
            from: input.from,
            to: input.to,
            interval: input.interval || '1h',
            metric: input.metric || 'tvl',
          },
          timeout: 10000, // Longer timeout for historical data
        })

          // Ensure timestamps are valid
          if (!response.data || !response.data.data || !Array.isArray(response.data.data)) {
            console.error('Invalid pool chart response format:', response.data)
            throw new Error('Invalid response format from price service')
          }
          
          // Process and validate the data by aggregating by timestamp
          // Use a map to ensure unique timestamps and to handle aggregation
          const timestampMap = new Map<number, number[]>();
          
          response.data.data.forEach((point: any) => {
            const time = typeof point.time === 'number' ? point.time : Number(point.time);
            const value = typeof point.value === 'number' ? point.value : Number(point.value);
            
            // Skip invalid values unless it's volume data where 0 is valid
            if (isNaN(value) || (value === 0 && input.metric !== 'volume')) {
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
          
          // If we don't have enough data points, create synthetic ones through interpolation
          if (processedData.length > 0 && processedData.length < 10 && input.metric !== 'volume') {
            const startPoint = processedData[0];
            const endPoint = processedData[processedData.length - 1];
            const timeRange = endPoint.time - startPoint.time;
            
            // Create ~50 evenly distributed points for a smooth chart
            const desiredPoints = 50;
            const timeStep = timeRange / (desiredPoints - 1);
            
            const interpolatedData = [];
            
            for (let i = 0; i < desiredPoints; i++) {
              const currentTime = Math.floor(startPoint.time + i * timeStep);
              
              // Skip if we already have a point at this timestamp
              if (timestampMap.has(currentTime)) {
                continue;
              }
              
              // Find the closest points before and after
              let beforePoint = startPoint;
              let afterPoint = endPoint;
              
              for (const point of processedData) {
                if (point.time <= currentTime && point.time > beforePoint.time) {
                  beforePoint = point;
                }
                if (point.time >= currentTime && point.time < afterPoint.time) {
                  afterPoint = point;
                }
              }
              
              // Interpolate
              if (beforePoint.time !== afterPoint.time) {
                const ratio = (currentTime - beforePoint.time) / (afterPoint.time - beforePoint.time);
                const value = beforePoint.value + ratio * (afterPoint.value - beforePoint.value);
                interpolatedData.push({ time: currentTime, value });
              }
            }
            
            // Combine original and interpolated data
            processedData.push(...interpolatedData);
            processedData.sort((a, b) => a.time - b.time);
          }
          
          // For volume metric, if we have no data, create some dummy points
          if (processedData.length === 0 && input.metric === 'volume') {
            // Create empty data points for the requested time range
            const now = Math.floor(Date.now() / 1000)
            const step = 3600 // hourly steps
            const points = []
            
            // Create at least 24 points for a day's worth of data
            for (let i = 0; i < 24; i++) {
              points.push({
                time: now - (23 - i) * step,
                value: 0
              })
            }
            
            return {
              poolId: response.data.poolId,
              metric: response.data.metric, 
              interval: response.data.interval,
              data: points
            }
          }
          
          return {
            poolId: response.data.poolId,
            metric: response.data.metric,
            interval: response.data.interval,
            data: processedData
          }
      } catch (error) {
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
