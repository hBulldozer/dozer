import Client from '@walletconnect/sign-client'
import { PairingTypes, SessionTypes } from '@walletconnect/types'
import { getSdkError } from '@walletconnect/utils'
import { Web3Modal } from '@web3modal/standalone'

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState, useRef } from 'react'

import { getRequiredNamespaces } from './namespaces'

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
  isFetchingBalances: boolean
  setChains: any
  setRelayerRegion: any
}

/**
 * Context
 */
export const ClientContext = createContext<IContext>({} as IContext)

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
  mobileWallets: [],
  desktopWallets: [],
})

/**
 * Provider
 */
export function ClientContextProvider({ children }: { children: ReactNode | ReactNode[] }) {
  const [client, setClient] = useState<Client>()
  const [pairings, setPairings] = useState<PairingTypes.Struct[]>([])
  const [session, setSession] = useState<SessionTypes.Struct>()

  const [isFetchingBalances, setIsFetchingBalances] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [isWaitingApproval, setIsWaitingApproval] = useState(false)
  const prevRelayerValue = useRef<string>('')

  const [accounts, setAccounts] = useState<string[]>([])
  const [chains, setChains] = useState<string[]>([])
  const [relayerRegion, setRelayerRegion] = useState<string>(process.env.DEFAULT_RELAY_URL || '')

  const reset = () => {
    setSession(undefined)
    setAccounts([])
    setChains([])
    setRelayerRegion(process.env.DEFAULT_RELAY_URL || '')
  }

  const getAccountBalances = async (_accounts: string[]) => {
    setIsFetchingBalances(true)
    try {
      const arr = await Promise.all(
        _accounts.map(async (account) => {
          const [namespace, reference, address] = account.split(':')
          const chainId = `${namespace}:${reference}`
          console.log('will get account balance')
          // const assets = await apiGetAccountBalance(address, chainId)
          return {
            account,
            // assets: [assets]
          }
        })
      )
    } catch (e) {
      console.error(e)
    } finally {
      setIsFetchingBalances(false)
    }
  }

  const onSessionConnected = useCallback(async (_session: SessionTypes.Struct) => {
    const allNamespaceAccounts = Object.values(_session.namespaces)
      .map((namespace: any) => namespace.accounts)
      .flat()
    const allNamespaceChains = Object.keys(_session.namespaces)

    setSession(_session)
    setChains(allNamespaceChains)
    setAccounts(allNamespaceAccounts)
    await getAccountBalances(allNamespaceAccounts)
  }, [])

  const connect = useCallback(
    async (pairing: any) => {
      setIsWaitingApproval(true)
      if (typeof client === 'undefined') {
        throw new Error('WalletConnect is not initialized')
      }
      console.log('connect, pairing topic is:', pairing?.topic)
      try {
        const requiredNamespaces = getRequiredNamespaces(chains)
        console.log('requiredNamespaces config for connect:', requiredNamespaces)

        const { uri, approval } = await client.connect({
          pairingTopic: pairing?.topic,
          requiredNamespaces,
        })

        // Open QRCode modal if a URI was returned (i.e. we're not connecting an existing pairing).
        if (uri) {
          // Create a flat array of all requested chains across namespaces.
          const standaloneChains = Object.values(requiredNamespaces)
            .map((namespace: any) => namespace.chains)
            .flat() as string[]

          web3Modal.openModal({ uri, standaloneChains })
        }

        const session = await approval()
        console.log('Established session:', session)
        await onSessionConnected(session)
        // Update known pairings after session is connected.
        setPairings(client.pairing.getAll({ active: true }))
        setIsWaitingApproval(false)
      } catch (e) {
        console.error(e)
        // ignore rejection
      } finally {
        // close modal in case it was open
        web3Modal.closeModal()
        setIsWaitingApproval(false)
      }
    },
    [chains, client, onSessionConnected, setIsWaitingApproval]
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
      console.log('RESTORED PAIRINGS: ', _client.pairing.getAll({ active: true }))

      if (typeof session !== 'undefined') return
      // populates (the last) existing session to state
      if (_client.session.length) {
        const lastKeyIndex = _client.session.keys.length - 1
        const _session = _client.session.get(_client.session.keys[lastKeyIndex])
        console.log('RESTORED SESSION:', _session)
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

      console.log('CREATED CLIENT: ', _client)
      console.log('relayerRegion ', relayerRegion)
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
      isFetchingBalances,
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
      isFetchingBalances,
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
