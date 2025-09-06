import { App, AppType } from '@dozer/ui'
import { useWalletConnectClient } from '@dozer/higmi'
import { Profile } from '@dozer/higmi/components/Wallet/Profile'
import React, { FC } from 'react'
import { api } from '../utils/api'
import { useAccount } from '@dozer/zustand'
import { isFeatureEnabled } from '../config/features'

export const Header: FC = () => {
  const { accounts } = useWalletConnectClient()
  const { walletType, hathorAddress } = useAccount()
  
  // Get the appropriate address based on wallet type (kept for potential future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const address = walletType === 'walletconnect' 
    ? (accounts.length > 0 ? accounts[0].split(':')[2] : '') 
    : hathorAddress || ''

  return (
    <App.Header
      appType={AppType.Root}
      nav={
        <App.NavItemList>
          {[
            // Oasis feature is currently hidden via feature flag
            isFeatureEnabled('OASIS_ENABLED') && (
              <App.NavItem
                key="oasis"
                className="text-transparent bg-clip-text bg-gradient-to-br from-amber-400 via-amber-100 to-yellow-500"
                href="/oasis"
                label="Oasis"
              />
            ),
            <App.NavItem key="swap" href={`${process.env.NEXT_PUBLIC_SITE_URL}/swap`} label="Swap" />,
            <App.NavItem key="tokens" href={`${process.env.NEXT_PUBLIC_SITE_URL}/swap/tokens`} label="Tokens" />,
            <App.NavItem key="pools" href={'/'} label="Pools" />,
          ].filter(Boolean) as React.ReactElement[]}
          {/* <App.NavItem href="https://t.me/hathor_solana_bot" label="Get HTR" external /> */}
          {/* <App.NavItem href={`https://mvp.dozer.finance/pool`} label="Pools" /> */}
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
          // supportedNetworks={SUPPORTED_CHAIN_IDS}
          // notifications={notifications}
          // clearNotifications={clearNotifications}
          client={api}
        />
      </div>
    </App.Header>
  )
}
