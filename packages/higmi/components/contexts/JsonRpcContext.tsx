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

// Use the centralized configuration for Hathor chain
const HATHOR_CHAIN = config.hathorConfig.rpcChain

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
  const invokeSnap = useInvokeSnap('npm:@hathor/snap')
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

    return {
      sendNanoContractTx: async (ncTxRpcReq: SendNanoContractRpcRequest): Promise<SendNanoContractTxResponse> => {
        walletClientGuard()

        try {
          setPending(true)

          const result: SendNanoContractTxResponse = await client!.request<SendNanoContractTxResponse>({
            chainId: HATHOR_CHAIN,
            topic: session!.topic,
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
            chainId: HATHOR_CHAIN,
            topic: session!.topic,
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
            chainId: HATHOR_CHAIN,
            topic: session!.topic,
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
      // Handle MetaMask Snap response and extract hash
      let processedResult = result
      let hash: string | null = null

      if (typeof result === 'string') {
        try {
          processedResult = JSON.parse(result)
        } catch {
          processedResult = result
        }
      }

      // Extract hash from various possible locations
      if (processedResult && typeof processedResult === 'object') {
        const obj = processedResult as Record<string, unknown>

        // Look for hash in various possible locations
        hash = (obj.hash ||
          obj.tx_id ||
          obj.txId ||
          (obj.transaction as any)?.hash ||
          (obj.response as any)?.hash ||
          null) as string | null
      }

      const response = {
        ...(processedResult as Record<string, unknown>),
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

          let response: SignOracleDataResponse['response']

          if (typeof result === 'string') {
            try {
              const parsed = JSON.parse(result)
              response = parsed
            } catch {
              response = {
                data: signOracleDataReq.params.data,
                signedData: { signature: result } as SignOracleDataResponse['response']['signedData'],
                oracle: signOracleDataReq.params.oracle,
              }
            }
          } else {
            response = (result as SignOracleDataResponse['response']) || {
              data: signOracleDataReq.params.data,
              signedData: { signature: 'No response from snap' } as SignOracleDataResponse['response']['signedData'],
              oracle: signOracleDataReq.params.oracle,
            }
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
