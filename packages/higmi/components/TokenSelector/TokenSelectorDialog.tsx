// import { AddressZero } from '@ethersproject/constants'
import { SearchIcon } from '@heroicons/react/outline'
import { XCircleIcon } from '@heroicons/react/solid'
import chain from '@dozer/chain'
import { Amount, Token } from '@dozer/currency'
import { FundSource, useIsSmScreen } from '@dozer/hooks'
// import { Fraction } from '@dozer/math'
import {
  classNames,
  Currency,
  DEFAULT_INPUT_PADDING,
  DEFAULT_INPUT_UNSTYLED,
  Dialog,
  Input,
  Loader,
  NetworkIcon,
  SlideIn,
  Typography,
} from '@dozer/ui'
import React, { FC, useCallback, useEffect } from 'react'

// import { BalanceMap } from '../../hooks/useBalance/types'
// import { TokenListFilterByQuery } from '../TokenListFilterByQuery'
import { TokenSelectorProps } from './TokenSelector'
// import { TokenSelectorImportRow } from './TokenSelectorImportRow'
import { TokenSelectorRow } from './TokenSelectorRow'
import { TokenSelectorSettingsOverlay } from './TokenSelectorSettingsOverlay'

import { TokenBalance, getTokens } from '@dozer/currency'

type TokenSelectorDialog = Omit<TokenSelectorProps, 'variant'> & {
  id: string
  account?: string
  balancesMap?: TokenBalance
  // tokenMap: Record<string, Token>
  pricesMap?: Record<string, number> | undefined
  // fundSource: FundSource
  includeNative?: boolean
}

export const TokenSelectorDialog: FC<TokenSelectorDialog> = ({
  id,
  account,
  currency,
  open,
  onClose,
  // tokenMap,
  // customTokenMap,
  chainId,
  onSelect,
  // onAddToken,
  // onRemoveToken,
  balancesMap,
  pricesMap,
  // fundSource,
  includeNative,
  tokens,
}) => {
  const isSmallScreen = useIsSmScreen()
  // const currencies = [
  //   new Token({ uuid: '00', decimals: 2, name: 'Hathor', symbol: 'HTR' }),
  //   new Token({ uuid: '0das23asds123', decimals: 2, name: 'Dozer', symbol: 'DZR' }),
  // ]
  const currencies = tokens
    ? tokens?.filter((token) => {
        return token.chainId == chainId
      })
    : getTokens(chainId)

  const handleSelect = useCallback(
    (currency: Token) => {
      onSelect && onSelect(currency)
      onClose()
    },
    [onClose, onSelect]
  )

  // const handleImport = useCallback(
  //   (currency: Token) => {
  //     onAddToken && onAddToken(currency)
  //     onSelect && onSelect(currency)
  //     onClose()
  //   },
  //   [onAddToken, onClose, onSelect]
  // )

  return (
    // <TokenListFilterByQuery
    //   tokenMap={tokenMap}
    //   chainId={chainId}
    //   pricesMap={pricesMap}
    //   balancesMap={balancesMap}
    //   fundSource={fundSource}
    //   includeNative={includeNative}
    // >
    <>
      <Dialog open={open} unmount={false} onClose={onClose}>
        <Dialog.Content className="!max-w-md overflow-hidden h-[45vh] sm:h-[640px] pb-[116px]">
          <SlideIn>
            <Dialog.Header onClose={onClose} title="Select Token">
              {/* {customTokenMap && (
                  <TokenSelectorSettingsOverlay customTokenMap={customTokenMap} onRemoveToken={onRemoveToken} />
                )} */}
            </Dialog.Header>
            {/* <div
            className={classNames(
              'my-3 mb-5 ring-offset-2 ring-offset-stone-800 flex gap-2 bg-stone-700 pr-3 w-full relative flex items-center justify-between gap-1 rounded-2xl focus-within:ring-2 text-primary ring-yellow'
            )}
            > */}
            {/* <Input.Address
                  id={`${id}-address-input`}
                  testdata-id={`${id}-address-input`}
                  variant="unstyled"
                  ref={inputRef}
                  placeholder="Search token by address"
                  value={query}
                  onChange={onInput}
                  className={classNames(DEFAULT_INPUT_UNSTYLED, DEFAULT_INPUT_PADDING)}
                /> */}
            {/* {searching ? (
                  <div className="relative left-[-2px]">
                    <Loader size={14} strokeWidth={3} className="animate-spin-slow text-stone-500" />
                  </div>
                ) : query ? (
                  <XCircleIcon
                    width={20}
                    height={20}
                    className="cursor-pointer text-stone-500 hover:text-stone-300"
                    onClick={() => onInput('')}
                  />
                ) : (
                  <SearchIcon className="text-stone-500" strokeWidth={2} width={20} height={20} />
                )}
              </div>
              <Typography className="px-6 pb-1 text-left text-stone-400" variant="xs">
              {/* {fundSource === FundSource.WALLET ? 'Wallet' : 'BentoBox'} */}
            {/* Wallet Balances */}
            {/* </Typography> */}
            <div className="relative h-full -ml-6 -mr-6">
              <div className="w-full border-t border-stone-200/5" />
              <div className="relative h-[calc(100%)] pt-5">
                <div className="absolute inset-0 h-full rounded-t-none rounded-xl">
                  {/* {queryToken[0] && (
                      <TokenSelectorImportRow
                        className="!px-6"
                        currencies={queryToken}
                        onImport={() => queryToken[0] && handleImport(queryToken[0])}
                      />
                    )} */}
                  <Currency.List
                    className="divide-y hide-scrollbar divide-stone-700"
                    currencies={currencies}
                    rowRenderer={({ currency, style }) => (
                      <TokenSelectorRow
                        id={id}
                        account={account}
                        currency={currency}
                        style={style}
                        onCurrency={handleSelect}
                        className="!px-6"
                        // fundSource={fundSource}
                        balance={Amount.fromRawAmount(currency, 0)}
                        price={pricesMap?.[currency.uuid]}
                      />
                    )}
                  />
                  {currencies.length === 0 && chainId && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <Typography variant="xs" className="flex italic text-stone-500">
                          No tokens found on
                        </Typography>
                        <Typography variant="xs" weight={500} className="flex gap-1 italic text-stone-500">
                          <NetworkIcon width={14} height={14} chainId={chainId} />
                          {chain[chainId].name}
                          {/* Hathor */}
                        </Typography>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* </div> */}
          </SlideIn>
        </Dialog.Content>
      </Dialog>
    </>
  )
}
