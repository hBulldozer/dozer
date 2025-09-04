import React from 'react'
import { GenericTable, Typography, Chip } from '@dozer/ui'
import { getCoreRowModel, getSortedRowModel, SortingState, useReactTable, ColumnDef } from '@tanstack/react-table'

// Transaction data type for pool-specific transactions
export interface PoolTransaction {
  id: string
  hash: string
  timestamp: number
  action: string
  method: string
  tokenIn: {
    uuid: string
    amount: number
    symbol: string
    name: string
  } | null
  tokenOut: {
    uuid: string
    amount: number
    symbol: string
    name: string
  } | null
  success: boolean
  weight: number
  args: Record<string, unknown>
}

// Helper function to format timestamp
const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleString()
}

// Helper function to format amounts with proper decimals
const formatAmount = (amount: number) => {
  return amount.toFixed(2)
}

// Helper function to get action color
const getActionColor = (action: string): 'blue' | 'green' | 'yellow' | 'red' | 'gray' => {
  if (action.includes('Swap')) return 'blue'
  if (action.includes('Add Liquidity')) return 'green'
  if (action.includes('Remove Liquidity')) return 'yellow'
  if (action.includes('Create Pool')) return 'gray'
  return 'gray'
}

// Column definitions for the transaction table
const createColumns = (): ColumnDef<PoolTransaction, unknown>[] => [
  {
    id: 'hash',
    header: 'Transaction',
    accessorFn: (row) => row.hash,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Typography variant="sm" className="text-slate-400 font-mono">
          {row.original.hash.substring(0, 8)}...
        </Typography>
        {!row.original.success && <Chip color="red" size="sm" label="Failed" />}
      </div>
    ),
    size: 120,
    meta: {
      skeleton: <div className="rounded bg-stone-700 w-full h-[20px] animate-pulse" />,
    },
  },
  {
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
  },
  {
    id: 'action',
    header: 'Action',
    accessorFn: (row) => row.action,
    cell: ({ row }) => {
      const action = row.original.action
      const color = getActionColor(action)
      return <Chip color={color} size="sm" label={action} />
    },
    size: 120,
    meta: {
      skeleton: <div className="rounded bg-stone-700 w-full h-[20px] animate-pulse" />,
    },
  },
  {
    id: 'tokens',
    header: 'Token Flow',
    cell: ({ row }) => {
      const { tokenIn, tokenOut } = row.original

      if (row.original.action === 'Create Pool') {
        return (
          <Typography variant="sm" className="text-slate-400">
            Pool Created
          </Typography>
        )
      }

      if (!tokenIn && !tokenOut) {
        return (
          <Typography variant="sm" className="text-slate-400">
            -
          </Typography>
        )
      }

      return (
        <div className="flex items-center gap-2 text-sm">
          {tokenIn && (
            <div className="flex items-center gap-1">
              <span className="text-slate-300">{formatAmount(tokenIn.amount)}</span>
              <span className="text-slate-400">{tokenIn.symbol}</span>
            </div>
          )}
          {tokenIn && tokenOut && <span className="text-slate-500">→</span>}
          {tokenOut && (
            <div className="flex items-center gap-1">
              <span className="text-slate-300">{formatAmount(tokenOut.amount)}</span>
              <span className="text-slate-400">{tokenOut.symbol}</span>
            </div>
          )}
        </div>
      )
    },
    size: 200,
    meta: {
      skeleton: <div className="rounded bg-stone-700 w-full h-[20px] animate-pulse" />,
    },
  },
  {
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
  },
]

export interface PoolTransactionHistoryProps {
  poolKey: string
  transactions: PoolTransaction[]
  loading?: boolean
  error?: string
  onRefresh?: () => void
}

export const PoolTransactionHistory: React.FC<PoolTransactionHistoryProps> = ({
  poolKey,
  transactions,
  loading = false,
  error,
  onRefresh,
}) => {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'timestamp', desc: true }])

  const columns = React.useMemo(() => createColumns(), [])

  const table = useReactTable({
    data: transactions,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (error) {
    return (
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <Typography variant="lg" weight={600} className="text-slate-100">
            Recent Transactions
          </Typography>
          <Chip color="red" size="sm" label="Error" />
        </div>
        <div className="flex flex-col items-center justify-center h-32">
          <Typography variant="lg" className="text-red-400 mb-2">
            Failed to load transactions
          </Typography>
          <Typography variant="sm" className="text-slate-400 mb-4 text-center max-w-md">
            {error.includes('contract') 
              ? 'Unable to connect to the pool contract. Please check your network connection.' 
              : error.includes('pool') 
              ? 'Pool not found or invalid pool key.' 
              : error}
          </Typography>
          <div className="flex gap-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Try Again
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-700">
        <div>
          <Typography variant="lg" weight={600} className="text-slate-100">
            Recent Transactions
          </Typography>
          <Typography variant="sm" className="text-slate-400 mt-1">
            Latest activity for this pool
          </Typography>
        </div>
        <div className="flex items-center gap-2">
          {loading ? (
            <Chip color="yellow" size="sm" label="Loading..." />
          ) : (
            <Chip color="blue" size="sm" label={`${transactions.length} transactions`} />
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 rounded-md transition-colors text-sm"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto">
        <GenericTable
          table={table}
          loading={loading}
          pageSize={50}
          placeholder={
            <div className="flex flex-col items-center justify-center h-32 p-6">
              <Typography variant="lg" className="text-slate-400">
                No transactions found
              </Typography>
              <Typography variant="sm" className="text-slate-500 mt-1">
                Transactions will appear here once there is activity in this pool
              </Typography>
            </div>
          }
        />
      </div>

      {/* Footer with pool info */}
      {transactions.length > 0 && (
        <div className="p-4 border-t border-slate-700 bg-slate-900">
          <Typography variant="xs" className="text-slate-500">
            Pool: {poolKey} • Showing latest {transactions.length} transactions
          </Typography>
        </div>
      )}
    </div>
  )
}
