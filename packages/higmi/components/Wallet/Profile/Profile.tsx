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

export enum ProfileView {
  Default,
  Transactions,
}

// interface ProfileProps {
//   notifications: Record<number, string[]>
//   clearNotifications(): void
// }

export const Profile: FC = () => {
  const { isSm } = useBreakpoint('sm')
  const [view, setView] = useState<ProfileView>(ProfileView.Default)
  const { network } = useNetwork()
  const address = useAccount((state) => state.address)
  const chainId = network

  // const { data: avatar } = useEnsAvatar({
  //   address,
  // })

  const ref = useRef<Element | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    ref.current = document.querySelector<HTMLElement>('#portal')
    setMounted(true)
  }, [])

  if (!address) {
    return <Wallet.Button size="sm" className="border-none shadow-md whitespace-nowrap" />
  }

  if (address) {
    const panel = (
      <Popover.Panel className="w-full sm:w-[320px] fixed bottom-0 left-0 right-0 sm:absolute sm:bottom-[unset] sm:left-[unset] mt-4 sm:rounded-xl rounded-b-none shadow-md shadow-black/[0.3] bg-stone-900 border border-stone-200/20">
        {view === ProfileView.Default && <Default chainId={chainId} address={address} setView={setView} />}
        {view === ProfileView.Transactions && <Transactions setView={setView} />}
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
