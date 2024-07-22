import { createContext, ReactNode, useContext, useState } from 'react'
import { useWalletConnectClient } from './ClientContext'
import { useChainData } from './ChainDataContext'

export enum DEFAULT_HATHOR_METHODS {
  HATHOR_SIGN_MESSAGE = 'htr_signWithAddress',
  HATHOR_SEND_NANO_TX = 'htr_sendNanoContractTx',
  HATHOR_SIGN_ORACLE_DATA = 'htr_signOracleData',
}

export enum DEFAULT_HATHOR_EVENTS {}

export const DEFAULT_MAIN_CHAINS = [
  // mainnets
  'hathor:testnet',
]

/**
 * Types
 */
interface IFormattedRpcResponse {
  method?: string
  address?: string
  valid: boolean
  result: string
}

type TRpcRequestCallback = (chainId: string, address: string) => Promise<void>

interface IContext {
  hathorRpc: {
    testSignMessage: TRpcRequestCallback
    testSendNanoContractTx: TRpcRequestCallback
    testSignOracleData: TRpcRequestCallback
  }
  rpcResult?: IFormattedRpcResponse | null
  isRpcRequestPending: boolean
  isTestnet: boolean
  setIsTestnet: (isTestnet: boolean) => void
}

/**
 * Context
 */
export const JsonRpcContext = createContext<IContext>({} as IContext)

/**
 * Provider
 */
export function JsonRpcContextProvider({ children }: { children: ReactNode | ReactNode[] }) {
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<IFormattedRpcResponse | null>()
  const [isTestnet, setIsTestnet] = useState(false)

  const { client, session, accounts } = useWalletConnectClient()

  const { chainData } = useChainData()

  const _createJsonRpcRequestHandler =
    (rpcRequest: (chainId: string, address: string) => Promise<IFormattedRpcResponse>) =>
    async (chainId: string, address: string) => {
      if (typeof client === 'undefined') {
        throw new Error('WalletConnect is not initialized')
      }
      if (typeof session === 'undefined') {
        throw new Error('Session is not connected')
      }

      try {
        setPending(true)
        const result = await rpcRequest(chainId, address)
        setResult(result)
      } catch (err: any) {
        console.error('RPC request failed: ', err)
        setResult({
          address,
          valid: false,
          result: err?.message ?? err,
        })
      } finally {
        setPending(false)
      }
    }

  // -------- HATHOR RPC METHODS --------

  const initialize = {
    id: 3,
    topic: '6514868878fe1dadd648a495692d5ab9d458c7d45876f2c63e1e7274640a53d4',
    jsonrpc: '2.0',
    params: {
      request: {
        method: 'htr_sendNanoContractTx',
        params: {
          push_tx: true,
          network: 'testnet',
          method: 'initialize',
          blueprint_id: '3cb032600bdf7db784800e4ea911b10676fa2f67591f82bb62628c234e771595',
          args: ['76a914969647cffd30891b1444944ff228f3bd7582fa4588ac', '00', Math.ceil(new Date().getTime() / 1000)],
        },
      },
    },
  }

  const hathorRpc = {
    testCreateNanoContract: _createJsonRpcRequestHandler(
      async (chainId: string, address: string): Promise<IFormattedRpcResponse> => {
        try {
          const result = await client!.request<{ result: any }>({
            chainId,
            topic: session!.topic,
            request: {
              method: 'htr_sendNanoContractTx',
              params: {
                push_tx: true,
                network: 'testnet',
                method: 'bet',
                blueprint_id: '3cb032600bdf7db784800e4ea911b10676fa2f67591f82bb62628c234e771595',
                actions: [
                  {
                    type: 'deposit',
                    token: '00',
                    amount: 1,
                  },
                ],
                args: ['49a2f4c21b3f3219345eeaebf44ece0cbfaa13859577246ce5', 'true'],
              },
            },
          })

          console.log('result: ', result)

          return {
            method: DEFAULT_HATHOR_METHODS.HATHOR_SEND_NANO_TX,
            address,
            valid: true,
            result: JSON.stringify(result) as unknown as string,
          }
        } catch (error: any) {
          console.log('Error: ', error)
          throw new Error(error)
        }
      }
    ),
    testSendNanoContractTx: _createJsonRpcRequestHandler(
      async (chainId: string, address: string): Promise<IFormattedRpcResponse> => {
        try {
          const result = await client!.request<{ result: any }>({
            chainId,
            topic: session!.topic,
            request: {
              method: 'htr_sendNanoContractTx',
              params: {
                push_tx: true,
                network: 'testnet',
                method: 'bet',
                blueprint_id: '3cb032600bdf7db784800e4ea911b10676fa2f67591f82bb62628c234e771595',
                nc_id: '00002a71944472852754ed2f53dbd366b90b090bb319715e82f7fe0e786f0553',
                actions: [
                  {
                    type: 'deposit',
                    token: '00',
                    amount: 1,
                  },
                ],
                args: ['49a2f4c21b3f3219345eeaebf44ece0cbfaa13859577246ce5', 'true'],
              },
            },
          })

          console.log('result: ', result)

          return {
            method: DEFAULT_HATHOR_METHODS.HATHOR_SEND_NANO_TX,
            address,
            valid: true,
            result: JSON.stringify(result) as unknown as string,
          }
        } catch (error: any) {
          console.log('Error: ', error)
          throw new Error(error)
        }
      }
    ),
    testSignMessage: _createJsonRpcRequestHandler(
      async (chainId: string, address: string): Promise<IFormattedRpcResponse> => {
        try {
          const result = await client!.request<{ result: any }>({
            chainId,
            topic: session!.topic,
            request: {
              method: DEFAULT_HATHOR_METHODS.HATHOR_SIGN_MESSAGE,
              params: {
                network: 'testnet',
                addressIndex: 0,
                message: 'Please sign me!',
              },
            },
          })

          return {
            method: DEFAULT_HATHOR_METHODS.HATHOR_SIGN_MESSAGE,
            address,
            valid: true,
            result: result as unknown as string,
          }
        } catch (error: any) {
          console.log('Error: ', error)
          throw new Error(error)
        }
      }
    ),
    testSignOracleData: _createJsonRpcRequestHandler(
      async (chainId: string, address: string): Promise<IFormattedRpcResponse> => {
        try {
          const result = await client!.request<{ result: any }>({
            chainId,
            topic: session!.topic,
            request: {
              method: DEFAULT_HATHOR_METHODS.HATHOR_SIGN_ORACLE_DATA,
              params: {
                network: 'testnet',
                oracle: address,
                data: '2x0',
              },
            },
          })

          return {
            method: DEFAULT_HATHOR_METHODS.HATHOR_SIGN_ORACLE_DATA,
            address,
            valid: true,
            result: JSON.stringify(result),
          }
        } catch (error: any) {
          console.log('Error: ', error)
          throw new Error(error)
        }
      }
    ),
  }

  return (
    <JsonRpcContext.Provider
      value={{
        hathorRpc,
        rpcResult: result,
        isRpcRequestPending: pending,
        isTestnet,
        setIsTestnet,
      }}
    >
      {children}
    </JsonRpcContext.Provider>
  )
}

export function useJsonRpc() {
  const context = useContext(JsonRpcContext)
  if (context === undefined) {
    throw new Error('useJsonRpc must be used within a JsonRpcContextProvider')
  }
  return context
}
