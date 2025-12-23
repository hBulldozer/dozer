import { z } from 'zod'

import { procedure } from '../../trpc'
import { formatPrice } from '../constants'
import { parsePoolApiInfo, parseUserPositions, parseUserProfitInfo } from '../../utils/namedTupleParsers'
import {
  enrichPoolWith24hMetrics,
  fetchFromPoolManager,
  fetchTokenInfo,
  getDozerToolsImageUrl,
  getTokenSymbol,
  getTokenName,
  extractTokensFromPools,
} from './helpers'

export const queryProcedures = {
  // Get all signed pools
  all: procedure.query(async () => {
    try {
      const batchResponse = await fetchFromPoolManager(['get_signed_pools()', 'get_all_token_prices_in_usd()'])

      const poolKeys: string[] = batchResponse.calls['get_signed_pools()'].value || []
      const rawTokenPrices: Record<string, number> = batchResponse.calls['get_all_token_prices_in_usd()'].value || {}
      // Convert token prices from contract units to USD (divide by PRICE_PRECISION)
      const tokenPrices: Record<string, number> = Object.fromEntries(
        Object.entries(rawTokenPrices).map(([k, v]) => [k, formatPrice(v as number)])
      )

      if (poolKeys.length === 0) {
        console.log('⚠️  [GET_POOLS_ALL] No signed pools found')
        return []
      }

      // Batch fetch all pool data using front_end_api_pool
      const poolDataCalls = poolKeys.map((poolKey) => `front_end_api_pool("${poolKey}")`)
      const poolDataResponse = await fetchFromPoolManager(poolDataCalls)

      // Extract unique tokens from all pool keys for batch symbol fetching
      const allTokens = extractTokensFromPools(poolKeys)

      // Batch fetch token metadata (symbols and names) for all unique tokens
      const tokenMetadataPromises = allTokens.map((tokenUuid) => fetchTokenInfo(tokenUuid))
      const tokenMetadataResults = await Promise.all(tokenMetadataPromises)

      // Create a map of token UUID -> { symbol, name }
      const tokenMetadata = new Map<string, { symbol: string; name: string }>()
      allTokens.forEach((tokenUuid, index) => {
        tokenMetadata.set(tokenUuid, tokenMetadataResults[index] || { symbol: 'UNK', name: 'Unknown' })
      })

      // Process each pool
      const poolPromises = poolKeys.map(async (poolKey) => {
        try {
          const poolData = parsePoolApiInfo(poolDataResponse.calls[`front_end_api_pool("${poolKey}")`].value)

          // Parse pool key to get tokens and fee
          const [tokenA, tokenB, feeStr] = poolKey.split('/')
          const swapFee = parseInt(feeStr || '0') / 10 // Convert fee format to percentage (fee_numerator/fee_denominator*100 = x/1000*100 = x/10)

          // Get token metadata
          const token0Info = tokenMetadata.get(tokenA || '') || { symbol: 'UNK', name: 'Unknown' }
          const token1Info = tokenMetadata.get(tokenB || '') || { symbol: 'UNK', name: 'Unknown' }

          // Calculate reserves (convert from cents to full units)
          const reserve0 = (poolData.reserve0 || 0) / 100
          const reserve1 = (poolData.reserve1 || 0) / 100

          // Get token prices
          const token0PriceUSD = tokenPrices[tokenA || ''] || 0
          const token1PriceUSD = tokenPrices[tokenB || ''] || 0

          // Calculate USD values
          const liquidityUSD = reserve0 * token0PriceUSD + reserve1 * token1PriceUSD

          // Calculate 24h metrics (volume, fees, txCount)
          const metrics24h = await enrichPoolWith24hMetrics(poolKey)
          const volume1d = metrics24h.volume24h
          const volumeUSD = metrics24h.volume24hUSD
          const feeUSD = metrics24h.fees24hUSD

          // Keep the old fee calculation for APR (using accumulated fees)
          const fee0 = (poolData.fee0 || 0) / 100
          const fee1 = (poolData.fee1 || 0) / 100
          const accumulatedFeeUSD = fee0 * token0PriceUSD + fee1 * token1PriceUSD

          // Calculate APR (annualized based on accumulated fees)
          const apr = liquidityUSD > 0 ? ((accumulatedFeeUSD * 365) / liquidityUSD) * 100 : 0

          // Generate symbol-based identifier for URL-friendly access
          const feeBasisPoints = parseInt(feeStr || '0')
          const feeForId = feeBasisPoints / 10 // Convert from basis points to identifier format
          const symbolId = `${token0Info.symbol}-${token1Info.symbol}-${feeForId}`

          return {
            id: poolKey,
            symbolId,
            name: `${token0Info.symbol}-${token1Info.symbol}`,
            liquidityUSD,
            volume0: reserve0,
            volume1: reserve1,
            volumeUSD,
            feeUSD,
            swapFee,
            apr: apr / 100, // Convert back to decimal for consistency
            token0: {
              uuid: tokenA,
              symbol: token0Info.symbol,
              name: token0Info.name,
              decimals: 2,
              chainId: 1,
              imageUrl: await getDozerToolsImageUrl(tokenA || ''),
            },
            token1: {
              uuid: tokenB,
              symbol: token1Info.symbol,
              name: token1Info.name,
              decimals: 2,
              chainId: 1,
              imageUrl: await getDozerToolsImageUrl(tokenB || ''),
            },
            reserve0,
            reserve1,
            chainId: 1,
            liquidity: reserve0 * 2,
            volume1d,
            fee0,
            fee1,
            fees1d: feeUSD,
            txCount: poolData.transactions || 0,
            txCount1d: metrics24h.txCount1d,
            daySnapshots: [],
            hourSnapshots: [],
          }
        } catch (error) {
          console.error(`❌ [GET_POOLS_ALL] Error processing pool ${poolKey}:`, error)
          return null
        }
      })

      const pools = await Promise.all(poolPromises)

      // Filter out null values (failed pools)
      return pools.filter((pool) => pool !== null)
    } catch (error) {
      console.error('[GET_POOLS_ALL] Error fetching pools from contract:', error)
      throw new Error('Failed to fetch pools from contract')
    }
  }),

  // Get pool by symbol-based identifier (e.g., "HTR-DZR-3" for HTR/DZR pool with 0.03% fee)
  bySymbolId: procedure.input(z.object({ symbolId: z.string() })).query(async ({ input }) => {
    try {
      // Parse symbol-based identifier (e.g., "HTR-DZR-3" -> symbols: ["HTR", "DZR"], fee: 3 -> 0.03%)
      const parts = input.symbolId.split('-')

      if (parts.length < 3) {
        throw new Error('Invalid symbol ID format. Expected format: TOKEN1-TOKEN2-FEE (e.g., HTR-DZR-3)')
      }

      // Last part is the fee, everything before is the token symbols
      const feeStr = parts[parts.length - 1]
      const token0Symbol = parts.slice(0, -2).join('-') // Handle tokens with hyphens
      const token1Symbol = parts[parts.length - 2]

      // Convert fee from identifier format to basis points (e.g., 3 -> 30)
      const feeBasisPoints = parseInt(feeStr || '0') * 10

      // Get all signed pools to find matching pool
      const batchResponse = await fetchFromPoolManager(['get_signed_pools()', 'get_all_token_prices_in_usd()'])
      const poolKeys: string[] = batchResponse.calls['get_signed_pools()'].value || []
      const rawTokenPrices: Record<string, number> = batchResponse.calls['get_all_token_prices_in_usd()'].value || {}
      const tokenPrices: Record<string, number> = Object.fromEntries(
        Object.entries(rawTokenPrices).map(([k, v]) => [k, formatPrice(v as number)])
      )

      // Find the matching pool by comparing symbols and fee
      let matchingPoolKey: string | null = null
      for (const poolKey of poolKeys) {
        const [tokenA, tokenB, poolFeeStr] = poolKey.split('/')
        const poolFeeBasisPoints = parseInt(poolFeeStr || '0')

        // Get token info to check symbols
        const tokenAInfo = await fetchTokenInfo(tokenA || '')
        const tokenBInfo = await fetchTokenInfo(tokenB || '')

        // Check if symbols and fee match (allowing for either token order)
        const symbolsMatch =
          ((tokenAInfo.symbol === token0Symbol && tokenBInfo.symbol === token1Symbol) ||
            (tokenAInfo.symbol === token1Symbol && tokenBInfo.symbol === token0Symbol)) &&
          poolFeeBasisPoints === feeBasisPoints

        if (symbolsMatch) {
          matchingPoolKey = poolKey
          break
        }
      }

      if (!matchingPoolKey) {
        throw new Error(`Pool not found for symbol ID: ${input.symbolId}`)
      }

      // Fetch pool data
      const poolDataResponse = await fetchFromPoolManager([`front_end_api_pool("${matchingPoolKey}")`])
      const poolData = parsePoolApiInfo(poolDataResponse.calls[`front_end_api_pool("${matchingPoolKey}")`].value)

      // Parse pool key
      const [tokenA, tokenB, _feeStr] = matchingPoolKey.split('/')
      const swapFee = parseInt(_feeStr || '0') / 10

      // Get token metadata
      const token0Info = await fetchTokenInfo(tokenA || '')
      const token1Info = await fetchTokenInfo(tokenB || '')

      // Calculate reserves
      const reserve0 = (poolData.reserve0 || 0) / 100
      const reserve1 = (poolData.reserve1 || 0) / 100

      // Get token prices
      const token0PriceUSD = tokenPrices[tokenA || ''] || 0
      const token1PriceUSD = tokenPrices[tokenB || ''] || 0

      // Calculate USD values
      const liquidityUSD = reserve0 * token0PriceUSD + reserve1 * token1PriceUSD

      // Calculate 24h metrics (volume, fees, txCount)
      const metrics24h = await enrichPoolWith24hMetrics(matchingPoolKey)
      const volume1d = metrics24h.volume24h
      const volumeUSD = metrics24h.volume24hUSD
      const feeUSD = metrics24h.fees24hUSD

      // Keep the old fee calculation for APR (using accumulated fees)
      const fee0 = (poolData.fee0 || 0) / 100
      const fee1 = (poolData.fee1 || 0) / 100
      const accumulatedFeeUSD = fee0 * token0PriceUSD + fee1 * token1PriceUSD

      // Calculate APR (annualized based on accumulated fees)
      const apr = liquidityUSD > 0 ? ((accumulatedFeeUSD * 365) / liquidityUSD) * 100 : 0

      return {
        id: matchingPoolKey,
        symbolId: input.symbolId,
        name: `${token0Info.symbol}-${token1Info.symbol}`,
        liquidityUSD,
        volume0: reserve0,
        volume1: reserve1,
        volumeUSD,
        feeUSD,
        swapFee,
        apr: apr / 100, // Convert back to decimal for consistency
        token0: {
          uuid: tokenA,
          symbol: token0Info.symbol,
          name: token0Info.name,
          decimals: 2,
          chainId: 1,
          imageUrl: await getDozerToolsImageUrl(tokenA || ''),
        },
        token1: {
          uuid: tokenB,
          symbol: token1Info.symbol,
          name: token1Info.name,
          decimals: 2,
          chainId: 1,
          imageUrl: await getDozerToolsImageUrl(tokenB || ''),
        },
        reserve0,
        reserve1,
        chainId: 1,
        liquidity: liquidityUSD,
        volume1d,
        fee0,
        fee1,
        fees1d: feeUSD,
        txCount: poolData.transactions || 0,
        txCount1d: metrics24h.txCount1d,
        daySnapshots: [],
        hourSnapshots: [],
      }
    } catch (error) {
      console.error(`Error fetching pool with symbol ID ${input.symbolId}:`, error)
      throw new Error(`Failed to fetch pool data: ${error}`)
    }
  }),

  // Get user positions with detailed profit information
  getUserPositionsDetailed: procedure.input(z.object({ address: z.string() })).query(async ({ input }) => {
    try {
      const response = await fetchFromPoolManager([`get_user_positions("${input.address}")`])
      const positionsArrays = response.calls[`get_user_positions("${input.address}")`].value

      if (!positionsArrays) {
        return []
      }

      // Parse the user positions object (contains NamedTuple arrays for each pool)
      const positions = parseUserPositions(positionsArrays)

      const positionPromises = []
      for (const [poolKey, position] of Object.entries(positions)) {
        if (typeof position === 'object' && position !== null) {
          const [tokenA, tokenB] = poolKey.split('/')
          positionPromises.push(
            (async () => {
              // Also get profit info for this position
              let profitInfo = null
              try {
                const profitResponse = await fetchFromPoolManager([
                  `get_user_profit_info("${input.address}", "${poolKey}")`,
                ])
                const profitArray = profitResponse.calls[`get_user_profit_info("${input.address}", "${poolKey}")`].value
                if (profitArray) {
                  const parsedProfit = parseUserProfitInfo(profitArray)
                  profitInfo = {
                    current_value_usd: parsedProfit.current_value_usd / 100,
                    initial_value_usd: parsedProfit.initial_value_usd / 100,
                    profit_amount_usd: parsedProfit.profit_amount_usd / 100,
                    profit_percentage: parsedProfit.profit_percentage / 100,
                    last_action_timestamp: parsedProfit.last_action_timestamp,
                  }
                }
              } catch (error) {
                console.warn(`Could not fetch profit info for pool ${poolKey}:`, error)
              }

              return {
                poolKey,
                poolName: `${await getTokenSymbol(tokenA || '')}-${await getTokenSymbol(tokenB || '')}`,
                liquidity: position.liquidity || 0,
                token0Amount: (position.token0Amount || 0) / 100,
                token1Amount: (position.token1Amount || 0) / 100,
                share: (position.share || 0) / 100, // Convert from percentage
                token0: {
                  uuid: tokenA,
                  symbol: await getTokenSymbol(tokenA || ''),
                  name: await getTokenName(tokenA || ''),
                },
                token1: {
                  uuid: tokenB,
                  symbol: await getTokenSymbol(tokenB || ''),
                  name: await getTokenName(tokenB || ''),
                },
                profit: profitInfo,
              }
            })()
          )
        }
      }

      const positionData = await Promise.all(positionPromises)

      return positionData
    } catch (error) {
      console.error(`Error fetching detailed user positions for ${input.address}:`, error)
      throw new Error('Failed to fetch detailed user positions')
    }
  }),
}
