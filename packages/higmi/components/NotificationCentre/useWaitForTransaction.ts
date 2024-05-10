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
  const { validateNotification } = useAccount()

  const fetchTx = async () => {
    if (!notification.validated)
      try {
        const data = await utils.getPools.waitForTx.fetch({
          hash: txHash,
          chainId: chainId || ChainId.HATHOR,
        })
        setStatus(data.status || 'pending')
        if (data.status == 'failed') setMessage(data.message)
        if (data.status == 'success' || data.status == 'failed') {
          validateNotification(txHash)
        }
      } catch (e) {
        console.log(e)

        setStatus('failed')
      }
  }
  useEffect(() => {
    fetchTx()
  }, [txHash, chainId])

  return { status: status, message: message }
}
