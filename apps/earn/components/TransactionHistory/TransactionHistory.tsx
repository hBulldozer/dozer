import React, { useState, useEffect, useRef } from 'react'
import { api } from '../../utils/api'
import { Typography, Chip, TimeAgo, Button, Tooltip, Link } from '@dozer/ui'
import { TransactionHistory as TxHistoryType } from '@dozer/api/src/router/pool'
import Copy, { CopyHelper } from '@dozer/ui/copy/Copy'
import { ArrowTopRightOnSquareIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import dayjs from 'dayjs'
import { Pair } from '@dozer/api'

interface TransactionHistoryProps {
  pair: Pair
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ pair }) => {
  // Constants
  const MAX_TRANSACTIONS = 100
  const TRANSACTIONS_PER_PAGE = 20

  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [allTransactions, setAllTransactions] = useState<TxHistoryType[]>([])
  const [isFetching, setIsFetching] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data, isLoading, isError, error, refetch } = api.getPools.getPoolTransactionHistory.useQuery(
    { id: pair.id, limit: TRANSACTIONS_PER_PAGE, cursor },
    {
      refetchInterval: 30000, // Refetch every 30 seconds to keep the history updated
      // Don't refetch when window is hidden
      refetchIntervalInBackground: false,
      // Only fetch when component mounts or cursor changes
      enabled: true,
      // Don't refetch on window focus
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        if (data) {
          setAllTransactions((prev) => {
            const newTransactions = cursor ? [...prev, ...data.transactions] : data.transactions
            return newTransactions.slice(0, MAX_TRANSACTIONS) // Limit to MAX_TRANSACTIONS
          })
          setIsFetching(false)
        }
      },
    }
  )

  // Initial load effect
  useEffect(() => {
    if (data?.transactions && !cursor) {
      setAllTransactions(data.transactions.slice(0, MAX_TRANSACTIONS))
    }
  }, [data?.transactions, cursor])

  // Scroll handling for infinite loading
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      // Load more when scrolled near the bottom (50px threshold)
      if (
        scrollHeight - scrollTop - clientHeight < 50 &&
        data?.hasMore &&
        !isFetching &&
        allTransactions.length < MAX_TRANSACTIONS
      ) {
        loadMoreTransactions()
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [data?.hasMore, isFetching, allTransactions.length])

  // Load more transaction handler
  const loadMoreTransactions = () => {
    if (data?.nextCursor && !isFetching && allTransactions.length < MAX_TRANSACTIONS) {
      setIsFetching(true)
      setCursor(data.nextCursor)
    }
  }

  // Function to refresh the transaction history
  const refreshTransactions = () => {
    setCursor(undefined)
    setAllTransactions([])
    refetch()
  }

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

  if (!allTransactions.length && isLoading) {
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

  if (!allTransactions.length && !isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Typography>No transaction history found for this pool.</Typography>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden shadow-md rounded-xl bg-stone-800/30 shadow-black/20">
      <div className="sticky top-0 z-20 flex items-center justify-between p-4 pb-2 bg-stone-800/95 backdrop-blur-sm">
        <Typography variant="xl" className="font-medium">
          Transactions
        </Typography>
        <Button
          variant="empty"
          onClick={refreshTransactions}
          className="!p-1 hover:bg-stone-700/30 rounded-full"
          title="Refresh transaction history"
        >
          <ArrowPathIcon width={20} height={20} className="text-stone-400 hover:text-stone-200" />
        </Button>
      </div>

      <div
        ref={containerRef}
        className="overflow-y-auto overflow-x-clip max-h-[300px] md:max-h-[400px] touch-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] "
        style={{ WebkitOverflowScrolling: 'auto' }}
      >
        <table className="w-full border-collapse min-w-[450px] sm:min-w-full">
          <colgroup>
            <col className="w-1/4" />
            <col className="w-[15%]" /> {/* Smaller type column */}
            <col className="hidden md:table-col" />
            <col className="hidden md:table-col" />
            <col className="w-auto" />
          </colgroup>
          <thead className="border-b border-stone-700/50">
            <tr className="text-left">
              <th className="sticky top-0 z-10 px-4 py-3 bg-stone-800/95 backdrop-blur-sm">
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
              <th className="sticky top-0 z-10 px-4 py-3 bg-stone-800/95 backdrop-blur-sm">
                <Typography variant="sm" className="font-medium text-stone-400">
                  Type
                </Typography>
              </th>
              <th className="sticky top-0 z-10 hidden px-4 py-3 bg-stone-800/95 backdrop-blur-sm md:table-cell">
                <Typography variant="sm" className="font-medium text-stone-400">
                  {pair.token0.symbol}
                </Typography>
              </th>
              <th className="sticky top-0 z-10 hidden px-4 py-3 bg-stone-800/95 backdrop-blur-sm md:table-cell">
                <Typography variant="sm" className="font-medium text-stone-400">
                  {pair.token1.symbol}
                </Typography>
              </th>
              <th className="sticky top-0 z-10 hidden px-4 py-3 md:table-cell bg-stone-800/95 backdrop-blur-sm">
                <Typography variant="sm" className="font-medium text-stone-400">
                  Account
                </Typography>
              </th>
              <th className="sticky top-0 z-10 px-4 py-3 md:hidden w-fit bg-stone-800/95 backdrop-blur-sm">
                <Typography variant="sm" className="font-medium text-stone-400">
                  Account / Actions
                </Typography>
              </th>
            </tr>
          </thead>
          <tbody>
            {allTransactions.map((tx: TxHistoryType, index) => {
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
                        <Typography variant="xs" className="flex items-center">
                          <TimeAgo date={date} />
                          <Link.External
                            href={getExplorerUrl(tx.hash)}
                            className="ml-1 transition-opacity opacity-0 group-hover:opacity-100"
                          >
                            <ArrowTopRightOnSquareIcon
                              width={16}
                              height={16}
                              className="text-stone-400 hover:text-yellow-400"
                            />
                          </Link.External>
                        </Typography>
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
                  <td className="hidden px-4 py-4 md:table-cell">
                    {token0Action && (
                      <Typography variant="xs" className="font-medium whitespace-nowrap">
                        {token0Action.type === 'deposit' ? '+' : '-'}
                        {formatTokenAmount(token0Action.amount, token0Action.token_uid)}
                      </Typography>
                    )}
                  </td>
                  <td className="hidden px-4 py-4 md:table-cell">
                    {token1Action && (
                      <Typography variant="xs" className="font-medium whitespace-nowrap">
                        {token1Action.type === 'deposit' ? '+' : '-'}
                        {formatTokenAmount(token1Action.amount, token1Action.token_uid)}
                      </Typography>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-row items-center gap-1">
                      <Typography variant="xs" className="whitespace-nowrap text-stone-400">
                        {shortenAddress(tx.context?.address || '')}
                      </Typography>
                      {tx.context?.address && (
                        <CopyHelper toCopy={tx.context.address} className="ml-1 opacity-50 hover:opacity-100" />
                      )}
                    </div>
                    {/* Mobile-only token amounts - vertically stacked */}
                    <div className="flex flex-col gap-2 mt-1 w-fit md:hidden">
                      <div className="flex flex-col gap-1">
                        {token0Action && (
                          <div className="px-2 py-1 rounded-md bg-stone-800/50">
                            <Typography variant="xs" className="font-medium">
                              <span className="mr-1 text-stone-400">{pair.token0.symbol}:</span>
                              <span className={token0Action.type === 'deposit' ? 'text-green-500' : 'text-red-500'}>
                                {token0Action.type === 'deposit' ? '+' : '-'}
                                {formatTokenAmount(token0Action.amount, token0Action.token_uid)}
                              </span>
                            </Typography>
                          </div>
                        )}
                        {token1Action && (
                          <div className="px-2 py-1 mt-1 rounded-md bg-stone-800/50">
                            <Typography variant="xs" className="font-medium">
                              <span className="mr-1 text-stone-400">{pair.token1.symbol}:</span>
                              <span className={token1Action.type === 'deposit' ? 'text-green-500' : 'text-red-500'}>
                                {token1Action.type === 'deposit' ? '+' : '-'}
                                {formatTokenAmount(token1Action.amount, token1Action.token_uid)}
                              </span>
                            </Typography>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Loading indicator at the bottom of the scrollable area */}
      {isFetching && data?.hasMore && (
        <div className="flex items-center justify-center p-2 border-t bg-stone-800/30 border-stone-700/30">
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <ArrowPathIcon className="w-3 h-3 animate-spin" />
            <span>Loading more transactions...</span>
          </div>
        </div>
      )}

      {/* Show message when reached transaction limit */}
      {allTransactions.length >= MAX_TRANSACTIONS && data?.hasMore && (
        <div className="p-2 text-xs text-center border-t text-stone-400 border-stone-700/30">
          Showing the most recent {MAX_TRANSACTIONS} transactions
        </div>
      )}
    </div>
  )
}

export default TransactionHistory
