import { BuyCrypto, CopyHelper, Currency, IconButton, JazzIcon, Typography } from '@dozer/ui'
// import { useBalance, useDisconnect, useEnsAvatar } from '@dozer/zustand'
import { CreditCardIcon, DuplicateIcon, ExternalLinkIcon, LogoutIcon } from '@heroicons/react/outline'
import { ChevronRightIcon } from '@heroicons/react/solid'
import { Dispatch, FC, SetStateAction, useCallback, useEffect, useRef, useState } from 'react'

import { useHtrPrice } from '@dozer/react-query'
import { ProfileView } from './Profile'
import { TokenBalance, useAccount, useNetwork } from '@dozer/zustand'
import { shortenAddress } from './Utils'
import chains, { ChainId } from '@dozer/chain'

import { client, toToken } from '@dozer/api'
import { Token } from '@dozer/currency'
import { useInViewport } from '@dozer/hooks'

interface DefaultProps {
  chainId: ChainId
  address: string
  setView: Dispatch<SetStateAction<ProfileView>>
  client: typeof client
}

interface BalanceProps {
  balance: number
  balanceUSD: number
  token: Token | undefined
}

export const Default: FC<DefaultProps> = ({ chainId, address, setView, client }) => {
  const setAddress = useAccount((state) => state.setAddress)
  const setBalance = useAccount((state) => state.setBalance)
  const { data: prices } = client.getPrices.all.useQuery()
  const { data: tokens } = client.getTokens.all.useQuery()
  const { network } = useNetwork()
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

  function disconnect() {
    setAddress('')
    setBalance([])
  }
  // useDisconnect()

  // const [usdPrice, setUsdPrice] = useState<number>(0)
  // const balanceAsUsd = prices ? prices['00'] : 0
  const [showBalance1, setShowBalance1] = useState<BalanceProps | undefined>(undefined)
  const [showBalance2, setShowBalance2] = useState<BalanceProps | undefined>(undefined)
  const ref = useRef<HTMLDivElement>(null)
  const inViewport = useInViewport(ref)
  // const { isLoading, error, data: priceHTR } = useHtrPrice()
  const { isLoading, error, data } = client.getPrices.htr.useQuery()
  const priceHTR = data ? data : 0.01

  useEffect(() => {
    const balance_user: BalanceProps[] = balance
      .map((b: TokenBalance) => {
        return {
          token: tokens ? toToken(tokens.find((t) => t.uuid === b.token_uuid)) : undefined,
          balance: b.token_balance / 100,
          balanceUSD: prices ? (prices[b.token_uuid] * b.token_balance) / 100 : 0,
        }
      })
      .sort((a: BalanceProps, b: BalanceProps) => b.balanceUSD - a.balanceUSD)

    setShowBalance1(balance_user[0])
    setShowBalance2(balance_user[1])
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
                  <DuplicateIcon width={18} height={18} />
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
              <ExternalLinkIcon width={18} height={18} />
            </IconButton>
            <IconButton as="button" onClick={() => disconnect()} className="p-0.5" description="Disconnect">
              <LogoutIcon width={18} height={18} />
            </IconButton>
          </div>
        </div>
        <div className="flex justify-center gap-8">
          {!isLoading && !showBalance1 && !showBalance2 ? (
            <Typography variant="sm" className="text-center text-stone-500">
              No balances in this address
            </Typography>
          ) : null}
          {showBalance1 ? (
            <div className="flex flex-col items-center justify-center gap-2">
              <Currency.Icon
                width={20}
                height={20}
                currency={
                  new Token({
                    chainId: network,
                    uuid: showBalance1.token?.uuid || 'HTR',
                    symbol: showBalance1.token?.symbol,
                    name: showBalance1.token?.name,
                    decimals: 2,
                  })
                }
                priority={inViewport}
              />

              <Typography variant="h3" className="whitespace-nowrap">
                {/* {balance.toSignificant(3)} {Native.onChain(chainId).symbol} */}
                {showBalance1 ? showBalance1.balance.toLocaleString(undefined, { maximumFractionDigits: 2 }) : ''}
              </Typography>
              <Typography weight={600} className="text-stone-400">
                {/* {showBalance1 && showBalance1 != 0  ? '$' + ((showBalance1 / 100) * priceHTR).toFixed(2) : ''} */}
                {isLoading
                  ? 'Loading'
                  : showBalance1 && showBalance1.balance && showBalance1.balanceUSD != 0
                  ? '$' + showBalance1.balanceUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })
                  : ''}
              </Typography>
            </div>
          ) : null}

          {showBalance2 ? (
            <div className="flex flex-col items-center justify-center gap-2">
              <Currency.Icon
                width={20}
                height={20}
                currency={
                  new Token({
                    chainId: network,
                    decimals: 2,
                    uuid: showBalance2.token?.uuid || 'USDT',
                    symbol: showBalance2.token?.symbol,
                    name: showBalance2.token?.name,
                  })
                }
                priority={inViewport}
              />

              <Typography variant="h3" className="whitespace-nowrap">
                {/* {balance.toSignificant(3)} {Native.onChain(chainId).symbol} */}
                {showBalance2 ? showBalance2.balance.toLocaleString(undefined, { maximumFractionDigits: 2 }) : ''}
              </Typography>
              <Typography weight={600} className="text-stone-400">
                {/* {showBalance1 && showBalance1 != 0  ? '$' + ((showBalance1 / 100) * priceHTR).toFixed(2) : ''} */}
                {isLoading
                  ? 'Loading'
                  : showBalance2 && showBalance2.balance && showBalance2.balanceUSD != 0
                  ? '$' + showBalance2.balanceUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })
                  : ''}
              </Typography>
            </div>
          ) : null}
        </div>
      </div>
      <div className="px-2">
        <div className="w-full h-px mt-3 bg-stone-200/10" />
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
