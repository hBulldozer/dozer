import type { MetaMaskInpageProvider } from '@metamask/providers'

export type GetSnapsResponse = Record<string, Snap>

export type Snap = {
  permissionName: string
  id: string
  version: string
  initialPermissions: Record<string, unknown>
}

declare global {
  interface Window {
    ethereum?: MetaMaskInpageProvider & {
      providers?: MetaMaskInpageProvider[]
      detected?: MetaMaskInpageProvider[]
    }
  }
}

type EIP6963AnnounceProviderEvent = CustomEvent<{
  info: {
    uuid: string
    name: string
    icon: string
    rdns: string
  }
  provider: MetaMaskInpageProvider
}>

declare global {
  interface WindowEventMap {
    'eip6963:announceProvider': EIP6963AnnounceProviderEvent
  }
}
