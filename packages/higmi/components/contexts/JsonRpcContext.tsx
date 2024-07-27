import { createContext, ReactNode, useCallback, useContext, useState } from 'react'
import { useWalletConnectClient } from './ClientContext'
import {
  RpcMethods,
  SendNanoContractRpcRequest,
  SendNanoContractTxResponse,
  SignOracleDataResponse,
  SignOracleDataRpcRequest,
} from 'hathor-rpc-handler-test'

const HATHOR_TESTNET_CHAIN = 'hathor:testnet'

/**
 * Types
 */
export interface IFormattedRpcResponse<T> {
  method?: string
  address?: string
  valid: boolean
  result: T
}

export interface IHathorRpc {
  sendNanoContractTx: (ncTxRpcReq: SendNanoContractRpcRequest) => Promise<SendNanoContractTxResponse>
  signOracleData: (signOracleDataReq: SignOracleDataRpcRequest) => Promise<SignOracleDataResponse>
}

export interface IContext {
  ping: () => Promise<void>
  hathorRpc: IHathorRpc
  rpcResult?: IFormattedRpcResponse<
    SignOracleDataResponse | SendNanoContractTxResponse | string | null | undefined
  > | null
  isRpcRequestPending: boolean
  isTestnet: boolean
  setIsTestnet: (isTestnet: boolean) => void
  reset: () => void
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
  const [result, setResult] = useState<IFormattedRpcResponse<
    SignOracleDataResponse | SendNanoContractTxResponse | string | null | undefined
  > | null>()
  const [isTestnet, setIsTestnet] = useState(true)

  const { client, session } = useWalletConnectClient()

  const reset = useCallback(() => {
    setPending(false)
    setResult(null)
    setIsTestnet(true)
  }, [])

  const ping = async () => {
    if (typeof client === 'undefined') {
      throw new Error('WalletConnect is not initialized')
    }
    if (typeof session === 'undefined') {
      throw new Error('Session is not connected')
    }

    try {
      setPending(true)

      let valid = false

      try {
        await client.ping({ topic: session.topic })
        valid = true
      } catch (e) {
        valid = false
      }

      // display result
      setResult({
        method: 'ping',
        valid,
        result: valid ? 'Ping succeeded' : 'Ping failed',
      })
    } catch (e) {
      console.error(e)
      setResult(null)
    } finally {
      setPending(false)
    }
  }

  const walletClientGuard = () => {
    if (client == null) {
      throw new Error('WalletConnect is not initialized')
    }
    if (session == null) {
      throw new Error('Session is not connected')
    }
  }

  const hathorRpc = {
    sendNanoContractTx: async (ncTxRpcReq: SendNanoContractRpcRequest): Promise<SendNanoContractTxResponse> => {
      walletClientGuard()

      try {
        setPending(true)

        const result: SendNanoContractTxResponse = await client!.request<SendNanoContractTxResponse>({
          chainId: HATHOR_TESTNET_CHAIN,
          topic: session!.topic,
          request: ncTxRpcReq,
        })

        setResult({
          method: RpcMethods.SendNanoContractTx,
          valid: true,
          result,
        })

        return result
      } catch (error: any) {
        setResult({
          valid: false,
          result: error?.message ?? error,
        })

        // Still propagate the error
        throw error
      } finally {
        setPending(false)
      }
    },
    signOracleData: async (signOracleDataReq: SignOracleDataRpcRequest): Promise<SignOracleDataResponse> => {
      walletClientGuard()

      try {
        setPending(true)

        const result: SignOracleDataResponse = await client!.request<SignOracleDataResponse>({
          chainId: HATHOR_TESTNET_CHAIN,
          topic: session!.topic,
          request: signOracleDataReq,
        })

        setResult({
          method: RpcMethods.SignOracleData,
          valid: true,
          result,
        })

        return result
      } catch (error: any) {
        setResult({
          valid: false,
          result: error?.message ?? error,
        })

        // Still propagate the error
        throw error
      } finally {
        setPending(false)
      }
    },
  }

  return (
    <JsonRpcContext.Provider
      value={{
        ping,
        hathorRpc,
        rpcResult: result,
        isRpcRequestPending: pending,
        isTestnet,
        setIsTestnet,
        reset,
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
