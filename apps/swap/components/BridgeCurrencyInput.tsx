import { TradeType } from './utils/TradeType'
import { BridgeCurrencyInput as HigmiBridgeCurrencyInput } from '@dozer/higmi/components/Web3Input/BridgeCurrencyInput'
import { BridgeCurrencyInputProps } from '@dozer/higmi/components/Web3Input/BridgeCurrencyInput'
import React, { FC } from 'react'
import { Token } from '@dozer/currency'

interface BridgeCurrencyInputPropsExtended extends BridgeCurrencyInputProps {
  id: string
  inputType: TradeType
  tradeType: TradeType
  prices: { [key: string]: number }
  tokens?: Token[]
  hidePercentageButtons?: boolean
}

export const BridgeCurrencyInput: FC<BridgeCurrencyInputPropsExtended> = ({
  id,
  className,
  value,
  onChange,
  onSelect,
  currency,
  chainId,
  inputType,
  tradeType,
  disabled,
  loading = false,
  prices,
  tokens,
  hidePercentageButtons = false,
}) => {
  return (
    <HigmiBridgeCurrencyInput
      id={id}
      className={className}
      value={value}
      onChange={onChange}
      currency={currency}
      onSelect={onSelect}
      chainId={chainId}
      loading={loading}
      disabled={disabled}
      prices={prices}
      tokens={tokens}
      hidePercentageButtons={hidePercentageButtons}
    />
  )
}