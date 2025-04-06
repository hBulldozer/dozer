'use client'

import { FC, ReactNode } from 'react'
import { MetaMaskProvider as SDKProvider } from '@metamask/sdk-react'

interface MetaMaskProviderProps {
  children: ReactNode
}

export const MetaMaskProvider: FC<MetaMaskProviderProps> = ({ children }) => {
  // Get the current host for dapp metadata
  const host = typeof window !== 'undefined' ? window.location.host : 'defaultHost'

  // SDK configuration options
  const sdkOptions = {
    logging: { developerMode: false },
    checkInstallationImmediately: false,
    dappMetadata: {
      name: 'Dozer Bridge',
      url: host,
    },
  }

  return (
    <SDKProvider debug={false} sdkOptions={sdkOptions}>
      {children}
    </SDKProvider>
  )
}

export default MetaMaskProvider
