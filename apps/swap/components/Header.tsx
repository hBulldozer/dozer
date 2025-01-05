import { App, AppType, BuyCrypto } from '@dozer/ui'
import { NetworkSelector, useWalletConnectClient } from '@dozer/higmi'
import { Profile } from '@dozer/higmi/components/Wallet/Profile'
import React, { FC, useState } from 'react'
// import { useAccount } from 'higmi'

import { api } from 'utils/api'

// import { useNotifications } from '../lib/state/storage'

export const Header: FC = () => {
  // const { address } = useAccount()
  const { accounts } = useWalletConnectClient()
  const address = accounts.length > 0 ? accounts[0].split(':')[2] : ''
  const [open, setOpen] = useState(false)

  // const [notifications, { clearNotifications }] = useNotifications(address)

  return (
    <App.Header
      appType={AppType.Swap}
      nav={
        <App.NavItemList>
          <App.NavItem
            className="text-transparent bg-clip-text bg-gradient-to-br from-amber-400 via-amber-100 to-yellow-500"
            href="https://forms.gle/8cEKvsaNrTP4c8Ef6"
            label="Presale"
            external
          />
          <App.NavItem href="/" label="Swap" />
          <App.NavItem href="/tokens" label="Tokens" />
          <App.NavItem href="https://5years.dozer.finance/pool" label="Pools" />
          {/* <App.NavItem href="https://mvp.dozer.finance/bridge" label="Bridge" /> */}
          {/* <BuyCrypto address={address} /> */}
          {/* <App.OpenModal label="Donate" setOpen={setOpen} />
          <App.DonateModal open={open} setOpen={setOpen} /> */}
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
