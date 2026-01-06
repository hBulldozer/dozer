import React from 'react'
import { Typography, Chip } from '@dozer/ui'
import { getCoreRowModel, getSortedRowModel, SortingState, useReactTable, ColumnDef } from '@tanstack/react-table'
import { formatNumber } from '@dozer/format'
import { getExplorerUrls } from '../utils/transactionUtils'

// Simplified transaction data type for Uniswap-style table
export interface SimpleTransaction {
  id: string
  hash: string
  timestamp: number
  timeAgo: string // e.g., "13 days"
  type: 'Swap' | 'Add' | 'Remove' | 'Create'
  method?: string // The actual method name from the contract (e.g., 'add_liquidity_single_token')
  tokenPair: string // e.g., "HTR/CTHOR"
  amounts: string // e.g., "296.14 HTR → 0.31 CTHOR"
  // Token-specific info for Uniswap-like columns
  token0Symbol?: string
  token1Symbol?: string
  token0Amount?: number | null
  token1Amount?: number | null
  // Side relative to token1 (Buy/Sell token1)
  side?: 'Buy' | 'Sell' | 'Add' | 'Remove' | 'Create' | 'Unknown'
  totalValue?: string // e.g., "$45.83" (if USD prices available)
  account: string // wallet address
  success: boolean
  explorerUrl?: string
  isMultiHop?: boolean // True if this is a multi-hop swap (routed through multiple pools)
}

// Helper function to truncate address (show only last digits)
const truncateAddress = (address: string): string => {
  if (address.length <= 8) return address
  return `...${address.slice(-8)}`
}

// Helper function to get transaction type color
const getTypeColor = (type: string): 'blue' | 'green' | 'yellow' | 'red' | 'gray' => {
  switch (type) {
    case 'Swap':
      return 'blue'
    case 'Add':
      return 'blue'
    case 'Remove':
      return 'yellow'
    case 'Buy':
      return 'green'
    case 'Sell':
      return 'red'
    default:
      return 'gray'
  }
}

