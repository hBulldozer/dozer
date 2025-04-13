import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@dozer/database'

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  try {
    // Get tokens
    const tokens = await prisma.token.findMany({
      select: {
        uuid: true,
        symbol: true,
        name: true,
        decimals: true,
      },
    })

    // Get pools
    const pools = await prisma.pool.findMany({
      select: {
        id: true,
        token0: {
          select: {
            uuid: true,
            symbol: true,
          },
        },
        token1: {
          select: {
            uuid: true,
            symbol: true,
          },
        },
        reserve0: true,
        reserve1: true,
      },
    })

    // Create token to pool mapping
    const tokenToPools: Record<string, string[]> = {}
    const poolsInfo = pools.map(pool => ({
      id: pool.id,
      token0: pool.token0.uuid,
      token1: pool.token1.uuid,
      reserve0: parseFloat(pool.reserve0),
      reserve1: parseFloat(pool.reserve1),
    }))

    // Find HTR-hUSDC pool
    let htrUsdcPoolId = ''

    // Build token to pools mapping
    for (const pool of pools) {
      // Check if this is the HTR-hUSDC pool
      if (
        (pool.token0.symbol === 'HTR' && pool.token1.symbol === 'hUSDC') ||
        (pool.token1.symbol === 'HTR' && pool.token0.symbol === 'hUSDC')
      ) {
        htrUsdcPoolId = pool.id
      }

      // Add pool to token0 mapping
      if (!tokenToPools[pool.token0.uuid]) {
        tokenToPools[pool.token0.uuid] = []
      }
      tokenToPools[pool.token0.uuid].push(pool.id)

      // Add pool to token1 mapping
      if (!tokenToPools[pool.token1.uuid]) {
        tokenToPools[pool.token1.uuid] = []
      }
      tokenToPools[pool.token1.uuid].push(pool.id)
    }

    // Create initial prices (fallback)
    const initialPrices: Record<string, number> = {}
    
    // Set HTR price to 0.04 USD as fallback
    const htrToken = tokens.find(token => token.symbol === 'HTR')
    if (htrToken) {
      initialPrices[htrToken.uuid] = 0.04
    }
    
    // Set hUSDC price to 1 USD as fallback
    const husdcToken = tokens.find(token => token.symbol === 'hUSDC')
    if (husdcToken) {
      initialPrices[husdcToken.uuid] = 1.0
    }
    
    // Return the configuration
    return response.status(200).json({
      tokens,
      pools: poolsInfo,
      tokenPools: tokenToPools,
      htrUsdcPoolId,
      initialPrices,
    })
  } catch (error) {
    console.error('Error fetching price service configuration:', error)
    return response.status(500).json({
      error: 'Failed to fetch price service configuration',
      details: error instanceof Error ? error.message : String(error),
    })
  }
}
