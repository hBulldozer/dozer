import { Popover } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/solid'
import { useBreakpoint } from '@dozer/hooks'
import { classNames, DEFAULT_INPUT_UNSTYLED, JazzIcon } from '@dozer/ui'
import Image from 'next/legacy/image'
import React, { FC, useState, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { useAccount, useNetwork } from '@dozer/zustand'

import { Wallet } from '..'
import { Default } from './Default'
import { Transactions } from './Transactions'
import { Portal } from './Portal'
import { shortenAddress } from './Utils'
// import { api } from '../../../utils/api'
import { client } from '@dozer/api'

interface ProfileProps {
  client: typeof client
}
export enum ProfileView {
  Default,
  Transactions,
}
export const Profile: FC<ProfileProps> = ({ client }) => {
  const { notifications, clearNotifications, updateNotificationStatus } = useAccount()
  const { isSm } = useBreakpoint('sm')
  const [view, setView] = useState<ProfileView>(ProfileView.Default)
  const { network } = useNetwork()
  const accountAddress = useAccount((state) => state.address)
  // const utils = api.useContext()
  // const htr = utils.getTokens.all.getData()
  // console.log(htr)
  const [address, setAddress] = useState('')
  const chainId = network
  // const { data, isLoading, isError, error } = useBalance(accountAddress)
  const { data, isLoading, isError, error } = client.getProfile.balance.useQuery(
    { address: accountAddress },
    { enabled: Boolean(accountAddress) }
  )
  const { setBalance } = useAccount()

  // const { data: avatar } = useEnsAvatar({
  //   address,
  // })

  useEffect(() => {
    setAddress(accountAddress)
  }, [accountAddress])

  useEffect(() => {
    if (address && data && !isLoading && !isError) {
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
  }, [data, isError, isLoading, address, error, setBalance])

  if (!address) {
    return <Wallet.Button size="sm" className="border-none shadow-md whitespace-nowrap" />
  }

  if (address) {
    const panel = (
      <Popover.Panel className="w-full sm:w-[320px] fixed bottom-0 left-0 right-0 sm:absolute sm:bottom-[unset] sm:left-[unset] mt-4 sm:rounded-xl rounded-b-none shadow-md shadow-black/[0.3] bg-stone-900 border border-stone-200/20">
        {view === ProfileView.Default && (
          <Default client={client} chainId={chainId} address={address} setView={setView} />
        )}
        {view === ProfileView.Transactions && (
          <Transactions
            setView={setView}
            notifications={notifications}
            clearNotifications={clearNotifications}
            updateNotificationStatus={updateNotificationStatus}
            client={client}
          />
        )}
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
              >
                <JazzIcon diameter={20} address={address} />
                {shortenAddress(address)}{' '}
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
