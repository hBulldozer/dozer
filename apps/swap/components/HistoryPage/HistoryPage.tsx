import React, { useState, useMemo } from 'react'
import { GenericTable, Typography, Chip, Button } from '@dozer/ui'
import {
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { api } from '../../utils/api'
import {
  TX_HASH_COLUMN,
  TX_TIMESTAMP_COLUMN,
  TX_METHOD_COLUMN,
  TX_TOKENS_COLUMN,
  TX_WEIGHT_COLUMN,
} from './TransactionColumns'
import type { TransactionData } from './TransactionColumns'
import { TransactionDebugRow } from './TransactionDebugRow'

const PAGE_SIZE = 50

// Define base columns for the transaction history table
const BASE_COLUMNS = [
  TX_HASH_COLUMN,
  TX_TIMESTAMP_COLUMN,
  TX_METHOD_COLUMN,
  TX_TOKENS_COLUMN,
  TX_WEIGHT_COLUMN,
]

export const HistoryPage: React.FC = () => {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'timestamp', desc: true }])
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState({
    methodFilter: '',
    poolFilter: '',
    tokenFilter: '',
    count: PAGE_SIZE,
  })

  // Fetch transaction history data
  const { data, isLoading, error, refetch } = api.getPools.getAllTransactionHistory.useQuery(filters)

  // Memoized table data
  const tableData = useMemo(() => {
    return data?.transactions || []
  }, [data])

  // Toggle expansion for a row
  const toggleRowExpansion = (rowId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(rowId)) {
        newSet.delete(rowId)
      } else {
        newSet.add(rowId)
      }
      return newSet
    })
  }

  // Setup react-table with dynamic debug column
  const table = useReactTable({
    data: tableData,
    columns: [
      ...BASE_COLUMNS,
      // Custom debug column with expand functionality
      {
        id: 'debug',
        header: 'Debug',
        cell: ({ row }: any) => (
          <div className="flex items-center gap-2">
            <Chip color="gray" size="sm" label={`${row.original.debug.inputs.length} inputs`} />
            <Chip color="gray" size="sm" label={`${row.original.debug.outputs.length} outputs`} />
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                toggleRowExpansion(row.original.id)
              }}
              className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded transition-colors cursor-pointer"
            >
              {expandedRows.has(row.original.id) ? '▼' : '▶'}
            </button>
          </div>
        ),
        size: 150,
        meta: {
          skeleton: <div className="rounded bg-stone-700 w-full h-[20px] animate-pulse" />,
        },
      }
    ],
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  // Filter handlers
  const handleMethodFilterChange = (value: string) => {
    setFilters((prev) => ({ ...prev, methodFilter: value }))
  }

  const handlePoolFilterChange = (value: string) => {
    setFilters((prev) => ({ ...prev, poolFilter: value }))
  }

  const handleTokenFilterChange = (value: string) => {
    setFilters((prev) => ({ ...prev, tokenFilter: value }))
  }

  const clearFilters = () => {
    setFilters({
      methodFilter: '',
      poolFilter: '',
      tokenFilter: '',
      count: PAGE_SIZE,
    })
  }

  const refreshData = () => {
    refetch()
  }

  // Method options for filter
  const methodOptions = [
    { value: '', label: 'All Methods' },
    { value: 'swap_exact_tokens_for_tokens', label: 'Single Swap' },
    { value: 'swap_exact_tokens_for_tokens_through_path', label: 'Multi-hop Swap' },
    { value: 'add_liquidity', label: 'Add Liquidity' },
    { value: 'remove_liquidity', label: 'Remove Liquidity' },
    { value: 'create_pool', label: 'Create Pool' },
  ]

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Typography variant="lg" className="text-red-400 mb-4">
          Error loading transaction history
        </Typography>
        <Typography variant="sm" className="text-slate-400 mb-4">
          {error.message}
        </Typography>
        <Button onClick={refreshData} variant="outlined" size="sm">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h2" weight={600} className="text-slate-100">
            Transaction History (Debug)
          </Typography>
          <Typography variant="sm" className="text-slate-400 mt-1">
            Debug view of all DozerPoolManager transactions with multi-hop analysis
          </Typography>
        </div>
        <div className="flex items-center gap-2">
          <Chip color="blue" size="sm" label={`${data?.transactions?.length || 0} transactions`} />
          <Button onClick={refreshData} variant="outlined" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-800 rounded-lg">
        <div>
          <Typography variant="sm" weight={600} className="text-slate-300 mb-2">
            Transaction Type:
          </Typography>
          <select
            value={filters.methodFilter}
            onChange={(e) => handleMethodFilterChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-200 text-sm"
          >
            {methodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Typography variant="sm" weight={600} className="text-slate-300 mb-2">
            Pool Filter:
          </Typography>
          <input
            type="text"
            value={filters.poolFilter}
            onChange={(e) => handlePoolFilterChange(e.target.value)}
            placeholder="e.g., HTR/DZR or 00/token_uuid"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-200 text-sm placeholder-slate-500"
          />
        </div>

        <div>
          <Typography variant="sm" weight={600} className="text-slate-300 mb-2">
            Token Filter:
          </Typography>
          <input
            type="text"
            value={filters.tokenFilter}
            onChange={(e) => handleTokenFilterChange(e.target.value)}
            placeholder="e.g., 00 (HTR) or token_uuid"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-200 text-sm placeholder-slate-500"
          />
        </div>

        <div className="flex items-end">
          <Button onClick={clearFilters} variant="outlined" size="sm" className="w-full">
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 rounded-lg p-4">
            <Typography variant="sm" className="text-slate-400">
              Total Transactions
            </Typography>
            <Typography variant="xl" weight={600} className="text-slate-100">
              {data.transactions.length}
            </Typography>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <Typography variant="sm" className="text-slate-400">
              Multi-hop Swaps
            </Typography>
            <Typography variant="xl" weight={600} className="text-blue-400">
              {data.transactions.filter((tx: TransactionData) => tx.isMultiHop).length}
            </Typography>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <Typography variant="sm" className="text-slate-400">
              Successful
            </Typography>
            <Typography variant="xl" weight={600} className="text-green-400">
              {data.transactions.filter((tx: TransactionData) => tx.success).length}
            </Typography>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <Typography variant="sm" className="text-slate-400">
              Failed
            </Typography>
            <Typography variant="xl" weight={600} className="text-red-400">
              {data.transactions.filter((tx: TransactionData) => !tx.success).length}
            </Typography>
          </div>
        </div>
      )}

      {/* Transaction Table */}
      <div className="bg-slate-800 rounded-lg overflow-hidden">
        <GenericTable
          table={table}
          loading={isLoading}
          pageSize={PAGE_SIZE}
          placeholder={
            <div className="flex flex-col items-center justify-center h-32">
              <Typography variant="lg" className="text-slate-400">
                No transactions found
              </Typography>
            </div>
          }
        />
      </div>

      {/* Render expandable debug rows */}
      {table.getRowModel().rows.map((row) => {
        if (!expandedRows.has(row.original.id)) return null

        return (
          <div key={`${row.id}-debug`} className="bg-slate-800 rounded-lg mt-2">
            <TransactionDebugRow transaction={row.original} />
          </div>
        )
      })}

      {/* Pagination Info */}
      {data?.hasMore && (
        <div className="flex justify-center">
          <Typography variant="sm" className="text-slate-400">
            Showing {data.transactions.length} transactions.
            {data.hasMore && ' More data available - adjust filters or pagination.'}
          </Typography>
        </div>
      )}
    </div>
  )
}
