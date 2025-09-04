import React from 'react'
import { Typography, Chip } from '@dozer/ui'
import { getCoreRowModel, useReactTable, ColumnDef } from '@tanstack/react-table'
import { formatNumber } from '@dozer/format'
import { TokenTradingTransaction, transformTokenTradingTransactions } from '../utils/tokenTradingUtils'

// Helper function to get explorer URLs based on environment
const getExplorerUrls = () => {
  // Check if we have a local explorer URL configured
  if (process.env.NEXT_PUBLIC_LOCAL_EXPLORER_URL) {
    return {
      baseUrl: process.env.NEXT_PUBLIC_LOCAL_EXPLORER_URL,
      getTransactionUrl: (txHash: string) => `${process.env.NEXT_PUBLIC_LOCAL_EXPLORER_URL}/transaction/${txHash}`,
      getAccountUrl: (address: string) => `${process.env.NEXT_PUBLIC_LOCAL_EXPLORER_URL}/address/${address}`,
    }
  }

  // Fallback to default explorer URLs based on testnet/mainnet
  const isTestnet = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_IS_TESTNET === 'true'
  const baseUrl = isTestnet ? 'https://explorer.testnet.hathor.network' : 'https://explorer.hathor.network'

  return {
    baseUrl,
    getTransactionUrl: (txHash: string) => `${baseUrl}/transaction/${txHash}`,
    getAccountUrl: (address: string) => `${baseUrl}/address/${address}`,
  }
}

// Helper function to truncate address (show only last digits)
const truncateAddress = (address: string): string => {
  if (address.length <= 8) return address
  return `...${address.slice(-8)}`
}

// Helper function to get transaction type color
const getTypeColor = (type: 'Buy' | 'Sell'): 'green' | 'red' => {
  return type === 'Buy' ? 'green' : 'red'
}

// Cell components
const TimeCell: React.FC<{ row: TokenTradingTransaction }> = ({ row }) => {
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

const TypeCell: React.FC<{ row: TokenTradingTransaction }> = ({ row }) => {
  const color = getTypeColor(row.type)
  return <Chip color={color} size="default" label={row.type} className="font-semibold" />
}

const TokenAmountCell: React.FC<{ row: TokenTradingTransaction }> = ({ row }) => (
  <div className="text-center">
    <Typography variant="sm" className="text-stone-200 font-medium">
      {formatNumber(row.tokenAmount)} {row.tokenSymbol}
    </Typography>
  </div>
)

const TotalValueCell: React.FC<{ row: TokenTradingTransaction }> = ({ row }) => (
  <div className="text-center">
    <Typography variant="sm" className="text-stone-200 font-medium">
      {row.totalValue || '-'}
    </Typography>
  </div>
)

const AccountCell: React.FC<{ row: TokenTradingTransaction }> = ({ row }) => {
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

// Column definitions
const createColumns = (): ColumnDef<TokenTradingTransaction, unknown>[] => [
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
    id: 'tokenAmount',
    header: 'AMOUNT',
    accessorFn: (row) => row.tokenAmount,
    cell: (props) => <TokenAmountCell row={props.row.original} />,
    size: 120,
    meta: {
      className: 'text-center',
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

export interface TokenTradingHistoryProps {
  tokenUuid: string
  tokenSymbol: string
  transactions: any[] // Raw complex transactions from API
  pricesUSD?: Record<string, number>
  loading?: boolean
  error?: string
}

export const TokenTradingHistory: React.FC<TokenTradingHistoryProps> = ({
  tokenUuid,
  tokenSymbol,
  transactions,
  pricesUSD = {},
  loading = false,
  error,
}) => {
  // Transform raw transactions to token trading format
  const tokenTradingTransactions = React.useMemo(() => {
    return transformTokenTradingTransactions(transactions, tokenUuid, tokenSymbol, pricesUSD)
  }, [transactions, tokenUuid, tokenSymbol, pricesUSD])

  const columns = React.useMemo(() => createColumns(), [])

  const table = useReactTable({
    data: tokenTradingTransactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (error) {
    return (
      <div className="bg-stone-900 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <Typography variant="lg" weight={600} className="text-stone-100">
            Trading History
          </Typography>
          <Chip color="red" size="sm" label="Error" />
        </div>
        <div className="flex flex-col items-center justify-center h-32">
          <Typography variant="lg" className="text-red-400 mb-2">
            Failed to load trading history
          </Typography>
          <Typography variant="sm" className="text-stone-400 mb-4 text-center max-w-md">
            {error}
          </Typography>
        </div>
      </div>
    )
  }

  // Show only the first 10 transactions
  const displayTransactions = tokenTradingTransactions.slice(0, 10)

  return (
    <div className="bg-stone-900 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-stone-700">
        <div>
          <Typography variant="lg" weight={600} className="text-stone-100">
            Trading History
          </Typography>
          <Typography variant="sm" className="text-stone-400 mt-1">
            Recent activity for {tokenSymbol}
          </Typography>
        </div>
      </div>

      {/* Table */}
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
                <td colSpan={3} className="px-3 py-12 text-center md:hidden">
                  <Typography variant="lg" className="text-stone-400 mb-2">
                    No trading activity
                  </Typography>
                  <Typography variant="sm" className="text-stone-500">
                    Trading activity for {tokenSymbol} will appear here
                  </Typography>
                </td>
                <td colSpan={5} className="px-3 py-12 text-center hidden md:table-cell">
                  <Typography variant="lg" className="text-stone-400 mb-2">
                    No trading activity
                  </Typography>
                  <Typography variant="sm" className="text-stone-500">
                    Trading activity for {tokenSymbol} will appear here
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
                    <TokenAmountCell row={transaction} />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <TotalValueCell row={transaction} />
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
    </div>
  )
}
