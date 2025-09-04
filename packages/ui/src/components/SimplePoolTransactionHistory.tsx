import React from 'react'
import { Typography, Chip } from '@dozer/ui'
import { getCoreRowModel, getSortedRowModel, SortingState, useReactTable, ColumnDef } from '@tanstack/react-table'
import { formatNumber } from '@dozer/format'

// Helper function to get explorer URLs based on environment
const getExplorerUrls = () => {
  // Check if we have a local explorer URL configured
  if (process.env.NEXT_PUBLIC_LOCAL_EXPLORER_URL) {
    return {
      baseUrl: process.env.NEXT_PUBLIC_LOCAL_EXPLORER_URL,
      getTransactionUrl: (txHash: string) => `${process.env.NEXT_PUBLIC_LOCAL_EXPLORER_URL}/transaction/${txHash}`,
      getAccountUrl: (address: string) => `${process.env.NEXT_PUBLIC_LOCAL_EXPLORER_URL}/address/${address}`,
      getNanoContractUrl: (nanoContractId: string) =>
        `${process.env.NEXT_PUBLIC_LOCAL_EXPLORER_URL}/nano_contract/detail/${nanoContractId}`,
    }
  }

  // Fallback to default explorer URLs based on testnet/mainnet
  // You can determine this based on your environment or add an env variable
  const isTestnet = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_IS_TESTNET === 'true'
  const baseUrl = isTestnet ? 'https://explorer.testnet.hathor.network' : 'https://explorer.hathor.network'

  return {
    baseUrl,
    getTransactionUrl: (txHash: string) => `${baseUrl}/transaction/${txHash}`,
    getAccountUrl: (address: string) => `${baseUrl}/address/${address}`,
    getNanoContractUrl: (nanoContractId: string) => `${baseUrl}/nano_contract/detail/${nanoContractId}`,
  }
}

// Simplified transaction data type for Uniswap-style table
export interface SimpleTransaction {
  id: string
  hash: string
  timestamp: number
  timeAgo: string // e.g., "13 days"
  type: 'Swap' | 'Add' | 'Remove' | 'Create'
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
  // Use side for Buy/Sell, otherwise use type
  const typeForColor = row.side === 'Buy' || row.side === 'Sell' ? row.side : row.type
  const color = getTypeColor(typeForColor)
  // Just show Buy/Sell without token name
  const label = row.side === 'Buy' || row.side === 'Sell' ? row.side : row.type
  return <Chip color={color} size="default" label={label} className="font-semibold" />
}

const TotalValueCell: React.FC<{ row: SimpleTransaction }> = ({ row }) => (
  <Typography variant="sm" className="text-stone-200 font-medium">
    {row.totalValue || '-'}
  </Typography>
)

const TokenAmountCell: React.FC<{ tokenAmount?: number | null }> = ({ tokenAmount }) => (
  <Typography variant="sm" className="text-stone-300">
    {tokenAmount !== null && tokenAmount !== undefined ? formatNumber(tokenAmount) : '-'}
  </Typography>
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
      className: 'justify-end',
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
      className: 'justify-end hidden md:table-cell',
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
      className: 'justify-end',
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
  poolKey: string
  transactions: SimpleTransaction[]
  loading?: boolean
  error?: string
  onRefresh?: () => void
  token0Symbol?: string
  token1Symbol?: string
}

export const SimplePoolTransactionHistory: React.FC<SimplePoolTransactionHistoryProps> = ({
  poolKey,
  transactions,
  loading = false,
  error,
  onRefresh,
}) => {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'time', desc: true }])

  // Derive token column headers from first transaction (fallback to tokenPair)
  const token0Header = React.useMemo(() => {
    const first = transactions[0]
    if (!first) return undefined
    return first.token0Symbol || first.tokenPair.split('/')[0]
  }, [transactions])

  const token1Header = React.useMemo(() => {
    const first = transactions[0]
    if (!first) return undefined
    return first.token1Symbol || first.tokenPair.split('/')[1]
  }, [transactions])

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
      {displayTransactions.length > 0 && (
        <div className="p-4 border-t border-stone-700 bg-stone-900">
          <div className="flex items-center justify-center">
            <a
              href={getExplorerUrls().getNanoContractUrl(poolKey)}
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
