import { Popover } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/24/solid'
import { useBreakpoint } from '@dozer/hooks'
import { classNames, DEFAULT_INPUT_UNSTYLED, JazzIcon, Loader } from '@dozer/ui'
import Image from 'next/legacy/image'
import React, { FC, useState, useRef, useEffect, useMemo } from 'react'
import ReactDOM from 'react-dom'
import { useAccount, useNetwork } from '@dozer/zustand'

import { Wallet } from '..'
import { Default } from './Default'
import { Transactions } from './Transactions'
import { Portal } from './Portal'
import { shortenAddress } from './Utils'
// import { api } from '../../../utils/api'
import { client } from '@dozer/api'
import { useWalletConnectClient } from '../../contexts'
import { Tokens } from './Tokens'
import { TokensEVM } from './TokensEVM'
import { useBridge } from '../../contexts/BridgeContext'
import bridgeConfig, { IS_TESTNET } from '../../../config/bridge'

interface ProfileProps {
  client: typeof client
}
export enum ProfileView {
  Default,
  Transactions,
  Tokens,
  TokensEVM,
}
export const Profile: FC<ProfileProps> = ({ client }) => {
  const { notifications, clearNotifications, updateNotificationStatus } = useAccount()
  const { isSm } = useBreakpoint('sm')
  const [view, setView] = useState<ProfileView>(ProfileView.Default)
  const { network } = useNetwork()
  // const accountAddress = useAccount((state) => state.address)
  // const utils = api.useContext()
  // const htr = utils.getTokens.all.getData()
  // console.log(htr)
  // const [address, setAddress] = useState('')
  const chainId = network
  // const { data, isLoading, isError, error } = useBalance(accountAddress)
  const { accounts } = useWalletConnectClient()
  const address = accounts.length > 0 ? accounts[0].split(':')[2] : ''
  const { data, isLoading, isError, error, refetch } = client.getProfile.balance.useQuery(
    { address: address },
    {
      enabled: Boolean(address),
      staleTime: 5000,
      refetchInterval: 20000, // Refetch every 20 seconds to keep data fresh
      retry: 3, // Retry failed requests up to 3 times
      retryDelay: 1000, // Wait 1 second between retries
      refetchOnMount: true, // Always refetch on component mount
      cacheTime: 3600000, // Cache for 1 hour
      keepPreviousData: true, // Keep the previous data while loading new data
    }
  )
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { setBalance } = useAccount()

  // Add state for EVM token balances
  const [evmTokenBalances, setEvmTokenBalances] = useState<Record<string, number>>({})
  const [evmTokensUsdValue, setEvmTokensUsdValue] = useState(0)
  const { loadBalances } = useBridge()
  const { data: tokensData } = client.getTokens.all.useQuery()
  const { data: prices } = client.getPrices.all.useQuery()

  // Fetch EVM token balances for the Default view
  const fetchEvmBalances = async () => {
    if (!window.ethereum || !address) return

    try {
      // Only attempt to fetch if MetaMask is connected
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (!accounts || accounts.length === 0) return

      // Filter tokens that are bridged and have original addresses
      const bridgedTokens = (tokensData || []).filter((token: any) => {
        return (
          token.bridged &&
          token.originalAddress &&
          ((IS_TESTNET && token.sourceChain?.toLowerCase() === 'sepolia') ||
            (!IS_TESTNET && token.sourceChain?.toLowerCase() === 'arbitrum'))
        )
      })

      // Extract token addresses
      const tokenAddresses = bridgedTokens
        .filter((token: any) => token.originalAddress)
        .map((token: any) => token.originalAddress)

      if (tokenAddresses.length > 0) {
        // Attempt to load balances
        const balances = await loadBalances(tokenAddresses)
        if (balances) {
          setEvmTokenBalances(balances)

          // Calculate USD value of EVM tokens
          let totalUsdValue = 0
          bridgedTokens.forEach((token: any) => {
            if (token.originalAddress && balances[token.originalAddress] > 0) {
              const balance = balances[token.originalAddress]
              const price = prices?.[token.uuid]
              if (price) {
                totalUsdValue += balance * price
              }
            }
          })

          setEvmTokensUsdValue(totalUsdValue)
        }
      }
    } catch (error) {
      console.error('Error fetching EVM balances in Profile:', error)
    }
  }

  const filteredNotifications = useMemo<Record<number, string[]>>(() => {
    const filteredEntries = Object.entries(notifications)
      .reverse()
      .filter(([, _notifications], index: number) => {
        const json_notification = JSON.parse(_notifications[0])
        return json_notification.account === address
      })
    return filteredEntries.reduce<Record<number, string[]>>((result, [key, value]) => {
      result[parseInt(key, 10)] = value
      return result
    }, {})
  }, [notifications, address])

  // const { data: avatar } = useEnsAvatar({
  //   address,
  // })

  // Manual refresh function for balance
  const refreshBalance = async () => {
    if (!address) return

    setIsRefreshing(true)
    try {
      await refetch()
      // Also refresh EVM balances
      await fetchEvmBalances()
    } finally {
      setIsRefreshing(false)
    }
  }

  // Listen for transaction notifications to trigger a balance refresh
  useEffect(() => {
    const newNotifications = Object.values(filteredNotifications).filter((notif) => {
      try {
        const parsed = JSON.parse(notif[0])
        return parsed.status === 'confirmed' && !parsed.processed
      } catch {
        return false
      }
    })

    if (newNotifications.length > 0) {
      refreshBalance()

      // Mark notifications as processed
      newNotifications.forEach((notif) => {
        try {
          const parsed = JSON.parse(notif[0])
          updateNotificationStatus(parsed.txHash, 'confirmed', 'Transaction processed')
        } catch {}
      })
    }
  }, [filteredNotifications])

  // Perform initial refresh when component mounts or address changes
  useEffect(() => {
    if (address) {
      refreshBalance()
    }
  }, [address])

  // Process and set balance data when available
  useEffect(() => {
    if (address && data && !isError) {
      const balance_data = []
      for (const token in data.tokens_data) {
        balance_data.push({
          token_uuid: token,
          token_symbol: data.tokens_data[token].symbol,
          token_balance: data.tokens_data[token].received - data.tokens_data[token].spent,
        })
      }
      setBalance(balance_data)
    }
  }, [data, isError, address, setBalance])

  // Make sure to refresh balance when view changes to Default tab
  useEffect(() => {
    if (view === ProfileView.Default && address) {
      refreshBalance()
    }
  }, [view, address])

  if (!address) {
    return <Wallet.Button size="sm" className="border-none shadow-md whitespace-nowrap" />
  }

  if (address) {
    const panel = (
      <Popover.Panel className="z-[99] w-full sm:w-[320px] fixed bottom-0 left-0 right-0 sm:absolute sm:bottom-[unset] sm:left-[unset] mt-4 sm:rounded-xl rounded-b-none shadow-md shadow-black/[0.3] bg-stone-900 border border-stone-200/20">
        {view === ProfileView.Default && (
          <Default
            api_client={client}
            chainId={chainId}
            address={address}
            setView={setView}
            refreshBalance={refreshBalance}
            isRefreshing={isRefreshing || isLoading}
            evmTokensUsdValue={evmTokensUsdValue}
          />
        )}
        {view === ProfileView.Transactions && (
          <Transactions
            setView={setView}
            notifications={filteredNotifications}
            clearNotifications={clearNotifications}
            updateNotificationStatus={updateNotificationStatus}
            client={client}
            refreshBalance={refreshBalance}
          />
        )}
        {view === ProfileView.Tokens && (
          <Tokens
            setView={setView}
            client={client}
            isLoading={isLoading || isRefreshing}
            refreshBalance={refreshBalance}
          />
        )}
        {view === ProfileView.TokensEVM && <TokensEVM setView={setView} client={client} />}
      </Popover.Panel>
    )

    return (
      <Popover className="relative">
        {({ open }) => {
          return (
            <>
              <Popover.Button
                className={classNames(
                  DEFAULT_INPUT_UNSTYLED,
                  'flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] hover:text-white h-[38px] rounded-xl px-2 pl-3 !font-semibold !text-sm text-stone-200'
                )}
                onClick={() => {
                  // Always refresh balance when opening the profile panel
                  // This ensures data is fresh when the panel is opened
                  if (!open) {
                    refreshBalance()

                    // Force the query to refetch even if the data is considered fresh
                    refetch()
                  }
                }}
              >
                <JazzIcon diameter={20} address={address} />
                {shortenAddress(address)}{' '}
                {(isLoading || isRefreshing) && <Loader className="w-4 h-4 mr-1 text-stone-400" />}
                <ChevronDownIcon
                  width={20}
                  height={20}
                  className={classNames(open ? 'rotate-180' : 'rotate-0', 'transition-transform')}
                />
              </Popover.Button>

              {/* {!isSm ? (mounted && ref.current) ? ReactDOM.createPortal(<div>{panel}</div>, ref.current) : null :panel} */}
              {!isSm ? ReactDOM.createPortal(panel, document.body) : panel}
            </>
          )
        }}
      </Popover>
    )
  }

  return <span />
}
