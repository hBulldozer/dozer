import Client from '@walletconnect/sign-client'
import { PairingTypes, SessionTypes } from '@walletconnect/types'
import { Web3Modal } from '@web3modal/standalone'

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState, useRef } from 'react'

import { getSdkError } from '@walletconnect/utils'
import config from '../../config/bridge'
import { getRequiredNamespaces } from './namespaces'

export const HATHOR_WALLET_DEEP_LINK_SCHEME = 'hathorwallet'

export const DEFAULT_APP_METADATA = {
  name: 'Dozer App',
  description: 'Dozer Finance',
  url: 'https://dozer.finance/',
  icons: ['https://avatars.githubusercontent.com/u/123419528'],
}

/**
 * Types
 */
interface IContext {
  client: Client | undefined
  session: SessionTypes.Struct | undefined
  connect: (pairing?: { topic: string }) => Promise<void>
  disconnect: () => Promise<void>
  isInitializing: boolean
  isWaitingApproval: boolean
  chains: string[]
  relayerRegion: string
  pairings: PairingTypes.Struct[]
  accounts: string[]
  setChains: any
  setRelayerRegion: any
}

/**
 * Context
 */
export const ClientContext = createContext<IContext>({} as IContext)

/**
 * Detects if the user is on a mobile device
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
  // Check for mobile user agents
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase())
}

/**
 * Attempts to open Hathor wallet via deeplink with fallback detection.
 * Uses visibility change detection to determine if the deeplink was successful.
 *
 * @param wcUri - The WalletConnect URI to pass to the wallet
 * @param onFallback - Optional callback if deeplink fails (wallet not installed)
 * @returns boolean indicating if the deeplink attempt was made (not if it succeeded)
 */
export const openHathorWalletDeepLink = (wcUri: string, onFallback?: () => void): boolean => {
  if (typeof window === 'undefined') return false

  // Only open deeplink on mobile devices
  if (!isMobileDevice()) return false

  const deepLink = `${HATHOR_WALLET_DEEP_LINK_SCHEME}://wc?uri=${encodeURIComponent(wcUri)}`

  // Track if the deeplink was successful (page lost visibility)
  let deeplinkSucceeded = false
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const cleanup = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('pagehide', handlePageHide)
  }

  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Page became hidden, deeplink likely worked
      deeplinkSucceeded = true
      cleanup()
    }
  }

  const handlePageHide = () => {
    // Page is being hidden (app switching), deeplink likely worked
    deeplinkSucceeded = true
    cleanup()
  }

  // Set up listeners before opening the deeplink
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('pagehide', handlePageHide)

  try {
    // Store current time to check if we stayed on the page
    const startTime = Date.now()

    // Create a clickable link and programmatically click it
    // This approach tends to fail more gracefully than window.location.href
    // and avoids popup blocker issues compared to window.open
    const link = document.createElement('a')
    link.href = deepLink
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Set a timeout to check if the deeplink worked
    // If the page is still visible after 2 seconds, the deeplink likely failed
    timeoutId = setTimeout(() => {
      cleanup()

      // Check if significant time passed and page is still visible
      const elapsed = Date.now() - startTime
      if (!deeplinkSucceeded && elapsed >= 1800 && !document.hidden) {
        console.warn('Hathor wallet deeplink may have failed - wallet might not be installed')
        if (onFallback) {
          onFallback()
        }
      }
    }, 2000)

    return true
  } catch (error) {
    cleanup()
    console.warn('Failed to open Hathor wallet deeplink:', error)
    if (onFallback) {
      onFallback()
    }
    return false
  }
}

/**
 * Web3Modal Config
 */
const web3Modal = new Web3Modal({
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID || '',
  themeMode: 'dark',
  walletConnectVersion: 2,
  themeVariables: {
    '--w3m-font-family': 'Inter, sans-serif',
    '--w3m-z-index': '99999',
    '--w3m-background-color': '#000000',
    '--w3m-accent-color': '#eab308',
  },
  enableExplorer: false,
  mobileWallets: [
    {
      id: 'hathor-wallet',
      name: 'Hathor Wallet',
      links: { universal: 'https://hathor.network/htr#wallet', native: `${HATHOR_WALLET_DEEP_LINK_SCHEME}://wc` },
    },
  ],
  walletImages: { 'hathor-wallet': '/logos/HTR.svg' },
})

/**
 * Provider
 */
