// import { ChainId } from '@dozer/chain'
import { Token } from '@dozer/currency'
import { FundSource, useIsMounted } from '@dozer/hooks'
import { FC, memo, useMemo } from 'react'
import { useAccount } from '@dozer/zustand'

import { TokenSelectorDialog } from './TokenSelectorDialog'
import { ChainId } from '@dozer/chain'
import { api } from '../../utils/api'
import { useWalletConnectClient } from '../contexts'

export type TokenSelectorProps = {
  id?: string
  variant: 'overlay' | 'dialog'
  currency?: Token
  open: boolean
  chainId: ChainId | undefined
  // tokenMap: Record<string, Token>
  // customTokenMap?: Record<string, Token>
  onClose(): void
  onSelect?(currency: Token): void
  // onAddToken?(token: Token): void
  // onRemoveToken?({ uuid }: { uuid: string }): void
  // fundSource?: FundSource
  includeNative?: boolean
  tokens?: Token[]
  pricesMap?: { [key: string]: number }
}

export const TokenSelector: FC<TokenSelectorProps> = memo(
  ({
    id,
    variant,
    // tokenMap,
    chainId,
    // fundSource = FundSource.WALLET,
    onSelect,
    open,
    // customTokenMap = {},
    includeNative,
    tokens,
    pricesMap,
    ...props
  }) => {
    // const { address } = useAccount()
    const { accounts } = useWalletConnectClient()
    const address = accounts.length > 0 ? accounts[0].split(':')[2] : ''
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

    // const balances = [
    //   {
    //     token_uuid: '00',
    //     token_symbol: 'HTR',
    //     token_balance: 0,
    //   },
    // ]

    // const pricesMap = {
    //   HTR_UUID: 0.008,
    // }

    const { balance: balances } = useAccount()
    const _tokens = useMemo(() => {
      return tokens?.sort((a: Token, b: Token) => {
        const balanceA = balances.find((balance) => balance.token_uuid === a.uuid)?.token_balance || 0
        const balanceB = balances.find((balance) => balance.token_uuid === b.uuid)?.token_balance || 0

        if (balanceA === 0 && balanceB === 0) {
          return 0 // Both tokens have no balance, keep original order
        }
        if (balanceA === 0) {
          return 1 // A has no balance, move it to the end
        }
        if (balanceB === 0) {
          return -1 // B has no balance, move it to the end
        }
        return balanceB - balanceA // Sort by balance in descending order
      })
    }, [tokens, balances])

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
          chainId={chainId}
          // fundSource={fundSource}
          onSelect={onSelect}
          includeNative={includeNative}
          tokens={tokens}
          {...props}
        />
      )
    }, [address, balances, chainId, isMounted, onSelect, open, pricesMap, props, variant, tokens])
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
