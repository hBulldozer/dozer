import { defaultSnapOrigin } from '../config'
import type { Snap } from '../types'
import { useMetaMaskContext } from './MetamaskContext'
import { useRequest } from './useRequest'

/**
 * Utility hook to wrap the `wallet_requestSnaps` method.
 *
 * @returns The `wallet_requestSnaps` wrapper.
 */
export const useRequestSnap = () => {
  const request = useRequest()
  const { setInstalledSnap } = useMetaMaskContext()

  /**
   * Request the Snap.
   *
   * @param snapId - The requested Snap ID.
   * @param version - The requested version.
   * @returns The installed snap.
   */
  const requestSnap = async (snapId: string, version?: string) => {
    const snaps = (await request({
      method: 'wallet_requestSnaps',
      params: {
        [snapId]: version ? { version } : {},
      },
    })) as Record<string, Snap>

    const installedSnap = snaps?.[snapId] ?? null
    // Updates the `installedSnap` context variable since we just installed the Snap.
    setInstalledSnap(installedSnap)
    return installedSnap
  }

  return requestSnap
}
