import { App, AppType, Button } from '@dozer/ui'
import { useWalletConnectClient } from '@dozer/higmi'
import { Profile } from '@dozer/higmi/components/Wallet/Profile'
import React, { FC } from 'react'
import { useAccount } from '@dozer/zustand'
import { useRouter } from 'next/router'

import { api } from '../utils/api'

export const Header: FC = () => {
  const { accounts } = useWalletConnectClient()
  const { walletType, hathorAddress } = useAccount()
  const router = useRouter()

  // Get the appropriate address based on wallet type
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const address =
    walletType === 'walletconnect' ? (accounts && accounts.length > 0 ? accounts[0].split(':')[2] : '') : hathorAddress || ''

  // Check if we're on a campaign page that requires wallet connection
  const isCampaignPage =
    router.pathname.startsWith('/points') ||
    router.pathname.startsWith('/leaderboard') ||
    router.pathname.startsWith('/onboarding')

  return (
    <App.Header
      hide
      withScrollBackground={true}
      appType={AppType.Root}
      maxWidth="5xl"
      bgColor="bg-black"
      nav={
        isCampaignPage ? (
          <App.NavItemList>
            {[
              <App.NavItem
                key="points"
                href="/points"
                label="XP Points"
                className="text-yellow-400 hover:text-yellow-300"
              />,
              <App.NavItem
                key="leaderboard"
                href="/leaderboard"
                label="Leaderboard"
                className="text-yellow-400 hover:text-yellow-300"
              />,
            ]}
          </App.NavItemList>
        ) : undefined
      }
    >
      <div className="flex items-center gap-2">
        {isCampaignPage ? (
          <Profile client={api} />
        ) : (
          <Button as="a" href="/swap" size="sm" className="ml-4 whitespace-nowrap">
            Enter App
          </Button>
        )}
      </div>
    </App.Header>
  )
}
