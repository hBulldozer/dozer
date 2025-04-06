import React, { FC, useEffect, useState } from 'react'
import { useBridge } from '@dozer/higmi'
import { Token } from '@dozer/currency'
import { useSDK } from '@metamask/sdk-react'

interface ArbitrumBalanceProps {
  token: Token | undefined
  className?: string
}

export const ArbitrumBalance: FC<ArbitrumBalanceProps> = ({ token, className = '' }) => {
  const { loadBalances } = useBridge()
  const { connected: metaMaskConnected } = useSDK()
  const [loading, setLoading] = useState(false)
  const [balance, setBalance] = useState(0)

  useEffect(() => {
    if (token?.bridged && metaMaskConnected && token.originalAddress) {
      setLoading(true)
      // Load the token balance from Arbitrum
      loadBalances([token.originalAddress])
        .then((balances) => {
          if (balances && token.originalAddress && balances[token.originalAddress]) {
            setBalance(balances[token.originalAddress])
          }
        })
        .finally(() => setLoading(false))
    }
  }, [token, metaMaskConnected, loadBalances])

  // If not a bridged token or not connected to Arbitrum, don't show anything
  if (!token?.bridged || !metaMaskConnected) {
    return null
  }

  return (
    <div className={`flex items-center gap-1 text-xs text-blue-400 ${className}`}>
      <span className="flex items-center">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
          <path
            d="M8 0C3.58 0 0 3.58 0 8C0 12.42 3.58 16 8 16C12.42 16 16 12.42 16 8C16 3.58 12.42 0 8 0ZM8 14C4.69 14 2 11.31 2 8C2 4.69 4.69 2 8 2C11.31 2 14 4.69 14 8C14 11.31 11.31 14 8 14Z"
            fill="#60A5FA"
          />
          <path d="M8 3L4 8.5H7V13L11 7.5H8V3Z" fill="#60A5FA" />
        </svg>
        {loading ? <span>Loading...</span> : <span>Arbitrum: {balance.toFixed(2)}</span>}
      </span>
    </div>
  )
}
