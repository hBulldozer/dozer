import { ChevronDownIcon } from '@heroicons/react/24/solid'
import { Token } from '@dozer/currency'
import { useIsMounted } from '@dozer/hooks'
import { classNames, Currency as UICurrency, DEFAULT_INPUT_UNSTYLED, Input, Skeleton, Typography } from '@dozer/ui'
import { FC, useCallback, useMemo, useRef, useState, useEffect } from 'react'
import { AccountState, useAccount } from '@dozer/zustand'

import { TokenSelector, TokenSelectorProps } from '../TokenSelector'
import { useWalletConnectClient } from '../contexts'

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
}) => {
  const isMounted = useIsMounted()
  const account = useAccount()
  const inputRef = useRef<HTMLInputElement>(null)
  const [tokenSelectorOpen, setTokenSelectorOpen] = useState(false)

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
              account={account}
              onChange={onChange}
              currency={currency}
              // fundSource={fundSource}
              disableMaxButton={disableMaxButton}
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
      account,
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
    ]
  )
}

type BalancePanel = Pick<CurrencyInputProps, 'onChange' | 'chainId' | 'currency' | 'disableMaxButton' | 'loading'> & {
  id?: string
  account: AccountState
}

const BalancePanel: FC<BalancePanel> = ({ id, onChange, currency, disableMaxButton }) => {
  const isMounted = useIsMounted()
  const balance = useAccount((state) => state.balance)
  const [tokenBalance, setTokenBalance] = useState(0)
  const { accounts } = useWalletConnectClient()
  const address = accounts && accounts.length > 0 ? accounts[0].split(':')[2] : ''

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

  return (
    <div className="flex items-center gap-2 py-1 text-xs">
      <div className="flex gap-1">
        <button
          className="px-1.5 py-0.5 text-stone-400 hover:text-stone-300 hover:bg-stone-800 rounded-lg transition-colors"
          onClick={() => handlePercentageClick(25)}
          disabled={disableMaxButton}
        >
          25%
        </button>
        <button
          className="px-1.5 py-0.5 text-stone-400 hover:text-stone-300 hover:bg-stone-800 rounded-lg transition-colors"
          onClick={() => handlePercentageClick(50)}
          disabled={disableMaxButton}
        >
          50%
        </button>
        <button
          className="px-1.5 py-0.5 text-stone-400 hover:text-stone-300 hover:bg-stone-800 rounded-lg transition-colors"
          onClick={() => handlePercentageClick(75)}
          disabled={disableMaxButton}
        >
          75%
        </button>
        <button
          data-testid={`${id}-balance-button`}
          onClick={() => onChange(tokenBalance.toFixed(2))}
          className="px-1.5 py-0.5 text-stone-400 hover:text-stone-300 hover:bg-stone-800 rounded-lg transition-colors"
          disabled={disableMaxButton}
        >
          MAX
        </button>
      </div>
      <span className="text-stone-400">
        {isMounted && balance ? `Balance: ${tokenBalance.toFixed(2)}` : 'Balance: 0'}
      </span>
    </div>
  )
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
