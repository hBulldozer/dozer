import { App, AppType } from '@dozer/ui'
import { useWalletConnectClient } from '@dozer/higmi'
import { Profile } from '@dozer/higmi/components/Wallet/Profile'
import React, { FC } from 'react'
import { api } from '../utils/api'
import { useAccount } from '@dozer/zustand'
// import { useNotifications } from '../lib/state/storage'

export const Header: FC = () => {
  const { accounts } = useWalletConnectClient()
  const { walletType, hathorAddress } = useAccount()

  // Get the appropriate address based on wallet type
  // For WalletConnect: use accounts array
  // For MetaMask Snap: use hathorAddress from useAccount
  const address =
    walletType === 'walletconnect' ? (accounts.length > 0 ? accounts[0].split(':')[2] : '') : hathorAddress || ''

  return (
    <App.Header
      appType={AppType.Root}
      nav={
        <App.NavItemList>
          <App.NavItem
            className="text-transparent bg-clip-text bg-gradient-to-br from-amber-400 via-amber-100 to-yellow-500"
            href="/oasis"
            label="Oasis"
          />
          <App.NavItem href={`${process.env.NEXT_PUBLIC_SITE_URL}/swap`} label="Swap" />
          <App.NavItem href={`${process.env.NEXT_PUBLIC_SITE_URL}/swap/tokens`} label="Tokens" />
          <App.NavItem href={'/'} label="Pools" />
          {/* <App.NavItem href="https://t.me/hathor_solana_bot" label="Get HTR" external /> */}
          {/* <App.NavItem href={`${process.env.NEXT_PUBLIC_SITE_URL}/pool`} label="Pools" /> */}
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
          // supportedNetworks={SUPPORTED_CHAIN_IDS}
          // notifications={notifications}
          // clearNotifications={clearNotifications}
          client={api}
        />
      </div>
    </App.Header>
  )
}
