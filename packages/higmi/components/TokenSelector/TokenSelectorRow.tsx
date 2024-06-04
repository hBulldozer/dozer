// import { AddressZero } from '@ethersproject/constants'
import { Amount, Type } from '@dozer/currency'
import { FundSource, useInViewport } from '@dozer/hooks'
import { Fraction, ZERO } from '@dozer/math'
import { classNames, Currency, Typography } from '@dozer/ui'
import React, { CSSProperties, FC, memo, useCallback, useRef } from 'react'

interface TokenSelectorRow {
  id: string
  account?: string
  currency: Type
  style?: CSSProperties
  className?: string
  onCurrency(currency: Type): void
  // fundSource: FundSource
  balance?: Amount<Type>
  price?: number
}

const _TokenSelectorRow: FC<TokenSelectorRow> = ({
  id,
  price,
  balance,
  currency,
  // fundSource,
  style,
  className,
  onCurrency,
}) => {
  const onClick = useCallback(() => {
    onCurrency(currency)
  }, [currency, onCurrency])
  const ref = useRef<HTMLDivElement>(null)
  const inViewport = useInViewport(ref)
  return (
    <div
      testdata-id={`${id}-row-${currency.uuid}`}
      onClick={onClick}
      className={classNames(
        className,
        `group flex items-center w-full hover:bg-yellow-700 px-4 h-[48px] token-${currency?.symbol}`
      )}
      style={style}
    >
      <div className="flex items-center justify-between flex-grow gap-2 rounded cursor-pointer">
        <div className="flex flex-row items-center flex-grow gap-2">
          <div className="w-7 h-7">
            <Currency.Icon currency={currency} width={28} height={28} priority={inViewport} />
          </div>
          <div className="flex flex-col items-start">
            <Typography variant="xs" weight={500} className="text-stone-200 group-hover:text-stone-50">
              {currency.symbol}
            </Typography>
            <Typography variant="xxs" className="text-stone-500 group-hover:text-yellow-100">
              {currency.name}
            </Typography>
          </div>
        </div>

        {balance && balance?.greaterThan(ZERO) && (
          <div className="flex flex-col">
            <Typography variant="xs" weight={500} className="text-right text-stone-200">
              {balance?.toFixed(2)}
            </Typography>
            <Typography variant="xxs" className="text-right text-stone-400">
              {price ? `$${(parseFloat(balance?.toFixed(2)) * price).toFixed(2)}` : '-'}
            </Typography>
          </div>
        )}
      </div>
    </div>
  )
}

export const TokenSelectorRow: FC<TokenSelectorRow> = memo(_TokenSelectorRow)
