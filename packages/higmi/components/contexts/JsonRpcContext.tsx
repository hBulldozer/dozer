import { createContext, ReactNode, useCallback, useContext, useState, useMemo } from 'react'
import { useWalletConnectClient } from './ClientContext'
import { useAccount } from '@dozer/zustand'
import {
  CreateTokenResponse,
  CreateTokenRpcRequest,
  RpcMethods,
  SendNanoContractRpcRequest,
  SendNanoContractTxResponse,
  SignOracleDataResponse,
  SignOracleDataRpcRequest,
  RpcResponseTypes,
} from '@hathor/hathor-rpc-handler'
import { IHathorRpc } from '@dozer/nanocontracts/src/types'
// @ts-expect-error - Hathor Snap Utils is not typed
import { useInvokeSnap } from '@hathor/snap-utils'
import config from '../../config/bridge'

/**
 * Utility function to parse snap responses
 * Handles the new response format: { type: RpcResponseTypes.X, response: { ... } }
 */
const parseSnapResponse = <T = any,>(result: unknown): T | null => {
  try {
    if (typeof result === 'string') {
      const parsed = JSON.parse(result)
      // New format with response wrapper
      if (parsed?.response !== undefined) {
        return parsed.response as T
      }
      // Direct response
      return parsed as T
    } else if (result && typeof result === 'object') {
      const obj = result as Record<string, unknown>
      // New format with response wrapper
      if (obj?.response !== undefined) {
        return obj.response as T
      }
      // Direct response
      return result as T
    }
  } catch (error) {
    console.error('Error parsing snap response:', error)
  }
  return null
}

/**
 * Types
 */
export interface IFormattedRpcResponse<T> {
  method?: string
  address?: string
  valid: boolean
  result: T
}

export interface IContext {
  ping: () => Promise<void>
  hathorRpc: IHathorRpc
  rpcResult?: IFormattedRpcResponse<
    SignOracleDataResponse | SendNanoContractTxResponse | CreateTokenResponse | string | null | undefined
  > | null
  isRpcRequestPending: boolean
  isTestnet: boolean
  setIsTestnet: (isTestnet: boolean) => void
  reset: () => void
  // Additional context info
  walletType: 'walletconnect' | 'metamask-snap' | null
  isWalletConnected: boolean
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
    SignOracleDataResponse | SendNanoContractTxResponse | CreateTokenResponse | string | null | undefined
  > | null>()
  // Initialize isTestnet from the centralized configuration
  const [isTestnet, setIsTestnet] = useState(config.isTestnet)

  const { client, session } = useWalletConnectClient()
  const { walletType, hathorAddress, snapId } = useAccount()
  const invokeSnap = useInvokeSnap()
  const { address: wcAddress } = useAccount()

  const address = walletType === 'walletconnect' ? wcAddress : hathorAddress

