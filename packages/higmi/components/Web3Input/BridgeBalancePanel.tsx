import React, { FC, useState, useEffect } from 'react'
import { useBreakpoint, useIsMounted } from '@dozer/hooks'
import { Typography } from '@dozer/ui'
import { Token } from '@dozer/currency'
import { useBridge } from '../contexts/BridgeContext'
import { useSDK } from '@metamask/sdk-react'

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

interface BridgeBalancePanelProps {
  id?: string
  onChange: (value: string) => void
  currency: Token | undefined
  disableMaxButton?: boolean
  hidePercentageButtons?: boolean
  showPercentageButtons?: boolean
  loading?: boolean
  chainId?: number
}

const BridgeBalancePanel: FC<BridgeBalancePanelProps> = ({
  id,
  onChange,
  currency,
  disableMaxButton,
  hidePercentageButtons,
  showPercentageButtons,
}) => {
  const isMounted = useIsMounted()
  const [evmTokenBalance, setEvmTokenBalance] = useState(0)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const { isSm } = useBreakpoint('sm')
  const { connected: metaMaskConnected } = useSDK()

  // Bridge context for EVM token balances
  const { loadBalances } = useBridge()

  // Load EVM token balance when currency changes
  useEffect(() => {
    const loadEvmBalance = async () => {
      if (!currency?.originalAddress || !metaMaskConnected) {
        setEvmTokenBalance(0)
        return
      }

      setIsLoadingBalance(true)
      try {
        const balances = await loadBalances([currency.originalAddress])
        const balance = balances?.[currency.originalAddress] || 0
        setEvmTokenBalance(balance)
      } catch (error) {
        console.error('Error loading EVM balance for bridge:', error)
        setEvmTokenBalance(0)
      } finally {
        setIsLoadingBalance(false)
      }
    }

    loadEvmBalance()
  }, [currency?.originalAddress, metaMaskConnected, loadBalances])

  const handlePercentageClick = (percentage: number) => {
    const amount = (evmTokenBalance * percentage) / 100
    onChange(amount.toFixed(2))
  }

  const handleMaxClick = () => {
    onChange(evmTokenBalance.toFixed(2))
  }

  // For desktop: display buttons inline when input is focused
  return (
    <div className="flex flex-row items-end gap-2">
      {!hidePercentageButtons && showPercentageButtons && (
        <PercentageButtons onSelect={handlePercentageClick} disabled={disableMaxButton || isLoadingBalance} />
      )}
      <div className="flex flex-row items-end">
        <button
          data-testid={`${id}-balance-button`}
          type="button"
          onClick={handleMaxClick}
          className="px-2 py-2 text-xs transition-colors rounded-lg text-stone-400 hover:text-stone-300 hover:bg-stone-800"
          disabled={disableMaxButton || isLoadingBalance}
        >
          {isLoadingBalance ? (
            'Loading...'
          ) : isMounted && metaMaskConnected ? (
            `EVM Balance: ${evmTokenBalance.toFixed(4)}`
          ) : (
            'EVM Balance: 0'
          )}
        </button>
      </div>
    </div>
  )
}

export default BridgeBalancePanel