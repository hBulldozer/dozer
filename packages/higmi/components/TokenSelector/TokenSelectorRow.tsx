import { Amount, Type } from '@dozer/currency'
import { useInViewport } from '@dozer/hooks'
import { ZERO } from '@dozer/math'
import { classNames, Currency, Typography } from '@dozer/ui'
import React, { CSSProperties, FC, memo, useCallback, useRef } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'

interface TokenSelectorRow {
  id: string
  account?: string
  currency: Type
  style?: CSSProperties
  className?: string
  onCurrency(currency: Type): void
  balance?: Amount<Type>
  price?: number
  isCreateToken?: boolean
}

const _TokenSelectorRow: FC<TokenSelectorRow> = ({
  id,
  price,
  balance,
  currency,
  style,
  className,
  onCurrency,
  isCreateToken = false,
}) => {
  const onClick = useCallback(() => {
    onCurrency(currency)
  }, [currency, onCurrency])
  const ref = useRef<HTMLDivElement>(null)
  const inViewport = useInViewport(ref)

  if (isCreateToken) {
    return (
      <div
        ref={ref}
        onClick={onClick}
        className={classNames(
          className,
          'group flex items-center w-full hover:bg-yellow-700 px-4 h-[56px] cursor-pointer border-t border-stone-700'
        )}
        style={style}
      >
        <div className="flex items-center justify-between flex-grow gap-2 rounded">
          <div className="flex flex-row items-center flex-grow gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-yellow-600 rounded-full">
              <PlusIcon className="w-5 h-5 text-stone-800" />
            </div>
            <div className="flex flex-col items-start">
              <Typography variant="sm" weight={600} className="text-yellow-500 group-hover:text-yellow-300">
                Create Token
              </Typography>
              <Typography variant="xxs" className="text-stone-400 group-hover:text-stone-300">
                Launch your own token
              </Typography>
            </div>
          </div>
          <PlusIcon className="w-5 h-5 text-yellow-500 group-hover:text-yellow-300" />
        </div>
      </div>
    )
  }

  return (
    <div
      ref={ref}
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

export const TokenSelectorRow = memo(_TokenSelectorRow)