  const reset = useCallback(() => {
    setPending(false)
    setResult(null)
    // Reset to the configured testnet setting
    setIsTestnet(config.isTestnet)
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
      } catch {
        valid = false
      }

      // display result
      setResult({
        method: 'ping',
        valid,
        result: valid ? 'Ping succeeded' : 'Ping failed',
      })
    } catch (error) {
      console.error(error)
      setResult(null)
    } finally {
      setPending(false)
    }
  }

  // Create WalletConnect-specific RPC implementation with memoization
  const walletConnectRpc: IHathorRpc = useMemo(() => {
    const walletClientGuard = () => {
      if (client == null) {
        throw new Error('WalletConnect is not initialized')
      }
      if (session == null) {
        throw new Error('Session is not connected')
      }
    }

    // Get the Hathor chainId from the session namespaces
    const getHathorChainId = (): string => {
      if (!session?.namespaces?.hathor?.chains?.[0]) {
        // Fallback to config if session doesn't have it yet
        return config.hathorConfig.rpcChain
      }
      return session.namespaces.hathor.chains[0]
    }

    return {
      sendNanoContractTx: async (ncTxRpcReq: SendNanoContractRpcRequest): Promise<SendNanoContractTxResponse> => {
        walletClientGuard()

        try {
          setPending(true)

          const result: SendNanoContractTxResponse = await client!.request<SendNanoContractTxResponse>({
            topic: session!.topic,
            chainId: getHathorChainId(),
            request: ncTxRpcReq,
          })

          // Set result in unified format
          setResult({
            method: RpcMethods.SendNanoContractTx,
            valid: true,
            result: result,
          })

          return result
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          setResult({
            valid: false,
            result: errorMessage,
          })
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
            topic: session!.topic,
            chainId: getHathorChainId(),
            request: signOracleDataReq,
          })

          setResult({
            method: RpcMethods.SignOracleData,
            valid: true,
            result,
          })

          return result
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          setResult({
            valid: false,
            result: errorMessage,
          })
          throw error
        } finally {
          setPending(false)
        }
      },
      createToken: async (createTokenTxRpcReq: CreateTokenRpcRequest): Promise<CreateTokenResponse> => {
        walletClientGuard()

        try {
          setPending(true)

          const result: CreateTokenResponse = await client!.request<CreateTokenResponse>({
            topic: session!.topic,
            chainId: getHathorChainId(),
            request: createTokenTxRpcReq,
          })

          setResult({
            method: RpcMethods.CreateToken,
            valid: true,
            result,
          })

          return result
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          setResult({
            valid: false,
            result: errorMessage,
          })
          throw error
        } finally {
          setPending(false)
        }
      },
    }
  }, [client, session])

  // Create MetaMask Snap RPC implementation with memoization
  const metamaskSnapRpc: IHathorRpc = useMemo(() => {
    if (walletType !== 'metamask-snap' || !invokeSnap || !snapId) {
      return walletConnectRpc
    }

    const handleSnapResponse = (result: unknown): { response: Record<string, unknown> } => {
      // Parse the snap response using the utility function
      const parsedResponse = parseSnapResponse<Record<string, unknown>>(result)

      if (!parsedResponse) {
        return { response: {} }
      }

      // Extract hash from various possible locations
      const hash = (parsedResponse.hash ||
        parsedResponse.tx_id ||
        parsedResponse.txId ||
        (parsedResponse.transaction as any)?.hash ||
        null) as string | null

      const response = {
        ...parsedResponse,
        hash, // Always include hash for consistency
      }

      return { response }
    }

    return {
      sendNanoContractTx: async (ncTxRpcReq: SendNanoContractRpcRequest): Promise<SendNanoContractTxResponse> => {
        try {
          setPending(true)

          // Convert the RPC request to MetaMask snap format
          const snapParams = {
            nc_id: ncTxRpcReq.params.nc_id,
            method: ncTxRpcReq.params.method,
            actions: ncTxRpcReq.params.actions,
            args: ncTxRpcReq.params.args,
          }

          const invokeSnapParams = {
            snapId,
            method: 'htr_sendNanoContractTx',
            params: snapParams,
          }

          const result = await invokeSnap(invokeSnapParams)

          // Process result and extract hash
          const processedResult = handleSnapResponse(result)

          const response: SendNanoContractTxResponse = {
            type: RpcResponseTypes.SendNanoContractTxResponse,
            response: processedResult.response as unknown as SendNanoContractTxResponse['response'],
          }

          setResult({
            method: RpcMethods.SendNanoContractTx,
            valid: true,
            result: response,
          })

          return response
        } catch (error) {
          setResult({
            valid: false,
            result: error instanceof Error ? error.message : String(error),
          })
          throw error
        } finally {
          setPending(false)
        }
      },
      signOracleData: async (signOracleDataReq: SignOracleDataRpcRequest): Promise<SignOracleDataResponse> => {
        try {
          setPending(true)

          const result = await invokeSnap({
            snapId,
            method: 'htr_signOracleData',
            params: signOracleDataReq.params,
          })

          // Parse the snap response using the utility function
          const parsedResponse = parseSnapResponse<SignOracleDataResponse['response']>(result)

          const response: SignOracleDataResponse['response'] = parsedResponse || {
            data: signOracleDataReq.params.data,
            signedData: { signature: 'No response from snap' } as SignOracleDataResponse['response']['signedData'],
            oracle: signOracleDataReq.params.oracle,
          }

          const finalResponse: SignOracleDataResponse = {
            type: RpcResponseTypes.SignOracleDataResponse,
            response,
          }

          setResult({
            method: RpcMethods.SignOracleData,
            valid: true,
            result: finalResponse,
          })

          return finalResponse
        } catch (error) {
          setResult({
            valid: false,
            result: error instanceof Error ? error.message : String(error),
          })
          throw error
        } finally {
          setPending(false)
        }
      },
      createToken: async (createTokenReq: CreateTokenRpcRequest): Promise<CreateTokenResponse> => {
        try {
          setPending(true)

          const result = await invokeSnap({
            snapId,
            method: 'htr_createToken',
            params: createTokenReq.params,
          })

          const processedResult = handleSnapResponse(result)

          const response: CreateTokenResponse = {
            type: RpcResponseTypes.CreateTokenResponse,
            response: processedResult.response as unknown as CreateTokenResponse['response'],
          }

          setResult({
            method: RpcMethods.CreateToken,
            valid: true,
            result: response,
          })

          return response
        } catch (error) {
          setResult({
            valid: false,
            result: error instanceof Error ? error.message : String(error),
          })
          throw error
        } finally {
          setPending(false)
        }
      },
    }
  }, [walletType, invokeSnap, snapId])

  // Create unified RPC based on wallet type
  const unifiedRpc: IHathorRpc = useMemo(() => {
    switch (walletType) {
      case 'walletconnect':
        return walletConnectRpc
      case 'metamask-snap':
        return metamaskSnapRpc
      default:
        return walletConnectRpc
    }
  }, [walletType, walletConnectRpc, metamaskSnapRpc, address, snapId, invokeSnap])

  return (
    <JsonRpcContext.Provider
      value={{
        ping,
        hathorRpc: unifiedRpc,
        rpcResult: result,
        isRpcRequestPending: pending,
        isTestnet,
        setIsTestnet,
        reset,
        walletType,
        isWalletConnected: !!unifiedRpc && (!!session || !!hathorAddress),
      }}
    >
      {children}
    </JsonRpcContext.Provider>
  )
}

export function useJsonRpc() {
  const context = useContext(JsonRpcContext)
  if (!context) {
    throw new Error('useJsonRpc must be used within a JsonRpcContextProvider')
  }
  return context
}
