// import { ChainId } from '@dozer/chain'
import { Token } from '@dozer/currency'
import { FundSource, useIsMounted } from '@dozer/hooks'
import { FC, memo, useMemo } from 'react'
import { useAccount } from '@dozer/zustand'

// import { useBalances, usePrices } from '../../hooks'
import { TokenSelectorDialog } from './TokenSelectorDialog'

export type TokenSelectorProps = {
  id?: string
  variant: 'overlay' | 'dialog'
  currency?: Token
  open: boolean
  // chainId: ChainId | undefined
  // tokenMap: Record<string, Token>
  // customTokenMap?: Record<string, Token>
  onClose(): void
  onSelect?(currency: Token): void
  // onAddToken?(token: Token): void
  // onRemoveToken?({ uuid }: { uuid: string }): void
  // fundSource?: FundSource
  includeNative?: boolean
}

export const TokenSelector: FC<TokenSelectorProps> = memo(
  ({
    id,
    variant,
    // tokenMap,
    // chainId,
    // fundSource = FundSource.WALLET,
    onSelect,
    open,
    // customTokenMap = {},
    includeNative,
    ...props
  }) => {
    const { address } = useAccount()
    const isMounted = useIsMounted()

    // const _tokenMap: Record<string, Token> = useMemo(
    //   () => ({ ...tokenMap, ...customTokenMap }),
    //   [tokenMap, customTokenMap]
    // )

    // const _tokenMapValues = useMemo(() => {
    //   // Optimism token list is dumb, have to remove random weird addresses
    //   delete _tokenMap['0x0000000000000000000000000000000000000000']
    //   delete _tokenMap['0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000']
    //   return Object.values(_tokenMap)
    // }, [_tokenMap])

    const balances = [
      {
        token_uuid: '00',
        token_symbol: 'HTR',
        token_balance: 0,
      },
    ]

    const pricesMap = {
      HTR_UUID: 0.008,
    }

    return useMemo(() => {
      if (!isMounted) return <></>
      return (
        <TokenSelectorDialog
          id={`${id}-token-selector-dialog`}
          open={open}
          account={address}
          balancesMap={balances}
          // tokenMap={_tokenMap}
          pricesMap={pricesMap}
          // chainId={chainId}
          // fundSource={fundSource}
          onSelect={onSelect}
          includeNative={includeNative}
          {...props}
        />
      )
    }, [address, balances, isMounted, onSelect, open, pricesMap, props, variant])
  },
  (prevProps, nextProps) => {
    return (
      prevProps.variant === nextProps.variant &&
      prevProps.currency === nextProps.currency &&
      prevProps.open === nextProps.open
      // prevProps.tokenMap === nextProps.tokenMap &&
      // prevProps.customTokenMap === nextProps.customTokenMap
      // prevProps.fundSource === nextProps.fundSource
    )
  }
)
