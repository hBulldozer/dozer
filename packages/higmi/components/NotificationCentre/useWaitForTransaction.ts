import { ChainId } from '@dozer/chain'
import { api } from '../../utils/api'
import { useEffect, useMemo, useState } from 'react'
import { useAccount } from '@dozer/zustand'
import { NotificationData } from '@dozer/ui'

export default function useWaitForTransaction(notification: NotificationData) {
  const [status, setStatus] = useState<string>('pending')
  const [message, setMessage] = useState<string | undefined>()
  const utils = api.useUtils()
  const { txHash, chainId } = notification

  const fetchTx = async () => {
    // The commented parts here have the goal to avoid the already validated notification to send fetch
    // request again.
    // if (notification.validated)
    try {
      const data = await utils.getPools.waitForTx.fetch({
        hash: txHash,
        chainId: chainId || ChainId.HATHOR,
      })
      if (data.status == 'failed') setMessage(data.message)
      setStatus(data.status || 'pending')
      // if (data.status == 'success' || data.status == 'failed') {
      //   const { setNotificationValidated } = useAccount()
      //   setNotificationValidated(txHash)
      // }
    } catch (e) {
      setStatus('failed')
    }
  }
  useEffect(() => {
    fetchTx()
  }, [txHash, chainId])

  return { status: status, message: message }
}
