import { App, AppType } from '@dozer/ui'
import { useWalletConnectClient } from '@dozer/higmi'
import { Profile } from '@dozer/higmi/components/Wallet/Profile'
import React, { FC } from 'react'
import { useAccount } from '@dozer/zustand'

import { api } from 'utils/api'

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
          <App.NavItem
            className="text-transparent bg-clip-text bg-gradient-to-br from-amber-400 via-amber-100 to-yellow-500"
            href={`${process.env.NEXT_PUBLIC_SITE_URL}/pool/oasis`}
            label="Oasis"
          />
          <App.NavItem href="/" label="Swap" />
          <App.NavItem href="/tokens" label="Tokens" />
          <App.NavItem href={`${process.env.NEXT_PUBLIC_SITE_URL}/pool`} label="Pools" />
          {/* <App.NavItem href="https://t.me/hathor_solana_bot" label="Get HTR" external /> */}
          {/* <App.NavItem href={`${process.env.NEXT_PUBLIC_SITE_URL}/swap/bridge`} label="Bridge" /> */}
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
