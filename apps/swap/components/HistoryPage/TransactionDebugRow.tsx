import { Typography, Chip, Collapsible } from '@dozer/ui'
import { Currency } from '@dozer/ui'
import React, { useState } from 'react'
import { TransactionData } from './TransactionColumns'

interface TransactionDebugRowProps {
  transaction: TransactionData
}

export const TransactionDebugRow: React.FC<TransactionDebugRowProps> = ({ transaction }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  // Helper function to format token symbols for route display
  const formatTokenForRoute = (tokenUuid: string) => {
    // Try to find the token symbol from resolved symbols first
    const tokenInfo = transaction.tokenSymbols?.find(t => t.uuid === tokenUuid)
    if (tokenInfo) {
      return tokenInfo.symbol
    }
    // Fallback to shortened UUID
    return tokenUuid === '00' ? 'HTR' : tokenUuid.substring(0, 6).toUpperCase()
  }

  // Extract route information for multi-hop swaps
  const renderRouteVisualization = () => {
    if (!transaction.isMultiHop || transaction.poolsInvolved.length === 0) {
      return null
    }

    const routeTokens = []
    const pools = transaction.poolsInvolved

    // Build the route from pool information
    if (pools.length > 0) {
      // Get tokens from the first pool
      const [firstTokenA, firstTokenB] = pools[0].split('/')
      routeTokens.push(formatTokenForRoute(firstTokenA))

      // Follow the path through each pool
      let currentToken = firstTokenA
      for (const pool of pools) {
        const [tokenA, tokenB] = pool.split('/')
        if (tokenA === currentToken) {
          currentToken = tokenB
        } else if (tokenB === currentToken) {
          currentToken = tokenA
        } else {
          // If we can't follow the path, just add the next token
          currentToken = tokenA !== currentToken ? tokenA : tokenB
        }
        routeTokens.push(formatTokenForRoute(currentToken))
      }
    }

    return (
      <div className="mt-4">
        <Typography variant="sm" weight={600} className="text-slate-300 mb-2">
          Multi-hop Route:
        </Typography>
        <div className="flex items-center gap-2">
          {routeTokens.map((token, index) => (
            <React.Fragment key={index}>
              <Chip color="blue" size="sm" label={token} />
              {index < routeTokens.length - 1 && (
                <Typography variant="sm" className="text-slate-500">→</Typography>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="border-t border-slate-700 mt-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 text-left hover:bg-slate-800 transition-colors"
      >
        <Typography variant="sm" className="text-slate-400">
          {isExpanded ? '▼' : '▶'} Debug Information
        </Typography>
      </button>
      
      <Collapsible open={isExpanded}>
        <div className="px-4 pb-4 bg-slate-900/50">
          {/* Basic Transaction Info */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Typography variant="sm" weight={600} className="text-slate-300 mb-1">
                Transaction ID:
              </Typography>
              <Typography variant="xs" className="text-slate-400 font-mono break-all">
                {transaction.tx_id}
              </Typography>
            </div>
            <div>
              <Typography variant="sm" weight={600} className="text-slate-300 mb-1">
                Status:
              </Typography>
              <Chip color={transaction.success ? 'green' : 'red'} size="sm" 
                    label={transaction.success ? 'Success' : 'Failed'} />
            </div>
          </div>

          {/* Multi-hop Route Visualization */}
          {renderRouteVisualization()}

          {/* Transaction Arguments */}
          <div className="mt-4">
            <Typography variant="sm" weight={600} className="text-slate-300 mb-2">
              Contract Arguments:
            </Typography>
            <div className="bg-slate-800 rounded-lg p-3 overflow-x-auto">
              <pre className="text-xs text-slate-300 whitespace-pre-wrap">
                {JSON.stringify(transaction.args, null, 2)}
              </pre>
            </div>
          </div>

          {/* Pool Information */}
          {transaction.poolsInvolved.length > 0 && (
            <div className="mt-4">
              <Typography variant="sm" weight={600} className="text-slate-300 mb-2">
                Pools Involved:
              </Typography>
              <div className="space-y-2">
                {transaction.poolsInvolved.map((pool, index) => {
                  const [tokenA, tokenB, fee] = pool.split('/')
                  const tokenASymbol = formatTokenForRoute(tokenA)
                  const tokenBSymbol = formatTokenForRoute(tokenB)
                  const feePercentage = fee ? (parseInt(fee) / 1000).toFixed(2) : '0.00'
                  
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <Chip color="gray" size="sm" label={`Pool ${index + 1}`} />
                      <Typography variant="xs" className="text-slate-400 font-mono">
                        {tokenASymbol}/{tokenBSymbol} (Fee: {feePercentage}%)
                      </Typography>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Transaction I/O */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <Typography variant="sm" weight={600} className="text-slate-300 mb-2">
                Inputs ({transaction.debug.inputs.length}):
              </Typography>
              <div className="bg-slate-800 rounded-lg p-3 max-h-32 overflow-y-auto">
                <pre className="text-xs text-slate-300 whitespace-pre-wrap">
                  {JSON.stringify(transaction.debug.inputs, null, 2)}
                </pre>
              </div>
            </div>
            <div>
              <Typography variant="sm" weight={600} className="text-slate-300 mb-2">
                Outputs ({transaction.debug.outputs.length}):
              </Typography>
              <div className="bg-slate-800 rounded-lg p-3 max-h-32 overflow-y-auto">
                <pre className="text-xs text-slate-300 whitespace-pre-wrap">
                  {JSON.stringify(transaction.debug.outputs, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          {/* Parent Transactions */}
          {transaction.debug.parents.length > 0 && (
            <div className="mt-4">
              <Typography variant="sm" weight={600} className="text-slate-300 mb-2">
                Parent Transactions:
              </Typography>
              <div className="flex flex-wrap gap-2">
                {transaction.debug.parents.map((parent, index) => (
                  <Typography key={index} variant="xs" className="text-slate-400 font-mono">
                    {parent.substring(0, 8)}...
                  </Typography>
                ))}
              </div>
            </div>
          )}

          {/* Raw Transaction Data */}
          <div className="mt-4">
            <Typography variant="sm" weight={600} className="text-slate-300 mb-2">
              Raw Transaction Data:
            </Typography>
            <div className="bg-slate-800 rounded-lg p-3 max-h-48 overflow-y-auto">
              <pre className="text-xs text-slate-300 whitespace-pre-wrap">
                {JSON.stringify(transaction.debug.fullTx, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </Collapsible>
    </div>
  )
}