// Cell components following the app's pattern
const TimeCell: React.FC<{ row: SimpleTransaction }> = ({ row }) => {
  const explorerUrls = getExplorerUrls()
  const transactionUrl = explorerUrls.getTransactionUrl(row.hash)

  return (
    <a href={transactionUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
      <Typography variant="sm" className="text-stone-300 whitespace-nowrap">
        {row.timeAgo}
      </Typography>
    </a>
  )
}

const TypeCell: React.FC<{ row: SimpleTransaction }> = ({ row }) => {
  // Determine label based on method for more granular display
  let label: string = row.type
  let typeForColor: string = row.type

  // Single token operations still use the standard Add/Remove labels
  // The zeroed amount will indicate it was a single token operation
  if (row.side === 'Buy' || row.side === 'Sell') {
    // Use side for Buy/Sell
    label = row.side
    typeForColor = row.side
  }

  const color = getTypeColor(typeForColor)

  return (
    <div className="flex items-center gap-1.5">
      <Chip color={color} size="default" label={label} className="font-semibold" />
      {row.isMultiHop && (
        <div className="group relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4 text-blue-400"
          >
            <path
              fillRule="evenodd"
              d="M13.2 2.24a.75.75 0 00.04 1.06l2.1 1.95H6.75a.75.75 0 000 1.5h8.59l-2.1 1.95a.75.75 0 101.02 1.1l3.5-3.25a.75.75 0 000-1.1l-3.5-3.25a.75.75 0 00-1.06.04zm-6.4 8a.75.75 0 00-1.06-.04l-3.5 3.25a.75.75 0 000 1.1l3.5 3.25a.75.75 0 101.02-1.1l-2.1-1.95h8.59a.75.75 0 000-1.5H4.66l2.1-1.95a.75.75 0 00.04-1.06z"
              clipRule="evenodd"
            />
          </svg>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-stone-800 text-stone-100 text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10 border border-stone-700">
            <div className="font-medium mb-1">Multi-hop Routing</div>
            <div className="text-stone-400">This pool was used as a routing hop.</div>
            <div className="text-stone-400">Amounts shown are only for this pool.</div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
              <div className="border-4 border-transparent border-t-stone-800"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const TotalValueCell: React.FC<{ row: SimpleTransaction }> = ({ row }) => (
  <div className="text-center">
    <Typography variant="sm" className="text-stone-200 font-medium">
      {row.totalValue || '-'}
    </Typography>
  </div>
)

const TokenAmountCell: React.FC<{ tokenAmount?: number | null }> = ({ tokenAmount }) => (
  <div className="text-center">
    <Typography variant="sm" className="text-stone-300">
      {tokenAmount !== null && tokenAmount !== undefined ? formatNumber(tokenAmount) : '-'}
    </Typography>
  </div>
)

const AccountCell: React.FC<{ row: SimpleTransaction }> = ({ row }) => {
  const address = row.account
  const explorerUrls = getExplorerUrls()
  const accountUrl = explorerUrls.getAccountUrl(address)

  return (
    <a
      href={accountUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-400 hover:text-blue-300 transition-colors"
    >
      <Typography variant="sm" className="font-mono">
        {truncateAddress(address)}
      </Typography>
    </a>
  )
}

// Mobile-optimized column definitions
const createColumns = (token0Header?: string, token1Header?: string): ColumnDef<SimpleTransaction, unknown>[] => [
  {
    id: 'time',
    header: 'Time',
    accessorFn: (row) => row.timestamp,
    cell: (props) => <TimeCell row={props.row.original} />,
    size: 80,
    meta: {
      skeleton: <div className="rounded bg-stone-700 w-full h-[20px] animate-pulse" />,
    },
  },
  {
    id: 'type',
    header: 'Type',
    accessorFn: (row) => row.type,
    cell: (props) => <TypeCell row={props.row.original} />,
    size: 100,
    meta: {
      skeleton: <div className="rounded bg-stone-700 w-full h-[20px] animate-pulse" />,
    },
  },
  {
    id: 'totalValue',
    header: 'USD',
    accessorFn: (row) => row.totalValue,
    cell: (props) => <TotalValueCell row={props.row.original} />,
    size: 90,
    meta: {
      className: 'text-center',
      skeleton: <div className="rounded bg-stone-700 w-full h-[20px] animate-pulse" />,
    },
  },
  {
    id: 'token0',
    header: token0Header || 'Token A',
    accessorFn: (row) => row.token0Amount,
    cell: (props) => <TokenAmountCell tokenAmount={props.row.original.token0Amount} />,
    size: 100,
    meta: {
      className: 'text-center hidden md:table-cell',
      skeleton: <div className="rounded bg-stone-700 w-full h-[20px] animate-pulse" />,
    },
  },
  {
    id: 'token1',
    header: token1Header || 'Token B',
    accessorFn: (row) => row.token1Amount,
    cell: (props) => <TokenAmountCell tokenAmount={props.row.original.token1Amount} />,
    size: 100,
    meta: {
      className: 'text-center',
      skeleton: <div className="rounded bg-stone-700 w-full h-[20px] animate-pulse" />,
    },
  },
  {
    id: 'account',
    header: 'Account',
    accessorFn: (row) => row.account,
    cell: (props) => <AccountCell row={props.row.original} />,
    size: 100,
    meta: {
      className: 'hidden md:table-cell',
      skeleton: <div className="rounded bg-stone-700 w-full h-[20px] animate-pulse" />,
    },
  },
]

export interface SimplePoolTransactionHistoryProps {
  poolKey?: string // Optional - kept for backward compatibility but currently unused
  transactions: SimpleTransaction[]
  loading?: boolean
  error?: string
  onRefresh?: () => void
  token0Symbol?: string
  token1Symbol?: string
}

export const SimplePoolTransactionHistory: React.FC<SimplePoolTransactionHistoryProps> = ({
  transactions,
  loading = false,
  error,
  onRefresh,
  token0Symbol,
  token1Symbol,
}) => {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'time', desc: true }])

  // Use provided token symbols or derive from first transaction as fallback
  const token0Header = React.useMemo(() => {
    if (token0Symbol) return token0Symbol
    const first = transactions[0]
    if (!first) return undefined
    return first.token0Symbol || first.tokenPair.split('/')[0]
  }, [token0Symbol, transactions])

  const token1Header = React.useMemo(() => {
    if (token1Symbol) return token1Symbol
    const first = transactions[0]
    if (!first) return undefined
    return first.token1Symbol || first.tokenPair.split('/')[1]
  }, [token1Symbol, transactions])

  const columns = React.useMemo(() => createColumns(token0Header, token1Header), [token0Header, token1Header])

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
      <div className="bg-stone-900 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <Typography variant="lg" weight={600} className="text-stone-100">
            Recent Transactions
          </Typography>
          <Chip color="red" size="sm" label="Error" />
        </div>
        <div className="flex flex-col items-center justify-center h-32">
          <Typography variant="lg" className="text-red-400 mb-2">
            Failed to load transactions
          </Typography>
          <Typography variant="sm" className="text-stone-400 mb-4 text-center max-w-md">
            {error}
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
          </div>
        </div>
      </div>
    )
  }

  // Show only the first 10 transactions
  const displayTransactions = transactions.slice(0, 10)

  return (
    <div className="bg-stone-900 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-stone-700">
        <div>
          <Typography variant="lg" weight={600} className="text-stone-100">
            Recent Transactions
          </Typography>
          <Typography variant="sm" className="text-stone-400 mt-1">
            Latest activity for this pool
          </Typography>
        </div>
      </div>

      {/* Simplified Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-stone-700">
              {table.getHeaderGroups().map((headerGroup) =>
                headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`px-3 py-3 text-left text-xs font-medium text-stone-400 uppercase tracking-wider ${
                      header.column.columnDef.meta?.className || ''
                    }`}
                  >
                    {header.isPlaceholder ? null : (
                      <div>
                        {typeof header.column.columnDef.header === 'string' ? header.column.columnDef.header : null}
                      </div>
                    )}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={`skeleton-${index}`} className="border-b border-stone-700">
                  <td className="px-3 py-3">
                    <div className="rounded bg-stone-700 w-full h-[20px] animate-pulse" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="rounded bg-stone-700 w-full h-[20px] animate-pulse" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="rounded bg-stone-700 w-full h-[20px] animate-pulse" />
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    <div className="rounded bg-stone-700 w-full h-[20px] animate-pulse" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="rounded bg-stone-700 w-full h-[20px] animate-pulse" />
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    <div className="rounded bg-stone-700 w-full h-[20px] animate-pulse" />
                  </td>
                </tr>
              ))
            ) : displayTransactions.length === 0 ? (
              // Empty state
              <tr>
                <td colSpan={4} className="px-3 py-12 text-center md:hidden">
                  <Typography variant="lg" className="text-stone-400 mb-2">
                    No transactions found
                  </Typography>
                  <Typography variant="sm" className="text-stone-500">
                    Transactions will appear here once there is activity in this pool
                  </Typography>
                </td>
                <td colSpan={6} className="px-3 py-12 text-center hidden md:table-cell">
                  <Typography variant="lg" className="text-stone-400 mb-2">
                    No transactions found
                  </Typography>
                  <Typography variant="sm" className="text-stone-500">
                    Transactions will appear here once there is activity in this pool
                  </Typography>
                </td>
              </tr>
            ) : (
              // Transaction rows
              displayTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-stone-700 hover:bg-stone-700/50 transition-colors">
                  <td className="px-3 py-3 min-w-[80px]">
                    <TimeCell row={transaction} />
                  </td>
                  <td className="px-3 py-3">
                    <TypeCell row={transaction} />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <TotalValueCell row={transaction} />
                  </td>
                  <td className="px-3 py-3 text-right hidden md:table-cell">
                    <TokenAmountCell tokenAmount={transaction.token0Amount} />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <TokenAmountCell tokenAmount={transaction.token1Amount} />
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    <AccountCell row={transaction} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer with nanocontract explorer link */}
      {displayTransactions.length > 0 && process.env.NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID && (
        <div className="p-4 border-t border-stone-700 bg-stone-900">
          <div className="flex items-center justify-center">
            <a
              href={getExplorerUrls().getNanoContractUrl(process.env.NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
            >
              View all transactions on Explorer
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
