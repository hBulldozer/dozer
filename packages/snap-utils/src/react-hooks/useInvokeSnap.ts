import { defaultSnapOrigin } from '../config'
import { useRequest } from './useRequest'

export type InvokeSnapParams = {
  method: string
  params?: Record<string, unknown>
}

/**
 * Utility hook to wrap the `wallet_invokeSnap` method.
 *
 * @returns The invokeSnap wrapper method.
 */
export const useInvokeSnap = () => {
  const request = useRequest()

  /**
   * Invoke the requested Snap method.
   *
   * @param params - The invoke params.
   * @param params.snapId - The Snap ID to invoke.
   * @param params.method - The method name.
   * @param params.params - The method params.
   * @returns The Snap response.
   */
  const invokeSnap = async ({ snapId, method, params }: InvokeSnapParams & { snapId: string }) =>
    request({
      method: 'wallet_invokeSnap',
      params: {
        snapId,
        request: params ? { method, params } : { method },
      },
    })

  return invokeSnap
}
