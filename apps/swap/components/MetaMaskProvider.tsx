'use client'

import { FC, ReactNode } from 'react'
import { MetaMaskProvider as SDKProvider } from '@metamask/sdk-react'

interface MetaMaskProviderProps {
  children: ReactNode
}

export const MetaMaskProvider: FC<MetaMaskProviderProps> = ({ children }) => {
  // Get the current host for dapp metadata
  const host = process.env.NEXT_PUBLIC_SITE_URL

  // Detect if user is on mobile device
  const isMobile =
    typeof window !== 'undefined' &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  // SDK configuration options
  const sdkOptions = {
    logging: { developerMode: false },
    checkInstallationImmediately: false,
    checkInstallationOnAllCalls: false, // Only check on desktop where extensions are used
    extensionOnly: false,
    preferDesktop: !isMobile,
    forceInjectProvider: false,
    // More conservative deep link handling
    openDeeplink: (link: string) => {
      // Only open deep links on mobile and only if user initiated an action
      if (isMobile && typeof window !== 'undefined') {
        // Check if there's an active user gesture (e.g., recent click)
        const now = Date.now()
        const lastUserAction = (window as any).lastUserAction || 0

        // Only open if user action was within last 5 seconds
        if (now - lastUserAction < 5000) {
          console.log('Opening MetaMask deep link:', link)
          window.open(link, '_self')
        } else {
          console.log('Ignoring deep link - no recent user action')
        }
      }
    },
    dappMetadata: {
      name: 'Dozer Bridge',
      url: host,
      iconUrl: typeof window !== 'undefined' ? `${window.location.origin}/images/favicon-32x32.png` : undefined,
    },
  }

  return (
    <SDKProvider debug={false} sdkOptions={sdkOptions}>
      {children}
    </SDKProvider>
  )
}

export default MetaMaskProvider
