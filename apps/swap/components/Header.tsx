import { App, AppType, BuyCrypto } from '@dozer/ui'
import { NetworkSelector } from '@dozer/higmi'
import { Profile } from '@dozer/higmi/components/Wallet/Profile'
import React, { FC } from 'react'
// import { useAccount } from 'higmi'

import { SUPPORTED_CHAIN_IDS } from '../config'
import { api } from 'utils/api'
import { useAccount } from '@dozer/zustand'
// import { useNotifications } from '../lib/state/storage'

export const Header: FC = () => {
  const { address } = useAccount()
  // const [notifications, { clearNotifications }] = useNotifications(address)

  return (
    <App.Header
      withScrollBackground={true}
      appType={AppType.Swap}
      nav={
        <App.NavItemList>
          <App.NavItem href="https://forms.gle/NSt93HY8TXpQv4U96" label="MVP Form" />
          <App.NavItem href="/" label="Swap" />
          <App.NavItem href="/tokens" label="Tokens" />
          {/* <App.NavItem href={`https://mvp.dozer.finance/pool`} label="Pools" /> */}
          {/* <App.NavItem href="https://mvp.dozer.finance/bridge" label="Bridge" /> */}
          <BuyCrypto address={address} />
        </App.NavItemList>
      }
    >
      <div className="flex items-center gap-2">
        {/* <NetworkSelector supportedNetworks={SUPPORTED_CHAIN_IDS} /> */}
        <Profile
          client={api}
          // supportedNetworks={SUPPORTED_CHAIN_IDS}
          // notifications={notifications}
          // clearNotifications={clearNotifications}
        />
      </div>
    </App.Header>
  )
}
