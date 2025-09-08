import { useState, useEffect } from 'react'
import { api } from 'utils/api'
import { Token } from '@dozer/currency'
import { Layout } from '../../components/Layout'

// Convert database token to Token model
const toToken = (token: any): Token | undefined => {
  if (!token) return undefined

  return new Token({
    chainId: token.chainId,
    uuid: token.uuid,
    decimals: token.decimals,
    name: token.name,
    symbol: token.symbol,
    imageUrl: token.imageUrl || undefined,
    bridged: !!token.bridged,
    originalAddress: token.originalAddress || undefined,
    sourceChain: token.sourceChain || undefined,
    targetChain: token.targetChain || undefined,
  })
}

interface RouteResult {
  fromToken: string
  toToken: string
  amountIn: number
  amountOut: number
  route: string[]
  priceImpact: number
  error?: string
}

export default function RoutingDebugPage() {
  // Hooks must be called at the top level, before any conditional returns
  const { data: tokensData } = api.getTokens.all.useQuery()
  const utils = api.useUtils()
  const [routeResults, setRouteResults] = useState<RouteResult[]>([])
  const [loading, setLoading] = useState(false)

  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return (
      <Layout>
        <div className="container px-4 py-8 mx-auto">
          <div className="mx-auto max-w-6xl">
            <h1 className="mb-6 text-3xl font-bold text-red-400">🚫 Development Only</h1>
            <p className="text-gray-400">This debug page is only available in development mode.</p>
          </div>
        </div>
      </Layout>
    )
  }

  // Test amounts for different tokens
  const testAmounts = {
    '00': 31000, // HTR
    hBTC: 0.02, // hBTC
    hUSDC: 2000, // hUSDC
    DZR: 70000, // DZR
    default: 65000, // Default for other tokens
  }

  const getTestAmount = (tokenSymbol: string) => {
    return testAmounts[tokenSymbol as keyof typeof testAmounts] || testAmounts.default
  }

  const testAllRoutes = async () => {
    if (!tokensData) return

    setLoading(true)
    const results: RouteResult[] = []

    // Get main tokens to test
    const tokens = tokensData
      .filter((token) => !token.custom)
      .map((token) => toToken(token))
      .filter(Boolean) as Token[]

    console.log(`Testing routes for ${tokens.length} tokens`)

    // Test all combinations
    for (let i = 0; i < tokens.length; i++) {
      for (let j = 0; j < tokens.length; j++) {
        if (i === j) continue // Skip same token

        const fromToken = tokens[i]
        const toToken = tokens[j]
        const amountIn = getTestAmount(fromToken.symbol || '')

        try {
          console.log(`Testing: ${amountIn} ${fromToken.symbol} → ${toToken.symbol}`)

          const response = await utils.getPools.quote.fetch({
            amountIn,
            tokenIn: fromToken.uuid,
            tokenOut: toToken.uuid,
            maxHops: 3,
          })

          if (response) {
            // Handle both nested data and direct response
            const quoteData = response

            // Extract route tokens from path
            const routeTokens = []
            if (typeof quoteData.path === 'string') {
              const pathArray = (quoteData.path as string).split(',').map((s: string) => s.trim())

              // Start with input token
              routeTokens.push(fromToken.uuid)

              // Process pool keys to build route
              for (const poolKey of pathArray) {
                if (poolKey.includes('/')) {
                  const [tokenA, tokenB] = poolKey.split('/')
                  const lastToken: string = routeTokens[routeTokens.length - 1]

                  if (tokenA === lastToken && tokenB && !routeTokens.includes(tokenB)) {
                    routeTokens.push(tokenB)
                  } else if (tokenB === lastToken && tokenA && !routeTokens.includes(tokenA)) {
                    routeTokens.push(tokenA)
                  }
                }
              }

              // Ensure we end with output token
              if (routeTokens[routeTokens.length - 1] !== toToken.uuid) {
                routeTokens.push(toToken.uuid)
              }
            }

            // Convert UUIDs to symbols
            const routeSymbols = routeTokens.map((uuid) => {
              if (uuid === '00') return 'HTR'
              const token = tokens.find((t) => t.uuid === uuid)
              return token?.symbol || uuid.substring(0, 6)
            })

            results.push({
              fromToken: fromToken.symbol || fromToken.uuid,
              toToken: toToken.symbol || toToken.uuid,
              amountIn,
              amountOut: quoteData.amountOut || 0,
              route: routeSymbols,
              priceImpact: quoteData.priceImpact || 0,
            })
          } else {
            results.push({
              fromToken: fromToken.symbol || fromToken.uuid,
              toToken: toToken.symbol || toToken.uuid,
              amountIn,
              amountOut: 0,
              route: [],
              priceImpact: 0,
              error: 'No route found',
            })
          }
        } catch (error) {
          console.error(`Error testing ${fromToken.symbol} → ${toToken.symbol}:`, error)
          results.push({
            fromToken: fromToken.symbol || fromToken.uuid,
            toToken: toToken.symbol || toToken.uuid,
            amountIn,
            amountOut: 0,
            route: [],
            priceImpact: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }

        // Small delay to avoid overwhelming the API
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    setRouteResults(results)
    setLoading(false)
  }

  return (
    <Layout>
      <div className="container px-4 py-8 mx-auto">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-6 text-3xl font-bold text-white">Routing Debug Page</h1>

          <div className="mb-6">
            <button
              onClick={testAllRoutes}
              disabled={loading || !tokensData}
              className="px-6 py-3 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-600"
            >
              {loading ? 'Testing Routes...' : 'Test All Routes'}
            </button>

            {loading && (
              <p className="mt-2 text-gray-400">Testing all possible token combinations... This may take a minute.</p>
            )}
          </div>

          {routeResults.length > 0 && (
            <div className="space-y-4">
              <h2 className="mb-4 text-xl font-semibold text-white">
                Route Results ({routeResults.length} combinations tested)
              </h2>

              {/* Group results by success/failure */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Successful Routes */}
                <div>
                  <h3 className="mb-3 text-lg font-medium text-green-400">
                    Successful Routes ({routeResults.filter((r) => !r.error && r.amountOut > 0).length})
                  </h3>
                  <div className="overflow-y-auto space-y-2 max-h-96">
                    {routeResults
                      .filter((result) => !result.error && result.amountOut > 0)
                      .map((result, index) => (
                        <div key={index} className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-mono text-sm">
                              <span className="text-blue-400">
                                {result.amountIn} {result.fromToken}
                              </span>
                              <span className="mx-2 text-gray-400">→</span>
                              <span className="text-green-400">
                                {result.amountOut.toFixed(4)} {result.toToken}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400">Impact: {result.priceImpact.toFixed(2)}%</div>
                          </div>
                          <div className="text-xs text-gray-300">
                            <span className="text-gray-500">Route:</span> {result.route.join(' → ')}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Failed Routes */}
                <div>
                  <h3 className="mb-3 text-lg font-medium text-red-400">
                    Failed Routes ({routeResults.filter((r) => r.error || r.amountOut === 0).length})
                  </h3>
                  <div className="overflow-y-auto space-y-2 max-h-96">
                    {routeResults
                      .filter((result) => result.error || result.amountOut === 0)
                      .map((result, index) => (
                        <div key={index} className="p-3 bg-gray-900 rounded-lg border border-gray-700">
                          <div className="mb-1 font-mono text-sm">
                            <span className="text-blue-400">
                              {result.amountIn} {result.fromToken}
                            </span>
                            <span className="mx-2 text-gray-400">→</span>
                            <span className="text-red-400">{result.toToken}</span>
                          </div>
                          <div className="text-xs text-red-300">{result.error || 'No liquidity'}</div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="p-4 mt-6 bg-gray-800 rounded-lg">
                <h3 className="mb-3 text-lg font-medium text-white">Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                  <div>
                    <div className="text-gray-400">Total Tests</div>
                    <div className="font-medium text-white">{routeResults.length}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Successful</div>
                    <div className="font-medium text-green-400">
                      {routeResults.filter((r) => !r.error && r.amountOut > 0).length}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Failed</div>
                    <div className="font-medium text-red-400">
                      {routeResults.filter((r) => r.error || r.amountOut === 0).length}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Success Rate</div>
                    <div className="font-medium text-blue-400">
                      {routeResults.length > 0
                        ? (
                            (routeResults.filter((r) => !r.error && r.amountOut > 0).length / routeResults.length) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
