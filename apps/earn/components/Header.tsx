import { App, AppType, BuyCrypto } from '@dozer/ui'
import { NetworkSelector } from '@dozer/higmi'
import { Profile } from '@dozer/higmi/components/Wallet/Profile'
import React, { FC } from 'react'
// import { useAccount } from 'wagmi'
import { api } from '../utils/api'
import { SUPPORTED_CHAIN_IDS } from '../config'
import { useAccount } from '@dozer/zustand'
// import { useNotifications } from '../lib/state/storage'

export const Header: FC = () => {
  const { address } = useAccount()
  // const [notifications, { clearNotifications }] = useNotifications(address)

  return (
    <App.Header
      withScrollBackground={true}
      appType={AppType.Root}
      nav={
        <App.NavItemList>
          <App.NavItem href="https://mvp.dozer.finance/swap" label="Swap" />
          {/* <App.NavItem href="https://mvp.dozer.finance/swap/tokens" label="Tokens" /> */}
          {/* <App.NavItem href={`https://mvp.dozer.finance/pool`} label="Pools" /> */}
          {/* <App.NavItem href="https://mvp.dozer.finance/bridge" label="Bridge" /> */}
          {/* <BuyCrypto address={address} /> */}
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
