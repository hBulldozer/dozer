import { ChevronDownIcon } from '@heroicons/react/24/solid'
import { Token } from '@dozer/currency'
import { useIsMounted } from '@dozer/hooks'
import { classNames, Currency as UICurrency, DEFAULT_INPUT_UNSTYLED, Input, Skeleton, Typography } from '@dozer/ui'
import { FC, useCallback, useMemo, useRef, useState, useEffect } from 'react'
import { AccountState, useAccount } from '@dozer/zustand'

import { TokenSelector, TokenSelectorProps } from '../TokenSelector'
import BalancePanel from './BalancePanel'

export interface CurrencyInputProps extends Pick<TokenSelectorProps, 'onSelect' | 'chainId'> {
  id?: string
  value: string
  disabled?: boolean
  onChange(value: string): void
  currency: Token | undefined
  usdPctChange?: number
  disableMaxButton?: boolean
  className?: string
  // fundSource?: FundSource
  loading?: boolean
  includeNative?: boolean
  prices?: { [key: string]: number }
  tokens?: Token[]
  hidePercentageButtons?: boolean
}

export const CurrencyInput: FC<CurrencyInputProps> = ({
  id,
  disabled,
  value,
  onChange,
  currency,
  onSelect,
  // onAddToken,
  // onRemoveToken,
  chainId,
  // tokenMap,
  // customTokenMap,
  disableMaxButton = false,
  usdPctChange,
  className,
  // fundSource = FundSource.WALLET,
  includeNative = true,
  loading,
  prices,
  tokens,
  hidePercentageButtons = false,
}) => {
  const isMounted = useIsMounted()
  const [tokenSelectorOpen, setTokenSelectorOpen] = useState(false)

  const [isInputFocused, setIsInputFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleInputFocus = () => {
    setIsInputFocused(true)
  }

  const handleInputBlur = () => {
    // Add a small delay to keep the buttons visible briefly after blur
    setTimeout(() => {
      setIsInputFocused(false)
    }, 200)
  }

  const focusInput = useCallback(() => {
    if (disabled) return
    inputRef.current?.focus()
  }, [disabled])

  const handleClose = useCallback(() => {
    setTokenSelectorOpen(false)
  }, [])

  return useMemo(
    () => (
      <div className={className} onClick={focusInput}>
        <div className="relative flex items-center gap-1">
          {loading && isMounted ? (
            <div className="flex flex-col gap-1 justify-center flex-grow h-[44px]">
              <Skeleton.Box className="w-[120px] h-[22px] bg-white/[0.06] rounded-full" />
            </div>
          ) : (
            <Input.Numeric
              testdata-id={`${id}-input`}
              ref={inputRef}
              variant="unstyled"
              disabled={disabled}
              onUserInput={onChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              className={classNames(DEFAULT_INPUT_UNSTYLED, '!text-3xl py-1 text-stone-200 hover:text-stone-100')}
              value={value}
              readOnly={disabled}
            />
          )}
          <button
            {...(onSelect && {
              onClick: (e) => {
                setTokenSelectorOpen(true)
                e.stopPropagation()
              },
            })}
            data-testid={`${id}-button`}
            className={classNames(
              onSelect ? 'shadow-md hover:ring-2' : 'cursor-default text-2xl',
              onSelect ? 'bg-white bg-opacity-[0.12]' : '',
              'ring-stone-500',
              'h-[36px] text-stone-200 hover:text-stone-100 transition-all flex flex-row items-center gap-1 text-xl font-semibold rounded-full px-2 py-1'
            )}
          >
            {loading && !currency ? (
              <div className="flex gap-1">
                <Skeleton.Circle radius={20} className="bg-white/[0.06]" />
                <Skeleton.Box className="w-[60px] h-[20px] bg-white/[0.06]" />
              </div>
            ) : currency ? (
              <>
                <div className="w-5 h-5">
                  <UICurrency.Icon
                    // disableLink
                    // layout="responsive"
                    currency={currency}
                    width={20}
                    height={20}
                    priority
                  />
                </div>
                <div className="ml-0.5 -mr-0.5">{currency.symbol}</div>
              </>
            ) : (
              <div className="ml-0.5 -mr-0.5 pl-1">Select</div>
            )}
            {onSelect && (
              <div className="w-5 h-5">
                <ChevronDownIcon width={20} height={20} />
              </div>
            )}
          </button>
        </div>
        <div className="flex flex-row justify-between h-[24px]">
          <PricePanel
            prices={prices}
            value={value}
            currency={currency}
            usdPctChange={usdPctChange}
            chainId={chainId}
            loading={loading}
          />
          <div className="h-6">
            <BalancePanel
              id={id}
              loading={loading}
              chainId={chainId}
              // account={account}
              onChange={onChange}
              currency={currency}
              disableMaxButton={disableMaxButton}
              hidePercentageButtons={hidePercentageButtons}
              showPercentageButtons={isInputFocused}
            />
          </div>
        </div>
        {onSelect && (
          <TokenSelector
            id={id}
            variant="dialog"
            onClose={handleClose}
            open={tokenSelectorOpen}
            pricesMap={prices}
            // fundSource={FundSource.WALLET}
            chainId={chainId}
            currency={currency}
            onSelect={onSelect}
            // onAddToken={onAddToken}
            // onRemoveToken={onRemoveToken}
            // tokenMap={tokenMap}
            // customTokenMap={customTokenMap}
            includeNative={includeNative}
            tokens={tokens}
          />
        )}
      </div>
    ),
    [
      // account,
      chainId,
      className,
      currency,
      disableMaxButton,
      disabled,
      focusInput,
      handleClose,
      id,
      includeNative,
      isMounted,
      loading,
      onChange,
      onSelect,
      prices,
      tokenSelectorOpen,
      tokens,
      usdPctChange,
      value,
      hidePercentageButtons,
      isInputFocused,
    ]
  )
}

type BalancePanel = Pick<CurrencyInputProps, 'onChange' | 'chainId' | 'currency' | 'disableMaxButton' | 'loading'> & {
  id?: string
  account: AccountState
}

type PricePanel = Pick<CurrencyInputProps, 'chainId' | 'currency' | 'value' | 'usdPctChange' | 'prices' | 'loading'>
const PricePanel: FC<PricePanel> = ({ prices, currency, value, usdPctChange, loading }) => {
  const isMounted = useIsMounted()
  const [price, setPrice] = useState<number | undefined>(0)
  const [usd, setUsd] = useState<number | undefined>(0)
  const calculatedPrice = currency ? prices?.[currency.uuid] : undefined
  const parsedValue = useMemo(() => parseFloat(value), [value])

  useEffect(() => {
    setPrice(calculatedPrice)
    setUsd(usdPctChange)
  }, [calculatedPrice, usdPctChange])

  if ((!prices && isMounted) || loading)
    return (
      <div className="h-[24px] w-[60px] flex items-center">
        <Skeleton.Box className="bg-white/[0.06] h-[12px] w-full" />
      </div>
    )

  return (
    <Typography variant="xs" weight={400} className="py-1 select-none text-stone-400">
      {parsedValue && price && isMounted ? `$${Number(parsedValue * price).toFixed(2)}` : '$0.00'}
      {usd && (
        <span
          className={classNames(
            usd === 0
              ? ''
              : usd > 0
              ? 'text-green'
              : usd < -5
              ? 'text-red'
              : usd < -3
              ? 'text-yellow'
              : 'text-stone-500'
          )}
        >
          {' '}
          {/* {`${usd === 0 ? '' : usd > 0 ? '(+' : '('}${usd === 0 ? '0.00' : usd?.toFixed(2)}%)`} */}
        </span>
      )}
    </Typography>
  )
}
