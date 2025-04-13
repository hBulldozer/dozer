import { createTRPCRouter, procedure } from '../trpc'

/**
 * Router to provide configuration for the price service
 */
export const priceServiceRouter = createTRPCRouter({
  /**
   * Endpoint to provide configuration for the price service
   * This endpoint is used by the price service to auto-discover
   * tokens and pools from the Dozer app.
   */
  config: procedure.query(async ({ ctx }) => {
    try {
      // Get all tokens
      const tokens = await ctx.prisma.token.findMany({
        select: {
          uuid: true,
          symbol: true,
          name: true,
          decimals: true,
        },
      })

      // Get all pools
      const pools = await ctx.prisma.pool.findMany({
        select: {
          id: true,
          token0Id: true,
          token1Id: true,
          token0: {
            select: {
              uuid: true,
            },
          },
          token1: {
            select: {
              uuid: true,
            },
          },
          reserve0: true,
          reserve1: true,
        },
      })

      // Find the HTR-hUSDC pool
      const htrUsdcPool = pools.find((pool) => {
        const token0IsHtr = pool.token0?.uuid === '00'
        const token1IsHusd =
          pool.token1?.uuid && tokens.find((t) => t.uuid === pool.token1?.uuid && t.symbol === 'hUSDC')
        return token0IsHtr && token1IsHusd
      })

      if (!htrUsdcPool) {
        throw new Error('HTR-hUSDC pool not found')
      }

      // Build token to pool mapping
      const tokenPools: Record<string, string[]> = {}

      // First for HTR and hUSDC
      tokenPools['00'] = [htrUsdcPool.id] // HTR
      tokenPools[htrUsdcPool.token1.uuid] = [htrUsdcPool.id] // hUSDC

      // Then for all other tokens with HTR pools
      pools.forEach((pool) => {
        // Skip HTR-hUSDC pool as it's already added
        if (pool.id === htrUsdcPool.id) return

        // If token0 is HTR, add this pool to token1's pools
        if (pool.token0?.uuid === '00' && pool.token1?.uuid) {
          if (!tokenPools[pool.token1.uuid]) {
            tokenPools[pool.token1.uuid] = []
          }
          tokenPools[pool.token1.uuid].push(pool.id)
        }

        // If token1 is HTR, add this pool to token0's pools
        if (pool.token1?.uuid === '00' && pool.token0?.uuid) {
          if (!tokenPools[pool.token0.uuid]) {
            tokenPools[pool.token0.uuid] = []
          }
          tokenPools[pool.token0.uuid].push(pool.id)
        }
      })

      // Create initial prices with HTR and hUSDC
      const initialPrices: Record<string, number> = {
        '00': htrUsdcPool.reserve1 / htrUsdcPool.reserve0, // HTR price in USD
      }

      // Add hUSDC
      initialPrices[htrUsdcPool.token1.uuid] = 1.0 // hUSDC price is always 1 USD

      // Add initial prices for other tokens with HTR pools
      Object.entries(tokenPools).forEach(([tokenUuid, poolIds]) => {
        // Skip HTR and hUSDC
        if (tokenUuid === '00' || tokenUuid === htrUsdcPool.token1.uuid) return

        // Get first pool for this token
        const poolId = poolIds[0]
        const pool = pools.find((p) => p.id === poolId)

        if (pool) {
          const tokenIsToken0 = pool.token0?.uuid === tokenUuid
          const htrIsToken0 = pool.token0?.uuid === '00'

          let priceInHtr: number

          if (tokenIsToken0 && !htrIsToken0) {
            // Token is token0, HTR is token1
            priceInHtr = pool.reserve1 / pool.reserve0
          } else {
            // Token is token1, HTR is token0
            priceInHtr = pool.reserve0 / pool.reserve1
          }

          // Calculate price in USD
          initialPrices[tokenUuid] = priceInHtr * initialPrices['00']
        }
      })

      // Return all configuration

      console.log('tokens', tokens)
      console.log('pools', pools)
      console.log('tokenPools', tokenPools)
      console.log('initialPrices', initialPrices)
      return {
        tokens,
        pools: pools.map((pool) => ({
          id: pool.id,
          token0: pool.token0?.uuid,
          token1: pool.token1?.uuid,
          reserve0: pool.reserve0,
          reserve1: pool.reserve1,
        })),
        tokenPools,
        htrUsdcPoolId: htrUsdcPool.id,
        initialPrices,
      }
    } catch (error) {
      console.error('Error generating price service config:', error)
      throw error
    }
  }),
})
