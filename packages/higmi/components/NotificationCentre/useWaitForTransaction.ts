import { ChainId } from '@dozer/chain'
import { api } from '../../utils/api'
import { useEffect, useMemo, useState } from 'react'
import { useAccount } from '@dozer/zustand'
import { NotificationData } from '@dozer/ui'

export default function useWaitForTransaction(hash: string, chainId: ChainId) {
  const [status, setStatus] = useState<string>('pending')
  const [message, setMessage] = useState<string | undefined>()
  const utils = api.useUtils()
  const { notifications } = useAccount()

  const fetchTx = async () => {
    // const notification: NotificationData = JSON.parse(
    //   notifications[0].map((not) => {
    //     if (JSON.parse(not).txHash == hash) return not
    //   })
    // )
    // if (notification.validated)
    try {
      const data = await utils.getPools.waitForTx.fetch({
        hash,
        chainId,
      })
      if (data.status == 'failed') setMessage(data.message)
      setStatus(data.status || 'pending')
      if (data.status == 'success' || data.status == 'failed') {
        const { setNotificationValidated } = useAccount()
        setNotificationValidated(hash)
      }
    } catch (e) {
      setStatus('failed')
      console.log(e)
    }
  }
  useEffect(() => {
    fetchTx()
  }, [hash, chainId])

  return status
}
