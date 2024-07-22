import { ProposalTypes } from '@walletconnect/types'

export enum DEFAULT_HATHOR_METHODS {
  HATHOR_SIGN_MESSAGE = 'htr_signWithAddress',
  HATHOR_SEND_NANO_TX = 'htr_sendNanoContractTx',
  HATHOR_SIGN_ORACLE_DATA = 'htr_signOracleData',
}

export enum DEFAULT_HATHOR_EVENTS {}

export const getNamespacesFromChains = (chains: string[]) => {
  const supportedNamespaces: string[] = []
  chains.forEach((chainId) => {
    const [namespace] = chainId.split(':')
    if (!supportedNamespaces.includes(namespace)) {
      supportedNamespaces.push(namespace)
    }
  })

  return supportedNamespaces
}

export const getSupportedMethodsByNamespace = (namespace: string) => {
  switch (namespace) {
    case 'hathor':
      return Object.values(DEFAULT_HATHOR_METHODS)
    default:
      throw new Error(`No default methods for namespace: ${namespace}`)
  }
}

export const getSupportedEventsByNamespace = (namespace: string) => {
  switch (namespace) {
    case 'hathor':
      return Object.values(DEFAULT_HATHOR_EVENTS)
    default:
      throw new Error(`No default events for namespace: ${namespace}`)
  }
}

export const getRequiredNamespaces = (chains: string[]): ProposalTypes.RequiredNamespaces => {
  const selectedNamespaces = getNamespacesFromChains(chains)
  console.log('selected namespaces:', selectedNamespaces)

  return Object.fromEntries(
    selectedNamespaces.map((namespace) => [
      namespace,
      {
        methods: getSupportedMethodsByNamespace(namespace),
        chains: chains.filter((chain) => chain.startsWith(namespace)),
        events: getSupportedEventsByNamespace(namespace) as any[],
      },
    ])
  )
}
