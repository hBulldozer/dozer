import chain from '@dozer/chain'
import { Amount, Token } from '@dozer/currency'
import { Currency, Dialog, NetworkIcon, SlideIn, Typography } from '@dozer/ui'
import { FC, useCallback } from 'react'
import { TokenSelectorRow } from './TokenSelectorRow'
import { TokenBalance, getTokens } from '@dozer/currency'

type TokenSelectorDialog = {
  id: string
  account?: string
  balancesMap?: TokenBalance
  pricesMap?: Record<string, number> | undefined
  chainId?: number
  includeNative?: boolean
  tokens?: Token[]
  open: boolean
  onClose(): void
  onSelect(currency: Token): void
}

export const TokenSelectorDialog: FC<TokenSelectorDialog> = ({
  id,
  account,
  open,
  onClose,
  chainId,
  onSelect,
  balancesMap,
  pricesMap,
  includeNative,
  tokens,
}) => {
  const currencies = tokens
    ? tokens?.filter((token) => {
        return token.chainId == chainId && token.uuid !== 'create-token'
      })
    : getTokens(chainId)

  const createTokenOption = tokens?.find((token) => token.uuid === 'create-token')

  const handleSelect = useCallback(
    (currency: Token) => {
      onSelect(currency)
      onClose()
    },
    [onClose, onSelect]
  )

  return (
    <Dialog open={open} unmount={false} onClose={onClose}>
      <Dialog.Content className="!max-w-md overflow-hidden h-[70vh] sm:h-[480px]">
        <SlideIn>
          <Dialog.Header onClose={onClose} title="Select Token" />
          <div className="flex flex-col h-full">
            <div className="flex-grow pb-2 overflow-y-auto custom-scrollbar">
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
                    balance={Amount.fromFractionalAmount(
                      currency,
                      Number(
                        balancesMap?.find((balance) => balance.token_uuid == currency.uuid)?.token_balance.toFixed(2) ||
                          '0'
                      ) * 100,
                      100
                    )}
                    price={pricesMap?.[currency.uuid]}
                  />
                )}
              />
            </div>
            {createTokenOption && (
              <div className="mt-auto -mb-12 border-t border-stone-700">
                <TokenSelectorRow
                  id={id}
                  account={account}
                  currency={createTokenOption}
                  onCurrency={handleSelect}
                  className="!px-6 -mb-3"
                  isCreateToken={true}
                />
              </div>
            )}
          </div>
        </SlideIn>
      </Dialog.Content>
    </Dialog>
  )
}
