import { App, AppType, BuyCrypto } from '@dozer/ui'
import { NetworkSelector, useWalletConnectClient } from '@dozer/higmi'
import { Profile } from '@dozer/higmi/components/Wallet/Profile'
import React, { FC, useState } from 'react'
// import { useAccount } from 'higmi'

import { api } from 'utils/api'
import { isFeatureEnabled } from 'config/features'

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
          {
            [
              // Oasis feature is currently hidden via feature flag
              isFeatureEnabled('OASIS_ENABLED') && (
                <App.NavItem
                  key="oasis"
                  className="text-transparent bg-clip-text bg-gradient-to-br from-amber-400 via-amber-100 to-yellow-500"
                  href={`${process.env.NEXT_PUBLIC_SITE_URL}/pool/oasis`}
                  label="Oasis"
                />
              ),
              <App.NavItem key="swap" href="/" label="Swap" />,
              <App.NavItem key="tokens" href="/tokens" label="Tokens" />,
              <App.NavItem key="pools" href={`${process.env.NEXT_PUBLIC_SITE_URL}/pool`} label="Pools" />,
            ].filter(Boolean) as React.ReactElement[]
          }
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
