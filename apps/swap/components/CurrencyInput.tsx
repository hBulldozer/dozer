import { TradeType } from './utils/TradeType'
import { ZERO } from '@dozer/math'
import { usePrices, Web3Input } from '@dozer/higmi'
import { CurrencyInputProps } from '@dozer/higmi/components/Web3Input/Currency'
import React, { FC, useMemo } from 'react'

import { useTrade } from './TradeProvider'

interface CurrencyInput extends CurrencyInputProps {
  id: string
  inputType: TradeType
  tradeType: TradeType
  // isWrap?: boolean
}

export const CurrencyInput: FC<CurrencyInput> = ({
  id,
  className,
  value: _value,
  onChange,
  onSelect,
  currency,
  customTokenMap,
  tokenMap,
  onAddToken,
  onRemoveToken,
  chainId,
  inputType,
  tradeType,
  disabled,
  loading = false,
  // isWrap = false,
}) => {
  const { trade } = {  }
  const { data: prices } = usePrices({ chainId })

  // If output field and (un)wrapping, set to _value
  let value = inputType === tradeType ? _value : trade ? trade?.outputAmount?.toExact() : ''
  value = inputType === TradeType.EXACT_OUTPUT ? _value : value

  // Usd pct change
  const srcTokenPrice = trade?.inputAmount.currency ? prices?.[trade.inputAmount.currency.wrapped.address] : undefined
  const dstTokenPrice = trade?.outputAmount.currency ? prices?.[trade.outputAmount.currency.wrapped.address] : undefined
  const usdPctChange = useMemo(() => {
    const inputUSD =
      trade?.inputAmount && srcTokenPrice ? trade.inputAmount.multiply(srcTokenPrice.asFraction) : undefined
    const outputUSD =
      trade?.outputAmount && dstTokenPrice ? trade.outputAmount.multiply(dstTokenPrice.asFraction) : undefined
    return inputUSD && outputUSD && inputUSD?.greaterThan(ZERO)
      ? ((Number(outputUSD?.toExact()) - Number(inputUSD?.toExact())) / Number(inputUSD?.toExact())) * 100
      : undefined
  }, [dstTokenPrice, srcTokenPrice, trade?.inputAmount, trade?.outputAmount])

  return (
    <Web3Input.Currency
      id={id}
      className={className}
      value={value}
      onChange={onChange}
      currency={currency}
      onSelect={onSelect}
      customTokenMap={customTokenMap}
      onAddToken={onAddToken}
      onRemoveToken={onRemoveToken}
      chainId={chainId}
      tokenMap={tokenMap}
      loading={loading}
      disabled={disabled}
      // usdPctChange={inputType === TradeType.EXACT_OUTPUT ? usdPctChange : undefined}
    />
  )
}
