import { ChainId } from '@dozer/chain'
import { useEffect, useRef, useState } from 'react'
import { useAccount } from '@dozer/zustand'
import { NotificationData, createSuccessToast } from '@dozer/ui'
import { client as api_client } from '@dozer/api'

export default function useWaitForTransaction(notification: NotificationData, client: typeof api_client) {
  const [status, setStatus] = useState<string>('pending')
  const [message, setMessage] = useState<string | undefined>()
  const { txHash, chainId, type, bridgeMetadata } = notification
  const { updateNotificationLastState } = useAccount()
  const utils = client.useUtils()
  const [timeLeft, setTimeLeft] = useState(0)
  const isBridgeTx = type === 'bridge'
  // Use longer polling interval for bridge transactions (30s) vs regular transactions (2s)
  const seconds = isBridgeTx ? 30 : 2
  const hasShownSuccessToast = useRef(false)

  useEffect(() => {
    // Special handling for bridge transactions
    async function fetchBridgeTx() {
      if (!bridgeMetadata) {
        console.error('Bridge metadata missing')
        return
      }

      try {
        const { tokenUuid, evmConfirmationTime, isTestnet } = bridgeMetadata
        const hathorAddress = notification.account

        if (!hathorAddress) {
          return
        }

        // Use tRPC to check bridge receipt (avoids CORS issues)
        const result = await utils.getBridge.checkBridgeReceipt.fetch({
          hathorAddress,
          tokenUuid,
          evmConfirmationTime,
          isTestnet: isTestnet ?? true,
        })

        if (result.error) {
          return
        }

        if (result.received && result.txId) {
          setStatus('completed')
          updateNotificationLastState(txHash, 'completed', 'Bridge completed successfully')

          // Show success toast only once
          if (!hasShownSuccessToast.current && bridgeMetadata) {
            hasShownSuccessToast.current = true

            const hathorExplorerUrl = `https://explorer.${
              bridgeMetadata.isTestnet ? 'testnet.' : ''
            }hathor.network/transaction/${result.txId}`

            createSuccessToast({
              type: 'bridge',
              summary: {
                pending: '',
                completed: `Bridge complete! ${bridgeMetadata.tokenSymbol} received on Hathor network.`,
                failed: '',
              },
              txHash: result.txId,
              groupTimestamp: Date.now(),
              timestamp: Date.now(),
              href: hathorExplorerUrl,
            })
          }
          return
        }

        // Still pending
        setStatus('pending')
      } catch (e) {
        // Don't mark as failed, keep pending
      }
    }

    // Regular Hathor transaction status check
    async function fetchTx() {
      try {
        const data = await utils.getPools.getTxStatus.fetch({
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
    }

    if (!timeLeft) {
      if (!notification.last_status || notification.last_status == 'pending') {
        // Use different fetch logic for bridge transactions
        if (isBridgeTx) {
          fetchBridgeTx()
        } else {
          fetchTx()
        }
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
