/**
 * Server-only exports
 * Import from '@dozer/api/src/server' in API routes only
 *
 * Response meta function for setting Cache-Control headers based on router and procedure
 * Use this in createNextApiHandler({ responseMeta })
 */
export function responseMeta(opts: any) {
  const { paths, errors } = opts

  // Don't cache errors
  if (errors.length > 0) {
    return {}
  }

  // Extract router and procedure name
  const path = paths?.[0] || ''
  const [router, procedure] = path.split('.')

  // Check if this is a historical query (has timestamp parameter)
  const isHistoricalQuery = opts.data?.some((item: any) => {
    return item?.result?.data?.json?.timestamp !== undefined
  })

  // Historical data is immutable - cache for 1 year
  if (isHistoricalQuery) {
    return {
      headers: {
        'Cache-Control': 'public, s-maxage=31536000, stale-while-revalidate=31536000, immutable',
      },
    }
  }

  // Router-specific cache strategies
  switch (router) {
    // HIGH FREQUENCY - Current blockchain data
    case 'getPrices':
      if (['all', 'allUSD', 'allHTR', 'htr', 'htrUSD'].includes(procedure || '')) {
        // Critical data: 30s cache, 60s SWR
        return {
          headers: {
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          },
        }
      }
      if (['chartData', 'priceChange', 'all24h'].includes(procedure || '')) {
        // Chart data: 2min cache, 4min SWR
        return {
          headers: {
            'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=240',
          },
        }
      }
      break

    case 'getPools':
      if (['all', 'allWithUnsigned'].includes(procedure || '')) {
        // Pool list: 30s cache, 60s SWR
        return {
          headers: {
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          },
        }
      }
      if (['byId', 'bySymbolId', 'userPositions'].includes(procedure || '')) {
        // Individual pools: 30s cache, 60s SWR
        return {
          headers: {
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          },
        }
      }
      if (['quote', 'quoteExactOutput'].includes(procedure || '')) {
        // Swap quotes: 15s cache, 30s SWR (more dynamic)
        return {
          headers: {
            'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
          },
        }
      }
      if (['getAllTransactionHistory', 'getTxStatus'].includes(procedure || '')) {
        // Transaction data: No cache (user-specific and time-sensitive)
        return {
          headers: {
            'Cache-Control': 'private, no-cache',
          },
        }
      }
      break

    // MEDIUM FREQUENCY - Token data
    case 'getTokens':
      if (['all', 'allWithUnsigned'].includes(procedure || '')) {
        // Token list: 5min cache (rarely changes)
        return {
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          },
        }
      }
      if (['bySymbol', 'byUuid', 'bySymbolDetailed'].includes(procedure || '')) {
        // Individual tokens: 1min cache
        return {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          },
        }
      }
      if (['prices', 'pricesHTR', 'poolsForToken'].includes(procedure || '')) {
        // Token prices/pools: 30s cache
        return {
          headers: {
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          },
        }
      }
      break

    // USER-SPECIFIC DATA - Private cache only
    case 'getProfile':
      return {
        headers: {
          'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
        },
      }

    // MEDIUM FREQUENCY - Oasis liquidity
    case 'getOasis':
      return {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }

    // LOW FREQUENCY - Static metadata
    case 'getDozerTools':
      return {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }

    // NETWORK STATUS - Short cache
    case 'getNetwork':
      return {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=20',
        },
      }

    // DEFAULT - Moderate caching
    default:
      return {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
  }

  // Fallback to default
  return {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    },
  }
}
