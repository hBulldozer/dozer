import React, { FC, useState, useEffect } from 'react'
import { useBreakpoint, useIsMounted } from '@dozer/hooks'
import { useAccount } from '@dozer/zustand'
import { useWalletConnectClient } from '../contexts'

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

  useEffect(() => {
    if (currency && balance) {
      const token = balance.find((obj) => {
        return obj.token_uuid === currency.uuid
      })
      setTokenBalance(token && address ? token.token_balance / 100 : 0)
    }
  }, [currency, balance, address])

  const handlePercentageClick = (percentage: number) => {
    const amount = (tokenBalance * percentage) / 100
    onChange(amount.toFixed(2))
  }

  // For mobile: display buttons in a fixed position at bottom
  if (!isSm && !hidePercentageButtons && showPercentageButtons) {
    return (
      <>
        <button
          data-testid={`${id}-balance-button`}
          type="button"
          onClick={() => onChange(tokenBalance.toFixed(2))}
          className="px-2 py-2 text-xs transition-colors rounded-lg text-stone-400 hover:text-stone-300 hover:bg-stone-800"
          disabled={disableMaxButton}
        >
          {isMounted && balance ? `Balance: ${tokenBalance.toFixed(2)}` : 'Balance: 0'}
        </button>
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 border-t bg-stone-800 border-stone-700">
          <PercentageButtons onSelect={handlePercentageClick} disabled={disableMaxButton} />
        </div>
      </>
    )
  }

  // For desktop: display buttons inline when input is focused
  return (
    <div className="flex flex-row items-end gap-2">
      {!hidePercentageButtons && showPercentageButtons && (
        <PercentageButtons onSelect={handlePercentageClick} disabled={disableMaxButton} />
      )}
      <button
        data-testid={`${id}-balance-button`}
        type="button"
        onClick={() => onChange(tokenBalance.toFixed(2))}
        className="px-2 py-2 text-xs transition-colors rounded-lg text-stone-400 hover:text-stone-300 hover:bg-stone-800"
        disabled={disableMaxButton}
      >
        {isMounted && balance ? `Balance: ${tokenBalance.toFixed(2)}` : 'Balance: 0'}
      </button>
    </div>
  )
}

export default BalancePanel
