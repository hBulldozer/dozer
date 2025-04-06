import React, { FC, useState, useEffect } from 'react'
import { useBreakpoint, useIsMounted } from '@dozer/hooks'
import { useAccount } from '@dozer/zustand'
import { useWalletConnectClient } from '../contexts'
import { useBridge } from '../contexts/BridgeContext'

interface PercentageButtonsProps {
  onSelect: (percentage: number) => void
  disabled?: boolean
}

const PercentageButtons: FC<PercentageButtonsProps> = ({ onSelect, disabled }) => {
  return (
    <div className="flex items-center gap-2 py-1 text-xs">
      <button
        className="px-2 py-1 transition-colors rounded-lg text-stone-400 hover:text-stone-300 hover:bg-stone-800"
        onClick={() => onSelect(25)}
        disabled={disabled}
      >
        25%
      </button>
      <button
        className="px-2 py-1 transition-colors rounded-lg text-stone-400 hover:text-stone-300 hover:bg-stone-800"
        onClick={() => onSelect(50)}
        disabled={disabled}
      >
        50%
      </button>
      <button
        className="px-2 py-1 transition-colors rounded-lg text-stone-400 hover:text-stone-300 hover:bg-stone-800"
        onClick={() => onSelect(100)}
        disabled={disabled}
      >
        MAX
      </button>
    </div>
  )
}

interface BalancePanelProps {
  id?: string
  onChange: (value: string) => void
  currency: any
  disableMaxButton?: boolean
  hidePercentageButtons?: boolean
  showPercentageButtons?: boolean
  loading?: boolean
  chainId?: number
}

const BalancePanel: FC<BalancePanelProps> = ({
  id,
  onChange,
  currency,
  disableMaxButton,
  hidePercentageButtons,
  showPercentageButtons,
}) => {
  const isMounted = useIsMounted()
  const balance = useAccount((state) => state.balance)
  const [tokenBalance, setTokenBalance] = useState(0)
  const { accounts } = useWalletConnectClient()
  const address = accounts && accounts.length > 0 ? accounts[0].split(':')[2] : ''
  const { isSm } = useBreakpoint('sm')

  // Bridge context for token balances
  const { loadBalances } = useBridge()
  const [arbitrumBalance, setArbitrumBalance] = useState(0)

  useEffect(() => {
    if (currency && balance) {
      const token = balance.find((obj) => {
        return obj.token_uuid === currency.uuid
      })
      setTokenBalance(token && address ? token.token_balance / 100 : 0)
    }

    // Check for Arbitrum balance if it's a bridged token
    if (currency && (currency as any).bridged && (currency as any).originalAddress) {
      const originalAddress = (currency as any).originalAddress
      if (originalAddress) {
        // Load balance for this specific token
        async function fetchBalance() {
          try {
            const balances = await loadBalances([originalAddress])
            if (balances && balances[originalAddress]) {
              setArbitrumBalance(balances[originalAddress])
            }
          } catch (error) {
            console.error('Error loading token balance:', error)
          }
        }

        fetchBalance()
      }
    }
  }, [currency, balance, address, loadBalances])

  const handlePercentageClick = (percentage: number) => {
    const amount = (tokenBalance * percentage) / 100
    onChange(amount.toFixed(2))
  }

  // For desktop: display buttons inline when input is focused
  return (
    <div className="flex flex-row items-end gap-2">
      {!hidePercentageButtons && showPercentageButtons && (
        <PercentageButtons onSelect={handlePercentageClick} disabled={disableMaxButton} />
      )}
      <div className="flex flex-col items-end">
        <button
          data-testid={`${id}-balance-button`}
          type="button"
          onClick={() => onChange(tokenBalance.toFixed(2))}
          className="px-2 py-2 text-xs transition-colors rounded-lg text-stone-400 hover:text-stone-300 hover:bg-stone-800"
          disabled={disableMaxButton}
        >
          {isMounted && balance ? `Balance: ${tokenBalance.toFixed(2)}` : 'Balance: 0'}
        </button>

        {/* Show Arbitrum balance for bridged tokens */}
        {(currency as any)?.bridged && (currency as any)?.originalAddress && arbitrumBalance > 0 && (
          <span className="px-2 py-1 text-xs text-blue-400">
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="inline mr-1"
            >
              <path
                d="M8 0C3.58 0 0 3.58 0 8C0 12.42 3.58 16 8 16C12.42 16 16 12.42 16 8C16 3.58 12.42 0 8 0ZM8 14C4.69 14 2 11.31 2 8C2 4.69 4.69 2 8 2C11.31 2 14 4.69 14 8C14 11.31 11.31 14 8 14Z"
                fill="#60A5FA"
              />
              <path d="M8 3L4 8.5H7V13L11 7.5H8V3Z" fill="#60A5FA" />
            </svg>
            {arbitrumBalance.toFixed(2)}
          </span>
        )}
      </div>
    </div>
  )
}

export default BalancePanel
