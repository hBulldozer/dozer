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

// App store URLs for Hathor Wallet
const HATHOR_WALLET_IOS_URL = 'https://apps.apple.com/br/app/hathor-wallet/id1465041963'
const HATHOR_WALLET_ANDROID_URL = 'https://play.google.com/store/apps/details?id=network.hathor.wallet'

/**
 * Detects if the device is iOS
 */
const isIOSDevice = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase())
}

/**
 * Gets the appropriate app store URL based on the device
 */
const getAppStoreUrl = (): string => {
  return isIOSDevice() ? HATHOR_WALLET_IOS_URL : HATHOR_WALLET_ANDROID_URL
}

// Module-level state to track deep link attempts (avoids sessionStorage)
let deepLinkAttemptInProgress = false
let deepLinkTimeoutId: ReturnType<typeof setTimeout> | null = null

/**
 * Clears any pending deep link timeout and resets state
 */
export const clearDeepLinkAttempt = () => {
  if (deepLinkTimeoutId) {
    clearTimeout(deepLinkTimeoutId)
    deepLinkTimeoutId = null
  }
  deepLinkAttemptInProgress = false
}

/**
 * Opens the Hathor Wallet via deep link for WalletConnect
 * @param wcUri - The WalletConnect URI
 * @param isConnected - Whether the user is already connected (skip app store redirect)
 */
export const openHathorWalletDeepLink = (wcUri: string, isConnected = false): boolean => {
  if (typeof window === 'undefined') return false

  // Don't do anything if user is already connected
  if (isConnected) {
    return true
  }

  // Don't start a new attempt if one is already in progress
  if (deepLinkAttemptInProgress) {
    return true
  }

  try {
    const deepLink = `${HATHOR_WALLET_DEEP_LINK_SCHEME}://wc?uri=${encodeURIComponent(wcUri)}`

    deepLinkAttemptInProgress = true

    // Track if the app was opened (page became hidden)
    let appOpened = false

    // Listen for visibility change - if the page becomes hidden, the app was opened
    const handleVisibilityChange = () => {
      if (document.hidden) {
        appOpened = true
        // Cancel the timeout immediately when app opens
        clearDeepLinkAttempt()
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Try to open the deep link
    window.location.href = deepLink

    // After a delay, check if the app was opened
    // If not, redirect to the app store
    deepLinkTimeoutId = setTimeout(() => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)

      // Only redirect to app store if:
      // 1. Page is still visible (app didn't open)
      // 2. App wasn't opened (no visibility change occurred)
      // 3. Attempt is still in progress (not cancelled)
      if (!document.hidden && !appOpened && deepLinkAttemptInProgress) {
        clearDeepLinkAttempt()
        const appStoreUrl = getAppStoreUrl()
        window.location.href = appStoreUrl
      } else {
        clearDeepLinkAttempt()
      }
    }, 2500) // 2.5 seconds delay

    return true
  } catch (error) {
    console.warn('Failed to open Hathor wallet deeplink:', error)
    clearDeepLinkAttempt()
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
        // Session already exists, clear any pending deep link and return
        clearDeepLinkAttempt()
        setisWaitingApproval(false)
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
          if (isMobileDevice()) {
            // On mobile, open the deep link directly
            // The deep link function handles app store fallback if wallet isn't installed
            // Pass false for isConnected since we're initiating a new connection
            openHathorWalletDeepLink(uri, false)
          } else {
            // On desktop, show the QR code modal
            const standaloneChains = Object.values(requiredNamespaces)
              .map((namespace) => namespace.chains)
              .flat() as string[]
            web3Modal.openModal({ uri, standaloneChains })
          }
        }

        const session = await approval()
        // Clear any pending deep link timeout when connection succeeds
        clearDeepLinkAttempt()
        await onSessionConnected(session)
        // Update known pairings after session is connected.
        setPairings(client.pairing.getAll({ active: true }))
        setisWaitingApproval(false)
      } catch (e) {
        setisWaitingApproval(false)
        clearDeepLinkAttempt()
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
