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
  const { setNotifications, notifications } = useAccount()

  const fetchTx = async () => {
    // The commented parts here have the goal to avoid the already validated notification to send fetch
    // request again.
    // if (notification.validated)
    try {
      const data = await utils.getPools.waitForTx.fetch({
        hash: txHash,
        chainId: chainId || ChainId.HATHOR,
      })
      setStatus(data.status || 'pending')
      if (data.status == 'failed') setMessage(data.message)
      if (data.status == 'success' || data.status == 'failed') {
        const new_notification: NotificationData = { ...notification, validated: true }
        const new_notifications: Record<number, string[]> = Object.keys(notifications).map((v, i, n) => {
          if (JSON.parse(n[0]).txHash == txHash) {
            console.log('n', n)
            console.log('n[0]', n[0])
            console.log('n[0]', JSON.parse(n[0]))
            const group: string[] = []
            group.push(JSON.stringify(new_notification))
            return group
          } else return n
        })

        setNotifications(new_notifications)
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
