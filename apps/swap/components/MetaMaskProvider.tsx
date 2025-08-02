'use client'

import { FC, ReactNode } from 'react'
import { MetaMaskProvider as SDKProvider } from '@metamask/sdk-react'

interface MetaMaskProviderProps {
  children: ReactNode
}

export const MetaMaskProvider: FC<MetaMaskProviderProps> = ({ children }) => {
  // Get the current host for dapp metadata
  const host = typeof window !== 'undefined' ? window.location.host : 'defaultHost'

  // Detect if user is on mobile device
  const isMobile = typeof window !== 'undefined' && 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  // SDK configuration options
  const sdkOptions = {
    logging: { developerMode: false },
    checkInstallationImmediately: false,
    checkInstallationOnAllCalls: true,
    extensionOnly: false,
    preferDesktop: !isMobile,
    forceInjectProvider: false,
    openDeeplink: (link: string) => {
      // Custom deep link handling for better mobile app connectivity
      if (isMobile) {
        console.log('Opening MetaMask deep link:', link)
        window.open(link, '_self')
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
