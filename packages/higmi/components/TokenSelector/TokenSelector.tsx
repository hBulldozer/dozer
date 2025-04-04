import { Token } from '@dozer/currency'
import { useIsMounted } from '@dozer/hooks'
import { FC, memo, useMemo } from 'react'
import { useAccount } from '@dozer/zustand'
import { TokenSelectorDialog } from './TokenSelectorDialog'
import { ChainId } from '@dozer/chain'
import { api } from '../../utils/api'
import { useWalletConnectClient } from '../contexts'
import { useRouter } from 'next/router'

export type TokenSelectorProps = {
  id?: string
  variant: 'overlay' | 'dialog'
  currency?: Token
  open: boolean
  chainId: ChainId | undefined
  onClose(): void
  onSelect?(currency: Token): void
  includeNative?: boolean
  tokens?: Token[]
  pricesMap?: { [key: string]: number }
  customTokensOnly?: boolean
}

export const TokenSelector: FC<TokenSelectorProps> = memo(
  ({ id, variant, chainId, onSelect, open, includeNative, tokens, pricesMap, customTokensOnly = false, ...props }) => {
    const { accounts } = useWalletConnectClient()
    const address = accounts && accounts.length > 0 ? accounts[0].split(':')[2] : ''
    const isMounted = useIsMounted()
    const router = useRouter()

    const { balance: balances } = useAccount()
    const _tokens = useMemo(() => {
      let filteredTokens = tokens || []
      if (customTokensOnly) {
        filteredTokens = filteredTokens.filter((token) => token.imageUrl != undefined)
      }

      // Convert token data so that the bridged property is preserved
      filteredTokens = filteredTokens.map((token) => {
        if (token instanceof Token) {
          // If already a Token instance, just return it
          return token
        } else {
          // Convert from database representation to Token instance
          return new Token({
            chainId: token.chainId,
            uuid: token.uuid,
            decimals: token.decimals,
            name: token.name,
            symbol: token.symbol,
            imageUrl: token.imageUrl,
            bridged: (token as any).bridged || false,
            originalAddress: (token as any).originalAddress,
          })
        }
      })

      const sortedTokens = filteredTokens.sort((a: Token, b: Token) => {
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

      // Check if "Create your token" option already exists
      const createTokenExists = sortedTokens.some((token) => token.uuid === 'create-token')

      // Add the "Create your token" option if it doesn't exist
      if (!createTokenExists) {
        sortedTokens.push(
          new Token({
            chainId: chainId || ChainId.HATHOR,
            uuid: 'create-token',
            decimals: 0,
            name: 'Create your token',
            symbol: 'CREATE',
          })
        )
      }

      return sortedTokens
    }, [tokens, balances, customTokensOnly, chainId])

    const handleSelect = (currency: Token) => {
      if (currency.uuid === 'create-token') {
        window.location.href = '/pool/create_token'
      } else if (onSelect) {
        onSelect(currency)
      }
    }

    return useMemo(() => {
      if (!isMounted) return <></>
      return (
        <TokenSelectorDialog
          id={`${id}-token-selector-dialog`}
          open={open}
          account={address}
          balancesMap={balances}
          pricesMap={pricesMap}
          chainId={chainId}
          onSelect={handleSelect}
          includeNative={includeNative}
          tokens={_tokens}
          {...props}
        />
      )
    }, [address, balances, chainId, isMounted, handleSelect, open, pricesMap, props, variant, _tokens])
  },
  (prevProps, nextProps) => {
    return (
      prevProps.variant === nextProps.variant &&
      prevProps.currency === nextProps.currency &&
      prevProps.open === nextProps.open
    )
  }
)
