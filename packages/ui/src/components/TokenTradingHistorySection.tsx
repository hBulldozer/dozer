import React from 'react'
import { TokenTradingHistory } from './TokenTradingHistory'

interface TokenTradingHistorySectionProps {
  tokenUuid: string
  tokenSymbol: string
  transactions: any[]
  pricesUSD?: Record<string, number>
  loading?: boolean
  error?: string
  names?: Record<string, string | null>
}

export const TokenTradingHistorySection: React.FC<TokenTradingHistorySectionProps> = ({
  tokenUuid,
  tokenSymbol,
  transactions,
  pricesUSD = {},
  loading = false,
  error,
  names,
}) => {
  return (
    <div className="flex flex-col gap-4">
      <TokenTradingHistory
        tokenUuid={tokenUuid}
        tokenSymbol={tokenSymbol}
        transactions={transactions}
        pricesUSD={pricesUSD}
        loading={loading}
        error={error}
        names={names}
      />
    </div>
  )
}
