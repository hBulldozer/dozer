import React, { useState } from 'react'
import { api } from '../../utils/api'
import { Typography, Chip, TimeAgo, Button, Tooltip, Link } from '@dozer/ui'
import { TransactionHistory as TxHistoryType } from '@dozer/api/src/router/pool'
import Copy, { CopyHelper } from '@dozer/ui/copy/Copy'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import dayjs from 'dayjs'
import { Pair } from '@dozer/api'

interface TransactionHistoryProps {
  pair: Pair
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ pair }) => {
  const [limit, setLimit] = useState(20)

  const { data, isLoading, isError, error } = api.getPools.getPoolTransactionHistory.useQuery(
    { id: pair.id, limit },
    { refetchInterval: 30000 } // Refetch every 30 seconds to keep the history updated
  )

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'swap_tokens_for_exact_tokens':
      case 'swap_exact_tokens_for_tokens':
        return 'Swap'
      case 'add_liquidity':
        return 'Add Liquidity'
      case 'remove_liquidity':
        return 'Remove Liquidity'
      case 'initialize':
        return 'Create Pool'
      default:
        return method
    }
  }

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'swap_tokens_for_exact_tokens':
      case 'swap_exact_tokens_for_tokens':
        return 'text-blue-500'
      case 'add_liquidity':
        return 'text-green-500'
      case 'remove_liquidity':
        return 'text-red-500'
      default:
        return 'text-stone-300'
    }
  }

  const getExplorerUrl = (hash: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://explorer.hathor.network'
    return `${baseUrl}/transaction/${hash}`
  }

  const shortenAddress = (address: string) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatTokenAmount = (amount: number, tokenUid: string) => {
    // Convert from raw units to display units
    const displayAmount = amount / 100
    return displayAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Typography>Loading transaction history...</Typography>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex justify-center p-4">
        <Typography color="error">Error loading transaction history: {error?.message}</Typography>
      </div>
    )
  }

  if (!data || !data.transactions || data.transactions.length === 0) {
    return (
      <div className="flex justify-center p-4">
        <Typography>No transaction history found for this pool.</Typography>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl bg-stone-800/30">
      <Typography variant="xl" className="p-4 pb-2 font-medium">
        Transactions
      </Typography>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="border-b border-stone-700/50">
            <tr className="text-left">
              <th className="px-4 py-3">
                <div className="flex items-center">
                  <Typography variant="sm" className="font-medium text-stone-400">
                    Time
                  </Typography>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="ml-1 text-stone-500"
                  >
                    <path
                      d="M6 9L12 15L18 9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </th>
              <th className="px-4 py-3">
                <Typography variant="sm" className="font-medium text-stone-400">
                  Type
                </Typography>
              </th>
              <th className="px-4 py-3">
                <Typography variant="sm" className="font-medium text-stone-400">
                  {pair.token0.symbol}
                </Typography>
              </th>
              <th className="px-4 py-3">
                <Typography variant="sm" className="font-medium text-stone-400">
                  {pair.token1.symbol}
                </Typography>
              </th>
              <th className="px-4 py-3">
                <Typography variant="sm" className="font-medium text-stone-400">
                  Account
                </Typography>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.transactions.map((tx: TxHistoryType, index) => {
              // Process actions to find token values
              const tokenActions = tx.context?.actions || []

              // Try to categorize by token_uid
              let token0Action = null
              let token1Action = null

              if (tokenActions.length > 0) {
                // Get the first non-HTR token for token0
                token0Action = tokenActions.find((a) => a.token_uid && a.token_uid !== '00')

                // Get the HTR token for token1
                token1Action = tokenActions.find((a) => a.token_uid === '00')

                // Fallbacks if specific categorization fails
                if (!token0Action && !token1Action && tokenActions.length === 1) {
                  token0Action = tokenActions[0]
                } else if (!token0Action && tokenActions.length > 0) {
                  token0Action = tokenActions[0]
                } else if (!token1Action && tokenActions.length > 1) {
                  token1Action = tokenActions[1]
                }
              }

              const date = new Date(tx.timestamp * 1000)
              const formattedDate = dayjs(date).format('MM/DD/YY, hh:mma').toLowerCase()

              return (
                <tr key={tx.hash} className="transition-colors border-b border-stone-700/50 hover:bg-stone-800/50">
                  <td className="px-4 py-4">
                    <div className="relative group">
                      <div className="flex items-center gap-1">
                        <Typography variant="xs">
                          <TimeAgo date={date} />
                        </Typography>
                        <Link.External
                          href={getExplorerUrl(tx.hash)}
                          className="transition-opacity opacity-0 group-hover:opacity-100"
                        >
                          <ArrowTopRightOnSquareIcon
                            width={16}
                            height={16}
                            className="text-stone-400 hover:text-yellow-400"
                          />
                        </Link.External>
                      </div>
                      <div className="absolute left-0 z-10 px-3 py-2 text-xs transition-opacity rounded-md shadow-md opacity-0 -top-9 bg-stone-900 text-stone-300 group-hover:opacity-100 whitespace-nowrap">
                        {formattedDate}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <Typography variant="xs" className={`font-medium ${getMethodColor(tx.method)}`}>
                      {getMethodLabel(tx.method)}
                    </Typography>
                  </td>
                  <td className="px-4 py-4">
                    {token0Action && (
                      <Typography variant="xs" className="font-medium whitespace-nowrap">
                        {token0Action.type === 'deposit' ? '+' : '-'}
                        {formatTokenAmount(token0Action.amount, token0Action.token_uid)}
                      </Typography>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {token1Action && (
                      <Typography variant="xs" className="font-medium whitespace-nowrap">
                        {token1Action.type === 'deposit' ? '+' : '-'}
                        {formatTokenAmount(token1Action.amount, token1Action.token_uid)}
                      </Typography>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <Typography variant="xs" className="whitespace-nowrap text-stone-400">
                        {shortenAddress(tx.context?.address || '')}
                      </Typography>
                      {tx.context?.address && (
                        <CopyHelper toCopy={tx.context.address} className="opacity-50 hover:opacity-100" />
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {data.hasMore && (
        <div className="flex justify-center p-4">
          <Button
            variant="outlined"
            onClick={() => setLimit((prev) => prev + 20)}
            className="w-full border-none bg-stone-800/30 hover:bg-stone-700/50 text-stone-300"
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  )
}

export default TransactionHistory
