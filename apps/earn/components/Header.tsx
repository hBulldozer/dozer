import { App, AppType, BuyCrypto } from '@dozer/ui'
import { NetworkSelector, useWalletConnectClient } from '@dozer/higmi'
import { Profile } from '@dozer/higmi/components/Wallet/Profile'
import React, { FC, useState } from 'react'
// import { useAccount } from 'wagmi'
import { api } from '../utils/api'
import { SUPPORTED_CHAIN_IDS } from '../config'
import { useAccount } from '@dozer/zustand'
// import { useNotifications } from '../lib/state/storage'

export const Header: FC = () => {
  const { accounts } = useWalletConnectClient()
  const address = accounts.length > 0 ? accounts[0].split(':')[2] : ''
  // const [notifications, { clearNotifications }] = useNotifications(address)
  const [open, setOpen] = useState(false)

  return (
    <App.Header
      withScrollBackground={true}
      appType={AppType.Root}
      nav={
        <App.NavItemList>
          <App.NavItem
            className=" bg-clip-text text-transparent bg-gradient-to-br from-amber-400 via-amber-100 to-yellow-500"
            href="https://forms.gle/8cEKvsaNrTP4c8Ef6"
            label="Pre-Sale"
            external
          />
          <App.NavItem href="../../swap" label="Swap" external target="_blank" />
          <App.NavItem href="../../swap/tokens" label="Tokens" external target="_blank" />
          <App.NavItem href={'/'} label="Pools" />
          {/* <App.NavItem href={`https://mvp.dozer.finance/pool`} label="Pools" /> */}
          {/* <App.NavItem href="https://mvp.dozer.finance/bridge" label="Bridge" /> */}
          {/* <BuyCrypto address={address} /> */}
          <App.OpenModal label="Donate" setOpen={setOpen} />
          <App.DonateModal open={open} setOpen={setOpen} />
        </App.NavItemList>
      }
    >
      <div className="flex items-center gap-2">
        {/* <NetworkSelector supportedNetworks={SUPPORTED_CHAIN_IDS} /> */}
        <Profile
          // supportedNetworks={SUPPORTED_CHAIN_IDS}
          // notifications={notifications}
          // clearNotifications={clearNotifications}
          client={api}
        />
      </div>
    </App.Header>
  )
}
