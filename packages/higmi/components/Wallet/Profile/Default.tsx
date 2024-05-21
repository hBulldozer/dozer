import { BuyCrypto, CopyHelper, IconButton, JazzIcon, Typography } from '@dozer/ui'
// import { useBalance, useDisconnect, useEnsAvatar } from '@dozer/zustand'
import { CreditCardIcon, DuplicateIcon, ExternalLinkIcon, LogoutIcon } from '@heroicons/react/outline'
import { ChevronRightIcon } from '@heroicons/react/solid'
import { Dispatch, FC, SetStateAction, useCallback, useEffect, useState } from 'react'

import { useHtrPrice } from '@dozer/react-query'
import { ProfileView } from './Profile'
import { useAccount } from '@dozer/zustand'
import { shortenAddress } from './Utils'
import { ChainId } from '@dozer/chain'
import { api } from '../../../utils/api'

interface DefaultProps {
  chainId: ChainId
  address: string
  setView: Dispatch<SetStateAction<ProfileView>>
}

export const Default: FC<DefaultProps> = ({ chainId, address, setView }) => {
  const setAddress = useAccount((state) => state.setAddress)
  const setBalance = useAccount((state) => state.setBalance)
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
  const [showBalance, setShowBalance] = useState<number | undefined>(0)
  const [showUsdtBalance, setShowUsdtBalance] = useState<number | undefined>(0)
  // const { isLoading, error, data: priceHTR } = useHtrPrice()
  const { isLoading, error, data } = api.getPrices.htr.useQuery()
  const priceHTR = data ? data : 0.01

  useEffect(() => {
    setShowBalance(
      balance?.find((token) => {
        return token.token_symbol == 'HTR'
      })?.token_balance
    )
    setShowUsdtBalance(
      balance?.find((token) => {
        return token.token_symbol == 'USDT'
      })?.token_balance
    )
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
              // href={chains[chainId].getAccountUrl(address)}
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
          <div className="flex flex-col items-center justify-center gap-2">
            <Typography variant="h3" className="whitespace-nowrap">
              {/* {balance.toSignificant(3)} {Native.onChain(chainId).symbol} */}
              {showBalance ? (showBalance / 100).toString() + ' HTR' : ''}
            </Typography>
            <Typography weight={600} className="text-stone-400">
              {/* {showBalance && showBalance != 0  ? '$' + ((showBalance / 100) * priceHTR).toFixed(2) : ''} */}
              {isLoading
                ? 'Loading'
                : showBalance && showBalance != 0
                ? '$' + ((showBalance / 100) * priceHTR).toFixed(2)
                : ''}
            </Typography>
          </div>

          <div className="flex flex-col items-center justify-center gap-2">
            <Typography variant="h3" className="whitespace-nowrap">
              {/* {balance.toSignificant(3)} {Native.onChain(chainId).symbol} */}
              {showUsdtBalance ? (showUsdtBalance / 100).toString() + ' USDT' : ''}
            </Typography>
            <Typography weight={600} className="text-stone-400">
              {/* {showBalance && showBalance != 0  ? '$' + ((showBalance / 100) * priceHTR).toFixed(2) : ''} */}
              {isLoading
                ? 'Loading'
                : showUsdtBalance && showUsdtBalance != 0
                ? '$' + (showUsdtBalance / 100).toFixed(2)
                : ''}
            </Typography>
          </div>
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
