import { ChainId } from '@dozer/chain'
import { useEffect, useRef, useState } from 'react'
import { useAccount } from '@dozer/zustand'
import { NotificationData } from '@dozer/ui'
import { client as api_client } from '@dozer/api'

export default function useWaitForTransaction(notification: NotificationData, client: typeof api_client) {
  const [status, setStatus] = useState<string>('pending')
  const [message, setMessage] = useState<string | undefined>()
  const { txHash, chainId } = notification
  const { updateNotificationLastState } = useAccount()
  const utils = client.useUtils()
  const [timeLeft, setTimeLeft] = useState(0)
  const seconds = 2

  useEffect(() => {
    // exit early when we reach 0
    async function fetchTx() {
      try {
        const data = await utils.getPools.getTxStatus.fetch({
          hash: txHash,
          chainId: chainId || ChainId.HATHOR,
        })
        setStatus(data.status || 'pending')
        updateNotificationLastState(txHash, data.status, data.message)
        utils.getNetwork.getBestBlock.invalidate()
        if (data.status == 'failed') setMessage(data.message)
      } catch (e) {
        console.log(e)
        setMessage(e as string)
        setStatus('failed')
      }
    }

    if (!timeLeft) {
      if (!notification.last_status || notification.last_status == 'pending') {
        fetchTx()
        setTimeLeft(seconds)
      } else {
        setStatus(notification.last_status || 'pending')
        setMessage(notification.last_message)
      }
      return
    }

    // save intervalId to clear the interval when the
    // component re-renders
    const intervalId = setInterval(() => {
      setTimeLeft(timeLeft - 1)
    }, 1000)

    // clear interval on re-render to avoid memory leaks
    return () => clearInterval(intervalId)
    // add timeLeft as a dependency to re-rer
  }, [status, timeLeft])

  return { status: status, message: message }
}
