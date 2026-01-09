import {
  Button,
  BuyCrypto,
  CopyHelper,
  createErrorToast,
  createSuccessToast,
  Currency,
  IconButton,
  JazzIcon,
  NotificationData,
  Typography,
  Loader,
} from '@dozer/ui'
import {
  CreditCardIcon,
  Square2StackIcon,
  ArrowTopRightOnSquareIcon,
  ArrowRightOnRectangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { ChevronRightIcon } from '@heroicons/react/24/solid'
import { Dispatch, FC, SetStateAction, useCallback, useEffect, useRef, useState } from 'react'

import { ProfileView } from './Profile'
import { TokenBalance, useAccount, useNetwork } from '@dozer/zustand'
import { shortenAddress } from './Utils'
import chains, { ChainId } from '@dozer/chain'

import { client, toToken } from '@dozer/api'
import { Token } from '@dozer/currency'
import { useInViewport } from '@dozer/hooks'
import { useJsonRpc, useWalletConnectClient } from '../../contexts'
import { WalletConnectionService } from '../../../services/walletConnectionService'

interface DefaultProps {
  chainId: ChainId
  address: string
  setView: Dispatch<SetStateAction<ProfileView>>
  api_client: typeof client
  refreshBalance: () => Promise<void>
  isRefreshing: boolean
  evmTokensUsdValue?: number
}

interface BalanceProps {
  balance: number
  balanceUSD: number
  token: Token | undefined
}

export const Default: FC<DefaultProps> = ({
  chainId,
  address,
  setView,
  api_client,
  refreshBalance,
  isRefreshing,
  evmTokensUsdValue = 0,
}) => {
  // const setAddress = useAccount((state) => state.setAddress)
  const setBalance = useAccount((state) => state.setBalance)
  const { data: prices } = api_client.getPrices.all.useQuery()
  const { data: tokens } = api_client.getTokens.all.useQuery()
  const { network } = useNetwork()

  const {
    client,
    pairings,
    session,
    connect,
    disconnect,
    relayerRegion,
    accounts,
    isInitializing,
    setChains,
    setRelayerRegion,
  } = useWalletConnectClient()

  // Use `JsonRpcContext` to provide us with relevant RPC methods and states.
  const { hathorRpc, isRpcRequestPending, rpcResult, isTestnet, setIsTestnet } = useJsonRpc()

  // const { data: avatar } = useEnsAvatar({
  //   address: address,
  // })

  // const { data: _balance } = 100
  // useBalance({
  //   address: address,
  //   // chainId,
  // })

  // const balance = 100
  const balance = useAccount((state) => state.balance)
  // useMemo(
  //   () => Amount.fromRawAmount(Native.onChain(chainId), _balance ? _balance?.value.toString() : '0'),
  //   [_balance, chainId]
  // )

  const { walletType } = useAccount()
  const walletService = WalletConnectionService.getInstance()
  const isLoggingOutRef = useRef(false)

  async function logout() {
    // Prevent multiple simultaneous logout calls
    if (isLoggingOutRef.current) {
      console.log('Logout already in progress, skipping...')
      return
    }

    isLoggingOutRef.current = true

    try {
      // Clear balance first
      setBalance([])

      // For WalletConnect, disconnect the session
      if (walletType === 'walletconnect' && accounts.length > 0) {
        await disconnect()
      }

      // Clean up localStorage items that might trigger auto-reconnection
      // This must be done BEFORE disconnectWallet to prevent SDK from trying to reconnect
      try {
        const localStorageKeys = Object.keys(localStorage)
        localStorageKeys.forEach((key) => {
          // Remove MetaMask SDK related keys
          if (
            key.startsWith('MMSDK') ||
            key.startsWith('metamask') ||
            key.includes('provider') ||
            key === 'providerType'
          ) {
            try {
              localStorage.removeItem(key)
            } catch (e) {
              console.warn(`Failed to remove localStorage key: ${key}`, e)
            }
          }
        })
      } catch (error) {
        console.error('Error cleaning localStorage:', error)
      }

      // Use unified wallet service to disconnect (clears Zustand state)
      // This also clears the account-storage in localStorage
      await walletService.disconnectWallet()

      console.log('Wallet disconnected and localStorage cleaned')

      // Set a flag in sessionStorage to indicate we just disconnected
      // This will trigger a page reload on the bridge page to reset SDK state
      sessionStorage.setItem('metamask-just-disconnected', 'true')

      // Dispatch a custom event to notify other components about the disconnect
      window.dispatchEvent(new CustomEvent('walletDisconnected'))

      isLoggingOutRef.current = false
    } catch (error) {
      console.error('Error during wallet disconnect:', error)
      isLoggingOutRef.current = false
    }
  }
  // useDisconnect()

  // const [usdPrice, setUsdPrice] = useState<number>(0)
  // const balanceAsUsd = prices ? prices['00'] : 0
  const [balanceUSD, setBalanceUSD] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const inViewport = useInViewport(ref)
  // const { isLoading, error, data: priceHTR } = useHtrPrice()
  const { isLoading, error, data } = api_client.getPrices.htr.useQuery()
  const priceHTR = data ? data : 0.01

  const { data: faucetAvailable, refetch: refetchFaucetStatus } = api_client.getFaucet.checkFaucet.useQuery(
    { address: address },
    {
      enabled: Boolean(address),
      staleTime: 0, // Don't cache this data - always fetch fresh status
      refetchOnMount: true, // Always refetch on component mount
      refetchOnWindowFocus: true, // Refetch when window gains focus
    }
  )

  // Local state to track if the faucet was used in this session
  const [faucetUsed, setFaucetUsed] = useState(false)

  const { addNotification } = useAccount()
  const [isLoadingFaucet, setIsLoadingFaucet] = useState(false)

  const mutation = api_client.getFaucet.sendHTR.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        const notificationData: NotificationData = {
          type: 'swap',
          chainId: network,
          summary: {
            pending: `Sending HTR to you`,
            completed: `Success! Sent HTR to you.`,
            failed: 'Token creation failed',
            info: `Sending HTR to you.`,
          },
          status: 'completed',
          txHash: data.hash,
          groupTimestamp: Math.floor(Date.now() / 1000),
          timestamp: Math.floor(Date.now() / 1000),
          promise: Promise.resolve(),
          account: address,
        }
        const notificationGroup: string[] = []
        notificationGroup.push(JSON.stringify(notificationData))
        addNotification(notificationGroup)
        createSuccessToast(notificationData)
        setIsLoadingFaucet(false)

        // Mark the faucet as used in this session
        setFaucetUsed(true)

        // Refetch faucet status to update backend state
        refetchFaucetStatus()

        // After successful faucet operation, refresh balance
        refreshBalance()
      } else {
        setIsLoadingFaucet(false)
        createErrorToast(data.message, true)
      }
    },
    onError: (error) => {
      setIsLoadingFaucet(false)
      createErrorToast(`Error sending HTR to ${address}. \n${error}`, true)
    },
  })

  const handleGetTokens = () => {
    setIsLoadingFaucet(true)
    mutation.mutate({ address: address })
  }

  // Reset faucet used state when address changes
  useEffect(() => {
    if (address) {
      setFaucetUsed(false)
    }
  }, [address])

  useEffect(() => {
    const balance_user: BalanceProps[] = balance
      .filter((b: TokenBalance) => {
        const featured_tokens = tokens?.map((t) => t.uuid)
        return featured_tokens?.includes(b.token_uuid)
      })
      .map((b: TokenBalance) => {
        const user_tokens = tokens?.find((t) => t.uuid === b.token_uuid)
        return {
          token: user_tokens && tokens ? toToken(tokens.find((t) => t.uuid === b.token_uuid)) : undefined,
          balance: b.token_balance / 100,
          balanceUSD: prices && prices[b.token_uuid] ? (prices[b.token_uuid] * b.token_balance) / 100 : 0,
        }
      })
      .sort((a: BalanceProps, b: BalanceProps) => b.balanceUSD - a.balanceUSD)

    // Add EVM tokens USD value to the total balance
    setBalanceUSD(balance_user.reduce((acc, cur) => acc + cur.balanceUSD, 0) + evmTokensUsdValue)
  }, [balance, prices, tokens, evmTokensUsdValue])

  return (
    <>
      <div className="flex flex-col gap-8 p-4">
        <div className="flex justify-between gap-3">
          <Typography variant="sm" weight={600} className="flex items-center gap-1.5 text-stone-50">
            <JazzIcon diameter={16} address={address} />
            {shortenAddress(address)}
          </Typography>
          <div className="flex gap-3">
            <BuyCrypto address={address}>
              {(buyUrl) => (
                <IconButton as="a" target="_blank" href={buyUrl} className="p-0.5" description="Buy Crypto">
                  <CreditCardIcon width={18} height={18} />
                </IconButton>
              )}
            </BuyCrypto>
            <CopyHelper toCopy={address} hideIcon>
              {(isCopied) => (
                <IconButton className="p-0.5" description={isCopied ? 'Copied!' : 'Copy'}>
                  <Square2StackIcon width={18} height={18} />
                </IconButton>
              )}
            </CopyHelper>
            <IconButton
              as="a"
              target="_blank"
              href={chains[chainId].getAccountUrl(address)}
              className="p-0.5"
              description="Explore"
            >
              <ArrowTopRightOnSquareIcon width={18} height={18} />
            </IconButton>
            <IconButton
              as="button"
              onClick={() => refreshBalance()}
              disabled={isRefreshing}
              className="p-0.5"
              description="Refresh Balance"
            >
              <ArrowPathIcon width={18} height={18} className={isRefreshing ? 'animate-spin' : ''} />
            </IconButton>
            <IconButton as="button" onClick={() => logout()} className="p-0.5" description="Disconnect">
              <ArrowRightOnRectangleIcon width={18} height={18} />
            </IconButton>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-8">
          {isRefreshing ? (
            <div className="flex flex-col items-center justify-center gap-2">
              <Loader className="w-8 h-8 text-stone-400" />
              <Typography variant="sm" className="text-stone-500">
                Loading balance...
              </Typography>
            </div>
          ) : !isLoading && balanceUSD == 0 ? (
            <Typography variant="sm" className="text-center text-stone-500">
              No balance in this address
            </Typography>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2">
              <Typography variant="sm" className="text-stone-500">
                Total Balance
              </Typography>
              <Typography variant="h3" className="whitespace-nowrap">
                {/* {balance.toSignificant(3)} {Native.onChain(chainId).symbol} */}
                {balanceUSD ? `$ ${balanceUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : ''}
              </Typography>
            </div>
          )}
          {!isLoading && faucetAvailable && !faucetUsed && isTestnet && (
            <Button
              variant="outlined"
              className="px-8"
              onClick={() => handleGetTokens()}
              disabled={isLoadingFaucet || isRefreshing}
              size="xs"
            >
              {isLoadingFaucet ? 'Processing...' : 'Faucet'}
            </Button>
          )}
        </div>
      </div>
      <div className="px-2">
        <div className="w-full h-px mt-3 bg-stone-200/10" />
      </div>
      <div className="p-2">
        <button
          onClick={() => setView(ProfileView.Tokens)}
          className="flex text-sm font-semibold hover:text-stone-50 w-full text-stone-400 justify-between items-center hover:bg-white/[0.04] rounded-xl p-2 pr-1 py-2.5"
        >
          Tokens <ChevronRightIcon width={20} height={20} />
        </button>
      </div>
      <div className="px-2">
        <div className="w-full h-px bg-stone-200/10" />
      </div>
      <div className="p-2">
        <button
          onClick={() => setView(ProfileView.Transactions)}
          className="flex text-sm font-semibold hover:text-stone-50 w-full text-stone-400 justify-between items-center hover:bg-white/[0.04] rounded-xl p-2 pr-1 py-2.5"
        >
          Transactions <ChevronRightIcon width={20} height={20} />
        </button>
      </div>
      <div className="px-2">
        <div className="w-full h-px bg-stone-200/10" />
      </div>
      <div className="p-2">
        <button
          onClick={() => setView(ProfileView.TokensEVM)}
          className="flex text-sm font-semibold hover:text-stone-50 w-full text-stone-400 justify-between items-center hover:bg-white/[0.04] rounded-xl p-2 pr-1 py-2.5"
        >
          Tokens (EVM) <ChevronRightIcon width={20} height={20} />
        </button>
      </div>
    </>
  )
}
