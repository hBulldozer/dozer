import { App, AppType } from '@dozer/ui'
import { useWalletConnectClient } from '@dozer/higmi'
import { Profile } from '@dozer/higmi/components/Wallet/Profile'
import React, { FC } from 'react'
import { useAccount } from '@dozer/zustand'

import { api } from 'utils/api'
import { isFeatureEnabled } from 'config/features'

// import { useNotifications } from '../lib/state/storage'

export const Header: FC = () => {
  const { accounts } = useWalletConnectClient()
  const { walletType, hathorAddress } = useAccount()

  // Get the appropriate address based on wallet type (kept for potential future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const address =
    walletType === 'walletconnect' ? (accounts.length > 0 ? accounts[0].split(':')[2] : '') : hathorAddress || ''

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
              // XP Points Campaign Links
              <App.NavItem
                key="points"
                href={`${process.env.NEXT_PUBLIC_SITE_URL}/points`}
                label="XP Points"
                className="text-yellow-400 hover:text-yellow-300"
              />,
              <App.NavItem
                key="leaderboard"
                href={`${process.env.NEXT_PUBLIC_SITE_URL}/leaderboard`}
                label="Leaderboard"
                className="text-yellow-400 hover:text-yellow-300"
              />,
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
