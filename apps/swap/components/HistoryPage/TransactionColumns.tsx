import { ColumnDef } from '@tanstack/react-table'
import { Chip, Typography } from '@dozer/ui'
import React from 'react'

// Transaction type definition matching our API response
export interface TransactionData {
  id: string // Required by GenericTable
  tx_id: string
  timestamp: number
  method: string
  args: any
  poolsInvolved: string[]
  tokensInvolved: string[]
  tokenSymbols: Array<{ uuid: string; symbol: string; name: string }>
  isMultiHop: boolean
  weight: number
  success: boolean
  debug: {
    fullTx: any
    inputs: any[]
    outputs: any[]
    parents: string[]
  }
}

// Helper function to format timestamp
const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleString()
}

// Helper function to format transaction method
const formatMethod = (method: string) => {
  const methodMappings: Record<string, string> = {
    'swap_exact_tokens_for_tokens': 'Swap',
    'swap_exact_tokens_for_tokens_through_path': 'Multi-hop Swap',
    'add_liquidity': 'Add Liquidity',
    'remove_liquidity': 'Remove Liquidity',
    'create_pool': 'Create Pool',
  }
  return methodMappings[method] || method
}

// Helper function to get method color
const getMethodColor = (method: string): 'blue' | 'green' | 'yellow' | 'red' | 'gray' => {
  if (method.includes('swap')) return 'blue'
  if (method.includes('add_liquidity')) return 'green'
  if (method.includes('remove_liquidity')) return 'yellow'
  if (method.includes('create_pool')) return 'gray'
  return 'gray'
}

export const TX_HASH_COLUMN: ColumnDef<TransactionData, unknown> = {
  id: 'tx_id',
  header: 'Transaction Hash',
  accessorFn: (row) => row.tx_id,
  cell: ({ row }) => (
    <div className="flex items-center gap-2">
      <Typography variant="sm" className="text-slate-400 font-mono">
        {row.original.tx_id.substring(0, 8)}...
      </Typography>
      {!row.original.success && (
        <Chip color="red" size="sm" label="Failed" />
      )}
    </div>
  ),
  size: 120,
  meta: {
    skeleton: <div className="rounded bg-stone-700 w-full h-[20px] animate-pulse" />,
  },
}

export const TX_TIMESTAMP_COLUMN: ColumnDef<TransactionData, unknown> = {
  id: 'timestamp',
  header: 'Time',
  accessorFn: (row) => row.timestamp,
  cell: ({ row }) => (
    <Typography variant="sm" className="text-slate-300">
      {formatTimestamp(row.original.timestamp)}
    </Typography>
  ),
  size: 150,
  meta: {
    skeleton: <div className="rounded bg-stone-700 w-full h-[20px] animate-pulse" />,
  },
}

export const TX_METHOD_COLUMN: ColumnDef<TransactionData, unknown> = {
  id: 'method',
  header: 'Type',
  accessorFn: (row) => row.method,
  cell: ({ row }) => {
    const method = row.original.method
    const color = getMethodColor(method)
    return (
      <div className="flex items-center gap-2">
        <Chip color={color} size="sm" label={formatMethod(method)} />
        {row.original.isMultiHop && (
          <Chip color="purple" size="sm" label="Multi-hop" />
        )}
      </div>
    )
  },
  size: 140,
  meta: {
    skeleton: <div className="rounded bg-stone-700 w-full h-[20px] animate-pulse" />,
  },
}

export const TX_POOLS_COLUMN: ColumnDef<TransactionData, unknown> = {
  id: 'pools',
  header: 'Pools Involved',
  accessorFn: (row) => row.poolsInvolved,
  cell: ({ row }) => {
    const pools = row.original.poolsInvolved
    if (pools.length === 0) return <Typography variant="sm" className="text-slate-500">-</Typography>
    
    return (
      <div className="flex flex-col gap-1">
        {pools.slice(0, 2).map((pool, index) => {
          const [tokenA, tokenB, fee] = pool.split('/')
          const tokenASymbol = tokenA === '00' ? 'HTR' : tokenA.substring(0, 4).toUpperCase()
          const tokenBSymbol = tokenB === '00' ? 'HTR' : tokenB.substring(0, 4).toUpperCase()
          return (
            <Typography key={index} variant="xs" className="text-slate-300 font-mono">
              {tokenASymbol}/{tokenBSymbol}
            </Typography>
          )
        })}
        {pools.length > 2 && (
          <Typography variant="xs" className="text-slate-500">
            +{pools.length - 2} more
          </Typography>
        )}
      </div>
    )
  },
  size: 120,
  meta: {
    skeleton: <div className="rounded bg-stone-700 w-full h-[20px] animate-pulse" />,
  },
}

export const TX_TOKENS_COLUMN: ColumnDef<TransactionData, unknown> = {
  id: 'tokens',
  header: 'Tokens',
  accessorFn: (row) => row.tokenSymbols,
  cell: ({ row }) => {
    const tokenSymbols = row.original.tokenSymbols
    if (!tokenSymbols || tokenSymbols.length === 0) return <Typography variant="sm" className="text-slate-500">-</Typography>
    
    return (
      <div className="flex flex-wrap gap-1">
        {tokenSymbols.slice(0, 3).map((token, index) => {
          return (
            <Chip key={index} color="gray" size="sm" label={token.symbol} />
          )
        })}
        {tokenSymbols.length > 3 && (
          <Typography variant="xs" className="text-slate-500">
            +{tokenSymbols.length - 3}
          </Typography>
        )}
      </div>
    )
  },
  size: 120,
  meta: {
    skeleton: <div className="rounded bg-stone-700 w-full h-[20px] animate-pulse" />,
  },
}

export const TX_WEIGHT_COLUMN: ColumnDef<TransactionData, unknown> = {
  id: 'weight',
  header: 'Weight',
  accessorFn: (row) => row.weight,
  cell: ({ row }) => (
    <Typography variant="sm" className="text-slate-400">
      {row.original.weight.toFixed(2)}
    </Typography>
  ),
  size: 80,
  meta: {
    className: 'justify-end',
    skeleton: <div className="rounded bg-stone-700 w-full h-[20px] animate-pulse" />,
  },
}

export const TX_DEBUG_COLUMN: ColumnDef<TransactionData, unknown> = {
  id: 'debug',
  header: 'Debug',
  cell: ({ row }) => (
    <div className="flex items-center gap-2">
      <Chip color="gray" size="sm" label={`${row.original.debug.inputs.length} inputs`} />
      <Chip color="gray" size="sm" label={`${row.original.debug.outputs.length} outputs`} />
      <button
        onClick={() => row.toggleExpanded()}
        className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded transition-colors"
      >
        {row.getIsExpanded() ? '▼' : '▶'}
      </button>
    </div>
  ),
  size: 150,
  meta: {
    skeleton: <div className="rounded bg-stone-700 w-full h-[20px] animate-pulse" />,
  },
}