import { Amount, Token } from '@dozer/currency'
import { Currency, Dialog, SlideIn, Typography, Input, Switch, Skeleton } from '@dozer/ui'
import { FC, useCallback, useState, useMemo } from 'react'
import { TokenSelectorRow } from './TokenSelectorRow'
import { TokenBalance, getTokens } from '@dozer/currency'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { api } from '../../utils/api'

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
  showUnsignedTokens?: boolean
  searchTerm?: string
  showUnsignedSwitchInDialog?: boolean
  stripBridgePrefix?: boolean
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
  showUnsignedTokens: initialShowUnsigned = false,
  searchTerm: initialSearchTerm = '',
  showUnsignedSwitchInDialog = true,
  stripBridgePrefix = false,
}) => {
  // Local state for search and unsigned tokens toggle
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
  const [showUnsignedTokens, setShowUnsignedTokens] = useState(initialShowUnsigned)

  // Fetch unsigned tokens when switch is enabled
  const { data: unsignedTokens, isLoading: isLoadingUnsigned } = api.getTokens.allWithUnsigned.useQuery(undefined, {
    enabled: showUnsignedTokens,
  })
  // Determine which token set to use
  const allTokens = useMemo(() => {
    let tokenSet = tokens

    // If unsigned tokens are enabled and we have unsigned token data, use it
    if (showUnsignedTokens && unsignedTokens) {
      tokenSet = unsignedTokens.map(
        (token) =>
          new Token({
            chainId: token.chainId,
            uuid: token.uuid,
            decimals: token.decimals,
            name: token.name || 'Unknown Token',
            symbol: token.symbol || token.uuid?.substring(0, 6)?.toUpperCase() || 'TK',
            imageUrl: token.imageUrl || undefined,
            bridged: token.bridged || false,
            originalAddress: token.originalAddress || undefined,
          })
      )
    }

    return tokenSet || getTokens(chainId)
  }, [tokens, showUnsignedTokens, unsignedTokens, chainId])

  // Filter tokens by search term and chain
  const currencies = useMemo(() => {
    let filtered = allTokens.filter((token) => {
      return token.chainId == chainId && token.uuid !== 'create-token'
    })

    // Apply search filter
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(
        (token) =>
          token.symbol?.toLowerCase().includes(lowerSearchTerm) || token.name?.toLowerCase().includes(lowerSearchTerm)
      )
    }

    return filtered
  }, [allTokens, chainId, searchTerm])

  const handleSelect = useCallback(
    (currency: Token) => {
      onSelect(currency)
      onClose()
    },
    [onClose, onSelect]
  )

  return (
    <Dialog open={open} unmount={false} onClose={onClose}>
      <Dialog.Content className="!max-w-md overflow-hidden h-[70vh] sm:h-[90vh] sm:max-h-[700px]">
        <SlideIn>
          <Dialog.Header onClose={onClose} title="Select Token" />
          <div className="flex flex-col h-full">
            {/* Search and filters section */}
            <div className="px-6 py-4 border-b border-stone-700">
              {/* Desktop layout: single row */}
              <div className="hidden items-center space-x-4 sm:flex">
                {/* Search input */}
                <div className="relative flex-1">
                  <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                    <MagnifyingGlassIcon className="w-5 h-5 text-stone-400" />
                  </div>
                  <Input.TextGeneric
                    id={`${id}-search`}
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search tokens..."
                    className="pl-10 !bg-stone-800 !border-stone-600 focus:!border-yellow-500"
                    pattern=""
                  />
                </div>

                {/* Unsigned tokens switch */}
                {showUnsignedSwitchInDialog && (
                  <div className="flex flex-shrink-0 items-center space-x-2">
                    <Switch checked={showUnsignedTokens} onChange={setShowUnsignedTokens} size="sm" />
                    <Typography variant="sm" weight={500} className="whitespace-nowrap text-stone-200">
                      Include unsigned
                    </Typography>
                  </div>
                )}
              </div>

              {/* Mobile layout: stacked */}
              <div className="space-y-3 sm:hidden">
                {/* Search input */}
                <div className="relative">
                  <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                    <MagnifyingGlassIcon className="w-5 h-5 text-stone-400" />
                  </div>
                  <Input.TextGeneric
                    id={`${id}-search-mobile`}
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search tokens..."
                    className="pl-10 !bg-stone-800 !border-stone-600 focus:!border-yellow-500"
                    pattern=""
                  />
                </div>

                {/* Unsigned tokens switch */}
                {showUnsignedSwitchInDialog && (
                  <div className="flex items-center space-x-2">
                    <Switch checked={showUnsignedTokens} onChange={setShowUnsignedTokens} size="sm" />
                    <Typography variant="sm" weight={500} className="text-stone-200">
                      Include unsigned tokens
                    </Typography>
                  </div>
                )}
              </div>
            </div>

            {/* Token list */}
            <div className="overflow-y-auto flex-grow custom-scrollbar">
              {/* Show skeleton loading when fetching unsigned tokens */}
              {showUnsignedTokens && isLoadingUnsigned ? (
                <div className="px-6 py-4 space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <Skeleton.Circle radius={28} className="w-7 h-7" />
                      <div className="flex-1 space-y-1">
                        <Skeleton.Box className="w-16 h-4" />
                        <Skeleton.Box className="w-24 h-3" />
                      </div>
                      <div className="space-y-1 text-right">
                        <Skeleton.Box className="w-12 h-3" />
                        <Skeleton.Box className="w-8 h-3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
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
                          Math.floor(
                            Number(
                              balancesMap
                                ?.find((balance) => balance.token_uuid == currency.uuid)
                                ?.token_balance.toFixed(2) || '0'
                            ) * 100
                          ),
                          100
                        )}
                        price={pricesMap?.[currency.uuid]}
                        stripBridgePrefix={stripBridgePrefix}
                      />
                    )}
                  />

                  {/* No results message */}
                  {currencies.length === 0 && searchTerm.trim() && !isLoadingUnsigned && (
                    <div className="flex flex-col justify-center items-center px-6 py-8">
                      <Typography variant="sm" className="text-center text-stone-400">
                        No tokens found matching "{searchTerm}"
                      </Typography>
                      <Typography variant="xs" className="mt-1 text-center text-stone-500">
                        Try adjusting your search or enabling unsigned tokens
                      </Typography>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </SlideIn>
      </Dialog.Content>
    </Dialog>
  )
}
