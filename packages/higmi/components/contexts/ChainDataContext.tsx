import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { HathorChainData, ChainsMap, ChainNamespaces, getAllChainNamespaces } from './hathor'

/**
 * Types
 */
interface IContext {
  chainData: ChainNamespaces
}

/**
 * Context
 */
export const ChainDataContext = createContext<IContext>({} as IContext)

/**
 * Provider
 */
export function ChainDataContextProvider({ children }: { children: ReactNode | ReactNode[] }) {
  const [chainData, setChainData] = useState<ChainNamespaces>({})

  const loadChainData = async () => {
    const namespaces = getAllChainNamespaces()
    const chainData: ChainNamespaces = {}
    await Promise.all(
      namespaces.map(async (namespace) => {
        let chains: ChainsMap | undefined
        switch (namespace) {
          case 'hathor':
            chains = HathorChainData
            break

          default:
            console.error('Unknown chain namespace: ', namespace)
        }

        if (typeof chains !== 'undefined') {
          chainData[namespace] = chains
        }
      })
    )

    setChainData(chainData)
  }

  useEffect(() => {
    loadChainData()
  }, [])

  return (
    <ChainDataContext.Provider
      value={{
        chainData,
      }}
    >
      {children}
    </ChainDataContext.Provider>
  )
}

export function useChainData() {
  const context = useContext(ChainDataContext)
  if (context === undefined) {
    throw new Error('useChainData must be used within a ChainDataContextProvider')
  }
  return context
}
