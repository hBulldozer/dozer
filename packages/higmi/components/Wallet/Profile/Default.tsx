import { BuyCrypto, CopyHelper, Currency, IconButton, JazzIcon, Typography } from '@dozer/ui'
import {
  CreditCardIcon,
  Square2StackIcon,
  ArrowTopRightOnSquareIcon,
  ArrowRightOnRectangleIcon,
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

interface DefaultProps {
  chainId: ChainId
  address: string
  setView: Dispatch<SetStateAction<ProfileView>>
  api_client: typeof client
}

interface BalanceProps {
  balance: number
  balanceUSD: number
  token: Token | undefined
}

export const Default: FC<DefaultProps> = ({ chainId, address, setView, api_client }) => {
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

  function logout() {
    // setAddress('')
    setBalance([])
    if (accounts.length > 0) disconnect()
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
          balanceUSD: prices ? (prices[b.token_uuid] * b.token_balance) / 100 : 0,
        }
      })
      .sort((a: BalanceProps, b: BalanceProps) => b.balanceUSD - a.balanceUSD)

    setBalanceUSD(balance_user.reduce((acc, cur) => acc + cur.balanceUSD, 0))
  }, [balance])

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
            <IconButton as="button" onClick={() => logout()} className="p-0.5" description="Disconnect">
              <ArrowRightOnRectangleIcon width={18} height={18} />
            </IconButton>
          </div>
        </div>
        <div className="flex justify-center gap-8">
          {!isLoading && balanceUSD == 0 ? (
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
          Show Tokens <ChevronRightIcon width={20} height={20} />
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
    </>
  )
}
