import React, { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../../utils/api'
import { Typography, Chip, TimeAgo, Button, Tooltip, Link } from '@dozer/ui'
import { TransactionHistory as TxHistoryType } from '@dozer/api/src/router/pool'
import Copy, { CopyHelper } from '@dozer/ui/copy/Copy'
import { ArrowTopRightOnSquareIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import dayjs from 'dayjs'
import { Pair } from '@dozer/api'
import { Dots } from '@dozer/ui/dots/Dots'

const TRANSACTIONS_PER_PAGE = 10

interface TransactionHistoryProps {
  pair: Pair
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ pair }) => {
  const [transactions, setTransactions] = useState<any[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasNextPage, setHasNextPage] = useState(true)

  const containerRef = useRef<HTMLDivElement>(null)

  const { data, isLoading, isError, error } = api.getPools.transactionHistory.useQuery(
    { poolKey: pair.id },
    {
      refetchInterval: 30000, // Refetch every 30 seconds to keep the history updated
      enabled: !!pair.id,
    }
  )

  useEffect(() => {
    if (data) {
      setTransactions((prev) => [...prev, ...data])
    }
  }, [data])

  const loadMoreTransactions = useCallback(() => {
    if (hasNextPage && !isLoading) {
      // refetch() // This line is removed as per the edit hint
    }
  }, [hasNextPage, isLoading]) // refetch is removed from dependencies

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMoreTransactions()
        }
      },
      { threshold: 1 }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current)
      }
    }
  }, [loadMoreTransactions])

  if (isError) {
    return (
      <div className="text-red-500">
        <p>Error loading transaction history: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="text-lg font-bold">Transaction History</div>
      <div className="flex flex-col gap-2">
        {data?.map((tx, index) => {
          const token0Action = tx.context.actions.find((a) => a.token_uid === pair.token0.uuid)
          const token1Action = tx.context.actions.find((a) => a.token_uid === pair.token1.uuid)

          return (
            <div key={index} className="flex justify-between p-2 border rounded-lg border-stone-800">
              <div className="flex flex-col">
                <div className="font-bold">{tx.method}</div>
                <div className="text-sm text-stone-400">{new Date(tx.timestamp * 1000).toLocaleString()}</div>
              </div>
              <div className="flex flex-col text-right">
                <div
                  className={`${
                    tx.method === 'swap'
                      ? 'text-blue-400'
                      : tx.method === 'add_liquidity'
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  {token0Action?.amount} {pair.token0.symbol}
                </div>
                <div
                  className={`${
                    tx.method === 'swap'
                      ? 'text-blue-400'
                      : tx.method === 'add_liquidity'
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  {token1Action?.amount} {pair.token1.symbol}
                </div>
              </div>
            </div>
          )
        })}
        {isLoading && <Dots>Loading transactions...</Dots>}
        {!isLoading && data?.length === 0 && <div className="text-center text-stone-400">No transactions found.</div>}
      </div>
    </div>
  )
}

export default TransactionHistory
