import React, { useState } from 'react'
import { api } from '../../utils/api'
import { Typography, Chip, TimeAgo, Button, Tooltip, Link } from '@dozer/ui'
import { TransactionHistory as TxHistoryType } from '@dozer/api/src/router/pool'
import Copy, { CopyHelper } from '@dozer/ui/copy/Copy'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'

interface TransactionHistoryProps {
  poolId: string
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ poolId }) => {
  const [limit, setLimit] = useState(10)

  const { data, isLoading, isError, error } = api.getPools.getPoolTransactionHistory.useQuery(
    { id: poolId, limit },
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
        return 'primary'
      case 'add_liquidity':
        return 'success'
      case 'remove_liquidity':
        return 'warning'
      case 'initialize':
        return 'info'
      default:
        return 'default'
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
    <div className="p-4 overflow-hidden rounded-xl bg-stone-800/50">
      <Typography className="mb-4">Transaction History</Typography>

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr className="text-left">
              <th className="pt-2 pb-2 pl-2 pr-2">
                <Typography color="secondary">Type</Typography>
              </th>
              <th className="pt-2 pb-2 pl-2 pr-2">
                <Typography color="secondary">Value</Typography>
              </th>
              <th className="pt-2 pb-2 pl-2 pr-2">
                <Typography color="secondary">Address</Typography>
              </th>
              <th className="pt-2 pb-2 pl-2 pr-2">
                <Typography color="secondary">Time</Typography>
              </th>
              <th className="pt-2 pb-2 pl-2 pr-2">
                <Typography color="secondary">Tx Hash</Typography>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.transactions.map((tx: TxHistoryType, index) => (
              <tr key={tx.hash} className={index % 2 === 0 ? 'bg-stone-800/20' : ''}>
                <td className="px-2 py-2">
                  <Chip
                    label={getMethodLabel(tx.method)}
                    color={getMethodColor(tx.method) as any}
                    className="whitespace-nowrap"
                  />
                </td>
                <td className="px-2 py-2">
                  <div className="flex flex-col gap-1">
                    {tx.context?.actions?.map((action, aIndex) => (
                      <div key={aIndex} className="flex items-center gap-1">
                        <Typography className="whitespace-nowrap">
                          {action.type === 'deposit' ? '+' : '-'}
                          {formatTokenAmount(action.amount, action.token_uid)}{' '}
                          <span className="text-xs">
                            {action.token_uid === '00' ? 'HTR' : action.token_uid.substring(0, 6)}
                          </span>
                        </Typography>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-1">
                    <Typography className="whitespace-nowrap">{shortenAddress(tx.context?.address || '')}</Typography>
                    {tx.context?.address && (
                      <CopyHelper toCopy={tx.context.address} className="opacity-50 hover:opacity-100" />
                    )}
                  </div>
                </td>
                <td className="px-2 py-2">
                  {/* <Tooltip content={new Date(tx.timestamp * 1000).toLocaleString()}>
                    <TimeAgo date={new Date(tx.timestamp * 1000)} />
                  </Tooltip> */}
                </td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-1">
                    <Typography className="whitespace-nowrap">{tx.hash.substring(0, 8)}...</Typography>
                    <CopyHelper toCopy={tx.hash} className="opacity-50 hover:opacity-100" />
                    <Link.External className="flex flex-col !no-underline group" href={getExplorerUrl(tx.hash)}>
                      <ArrowTopRightOnSquareIcon
                        width={20}
                        height={20}
                        className="text-stone-400 group-hover:text-yellow-400"
                      />
                    </Link.External>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.hasMore && (
        <div className="flex justify-center mt-4">
          <Button variant="outlined" onClick={() => setLimit((prev) => prev + 10)} className="w-full">
            Load More
          </Button>
        </div>
      )}
    </div>
  )
}

export default TransactionHistory
