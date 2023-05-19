import { TradeType } from './utils/TradeType'
import { Web3Input } from '@dozer/higmi'
import { CurrencyInputProps } from '@dozer/higmi/components/Web3Input/Currency'
import React, { FC, useMemo } from 'react'
import { useTrade } from '@dozer/zustand'
import { Token } from '@dozer/currency'

// import { useTrade } from '../utils/TradeProvider'

interface CurrencyInput extends CurrencyInputProps {
  id: string
  inputType: TradeType
  tradeType: TradeType
  prices: { [key: string]: number | undefined }
  tokens?: Token[]
  // isWrap?: boolean
}

export const CurrencyInput: FC<CurrencyInput> = ({
  id,
  className,
  value: _value,
  onChange,
  onSelect,
  currency,
  // customTokenMap,
  // tokenMap,
  // onAddToken,
  // onRemoveToken,
  chainId,
  inputType,
  tradeType,
  disabled,
  loading = false,
  prices,
  tokens,
  // isWrap = false,
}) => {
  const trade = useTrade()

  // If output field and (un)wrapping, set to _value
  let value = inputType === tradeType ? _value.toString() : trade ? trade?.outputAmount?.toFixed(2).toString() : ''
  value = value ? value : ''
  // const value = _value
  // // Usd pct change
  const srcTokenPrice = trade?.mainCurrency ? prices?.[trade.mainCurrency.uuid] : undefined
  const dstTokenPrice = trade?.otherCurrency ? prices?.[trade.otherCurrency.uuid] : undefined
  const usdPctChange = useMemo(() => {
    const inputUSD = trade?.amountSpecified && srcTokenPrice ? trade.amountSpecified * srcTokenPrice : undefined
    const outputUSD = trade?.outputAmount && dstTokenPrice ? trade.outputAmount * dstTokenPrice : undefined
    return inputUSD && outputUSD && inputUSD > 0 ? ((outputUSD - inputUSD) / inputUSD) * 100 : undefined
  }, [dstTokenPrice, srcTokenPrice, trade?.amountSpecified, trade?.outputAmount])

  return (
    <Web3Input.Currency
      id={id}
      className={className}
      value={value}
      onChange={onChange}
      currency={currency}
      onSelect={onSelect}
      // customTokenMap={customTokenMap}
      // onAddToken={onAddToken}
      // onRemoveToken={onRemoveToken}
      chainId={chainId}
      // tokenMap={tokenMap}
      loading={loading}
      disabled={disabled}
      usdPctChange={inputType === TradeType.EXACT_OUTPUT ? usdPctChange : undefined}
      prices={prices}
      tokens={tokens}
    />
  )
}