export function ClientContextProvider({ children }: { children: ReactNode | ReactNode[] }) {
  const [client, setClient] = useState<Client>()
  const [pairings, setPairings] = useState<PairingTypes.Struct[]>([])
  const [session, setSession] = useState<SessionTypes.Struct>()
  const [isWaitingApproval, setisWaitingApproval] = useState(false)

  const [isInitializing, setIsInitializing] = useState(false)
  const prevRelayerValue = useRef<string>('')

  const [accounts, setAccounts] = useState<string[]>([])
  const [chains, setChains] = useState<string[]>([])
  const [relayerRegion, setRelayerRegion] = useState<string>(process.env.NEXT_PUBLIC_RELAY_URL!)

  const reset = () => {
    setSession(undefined)
    setAccounts([])
    setChains([])
    setRelayerRegion(process.env.NEXT_PUBLIC_RELAY_URL!)
  }

  const onSessionConnected = useCallback(async (_session: SessionTypes.Struct) => {
    const allNamespaceAccounts = Object.values(_session.namespaces)
      .map((namespace) => namespace.accounts)
      .flat()
    const allNamespaceChains = Object.keys(_session.namespaces)

    setSession(_session)
    setChains(allNamespaceChains)
    setAccounts(allNamespaceAccounts)
  }, [])

  const connect = useCallback(
    async (pairing: any) => {
      setisWaitingApproval(true)
      if (typeof client === 'undefined') {
        throw new Error('WalletConnect is not initialized')
      }
      if (session != null) {
        // Session already exists, return success
        return
      }

      try {
        // Use requiredNamespaces to ensure the wallet supports all required methods
        // This is necessary for desktop wallet compatibility
        // Only require the chain that matches the current environment
        const chains = [config.hathorConfig.rpcChain]
        const requiredNamespaces = getRequiredNamespaces(chains)

        const { uri, approval } = await client.connect({
          pairingTopic: pairing?.topic,
          requiredNamespaces,
        })

        // Open QRCode modal if a URI was returned (i.e. we're not connecting an existing pairing).
        if (uri) {
          // Create a flat array of all requested chains across namespaces.
          const standaloneChains = Object.values(requiredNamespaces)
            .map((namespace) => namespace.chains)
            .flat() as string[]

          // On mobile, try deeplink first with QR modal as fallback
          // (QR codes aren't ideal on mobile, but useful if wallet isn't installed)
          const deeplinkOpened = openHathorWalletDeepLink(uri, () => {
            // Fallback: if deeplink fails (wallet not installed), show QR modal
            // This provides a better UX than showing a browser error
            web3Modal.openModal({ uri, standaloneChains })
          })

          // On desktop (when deeplink wasn't attempted), show QR modal directly
          if (!deeplinkOpened) {
            web3Modal.openModal({ uri, standaloneChains })
          }
        }

        const session = await approval()
        await onSessionConnected(session)
        // Update known pairings after session is connected.
        setPairings(client.pairing.getAll({ active: true }))
        setisWaitingApproval(false)
      } catch (e) {
        setisWaitingApproval(false)
        console.error(e)
        // ignore rejection
      } finally {
        setisWaitingApproval(false)
        // close modal in case it was open
        web3Modal.closeModal()
      }
    },
    [client, session, onSessionConnected]
  )

  const disconnect = useCallback(async () => {
    if (typeof client === 'undefined') {
      throw new Error('WalletConnect is not initialized')
    }
    if (typeof session === 'undefined') {
      throw new Error('Session is not connected')
    }

    try {
      await client.disconnect({
        topic: session.topic,
        reason: getSdkError('USER_DISCONNECTED'),
      })
    } catch (error) {
      console.error('SignClient.disconnect failed:', error)
    } finally {
      // Reset app state after disconnect.
      reset()
    }
  }, [client, session])

  const _subscribeToEvents = useCallback(
    async (_client: Client) => {
      if (typeof _client === 'undefined') {
        throw new Error('WalletConnect is not initialized')
      }

      _client.on('session_ping', (args) => {
        console.log('EVENT', 'session_ping', args)
      })

      _client.on('session_event', (args) => {
        console.log('EVENT', 'session_event', args)
      })

      _client.on('session_update', ({ topic, params }) => {
        console.log('EVENT', 'session_update', { topic, params })
        const { namespaces } = params
        const _session = _client.session.get(topic)
        const updatedSession = { ..._session, namespaces }
        onSessionConnected(updatedSession)
      })

      _client.on('session_delete', () => {
        console.log('EVENT', 'session_delete')
        reset()
      })
    },
    [onSessionConnected]
  )

  const _checkPersistedState = useCallback(
    async (_client: Client) => {
      if (typeof _client === 'undefined') {
        throw new Error('WalletConnect is not initialized')
      }
      // populates existing pairings to state
      setPairings(_client.pairing.getAll({ active: true }))

      if (typeof session !== 'undefined') return
      // populates (the last) existing session to state
      if (_client.session.length) {
        const lastKeyIndex = _client.session.keys.length - 1
        const _session = _client.session.get(_client.session.keys[lastKeyIndex])
        await onSessionConnected(_session)
        return _session
      }
    },
    [session, onSessionConnected]
  )

  const createClient = useCallback(async () => {
    try {
      setIsInitializing(true)

      const _client = await Client.init({
        logger: 'debug',
        relayUrl: relayerRegion,
        projectId: process.env.NEXT_PUBLIC_PROJECT_ID || '',
        metadata: DEFAULT_APP_METADATA,
      })

      setClient(_client)
      prevRelayerValue.current = relayerRegion
      await _subscribeToEvents(_client)
      await _checkPersistedState(_client)
    } catch (err) {
      throw err
    } finally {
      setIsInitializing(false)
    }
  }, [_checkPersistedState, _subscribeToEvents, relayerRegion])

  useEffect(() => {
    if (!client || prevRelayerValue.current !== relayerRegion) {
      createClient()
    }
  }, [client, createClient, relayerRegion])

  const value = useMemo(
    () => ({
      pairings,
      isInitializing,
      isWaitingApproval,
      accounts,
      chains,
      relayerRegion,
      client,
      session,
      connect,
      disconnect,
      setChains,
      setRelayerRegion,
    }),
    [
      pairings,
      isInitializing,
      isWaitingApproval,
      accounts,
      chains,
      relayerRegion,
      client,
      session,
      connect,
      disconnect,
      setChains,
      setRelayerRegion,
    ]
  )

  return (
    <ClientContext.Provider
      value={{
        ...value,
      }}
    >
      {children}
    </ClientContext.Provider>
  )
}

export function useWalletConnectClient() {
  const context = useContext(ClientContext)
  if (context === undefined) {
    throw new Error('useWalletConnectClient must be used within a ClientContextProvider')
  }
  return context
}
