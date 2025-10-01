import React, { FC, useState, useEffect } from 'react'
import { useBreakpoint, useIsMounted } from '@dozer/hooks'
import { useAccount } from '@dozer/zustand'
import { useWalletConnectClient } from '../contexts'
import { useBridge } from '../contexts/BridgeContext'
import { Typography } from '@dozer/ui'

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
  const { walletType, hathorAddress } = useAccount()
  
  // Get the appropriate address based on wallet type
  const address = walletType === 'walletconnect' 
    ? (accounts.length > 0 ? accounts[0].split(':')[2] : '') 
    : hathorAddress || ''
  
  const { isSm } = useBreakpoint('sm')

  // Bridge context for token balances
  const { loadBalances } = useBridge()

  useEffect(() => {
    if (currency && balance) {
      const token = balance.find((obj) => {
        return obj.token_uuid === currency.uuid
      })
      setTokenBalance(token && address ? token.token_balance / 100 : 0)
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
      <div className="flex flex-row items-end">
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
    </div>
  )
}

export default BalancePanel
