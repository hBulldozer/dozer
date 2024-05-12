import { ChainId } from '@dozer/chain'
import { useEffect, useState } from 'react'
import { useAccount } from '@dozer/zustand'
import { NotificationData } from '@dozer/ui'
import { client as api_client } from '@dozer/api'

export default function useWaitForTransaction(notification: NotificationData, client: typeof api_client) {
  const [status, setStatus] = useState<string>('pending')
  const [message, setMessage] = useState<string | undefined>()
  const { txHash, chainId } = notification
  const { updateNotificationLastState } = useAccount()
  const utils = client.useUtils()

  const fetchTx = async () => {
    if (!notification.last_status || notification.last_status == 'pending') {
      try {
        const data = await utils.getPools.waitForTx.fetch({
          hash: txHash,
          chainId: chainId || ChainId.HATHOR,
        })
        setStatus(data.status || 'pending')
        updateNotificationLastState(txHash, data.status, data.message)
        if (data.status == 'failed') setMessage(data.message)
      } catch (e) {
        console.log(e)
        setMessage(e as string)
        setStatus('failed')
      }
    } else {
      setStatus(notification.last_status || 'pending')
      setMessage(notification.last_message)
    }
  }
  useEffect(() => {
    fetchTx()
  }, [txHash, chainId])

  return { status: status, message: message }
}
