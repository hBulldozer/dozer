import { ChainId } from '@dozer/chain'
import { useEffect, useRef, useState } from 'react'
import { useAccount } from '@dozer/zustand'
import { NotificationData } from '@dozer/ui'
import { client as api_client } from '@dozer/api'

export default function useWaitForTransaction(notification: NotificationData, client: typeof api_client) {
  const [status, setStatus] = useState<string>('pending')
  const [message, setMessage] = useState<string | undefined>()
  const { txHash, chainId, type, bridgeMetadata } = notification
  const { updateNotificationLastState } = useAccount()
  const utils = client.useUtils()
  const [timeLeft, setTimeLeft] = useState(0)
  const seconds = 2
  const isBridgeTx = type === 'bridge'

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
          console.error('Hathor address missing for bridge transaction')
          return
        }

        // Get the latest transaction for this token from explorer
        const explorerUrl = isTestnet
          ? 'https://explorer-service.bravo.nano-testnet.hathor.network'
          : 'https://explorer-service.hathor.network'

        const historyResponse = await fetch(
          `${explorerUrl}/address/history?address=${hathorAddress}&token=${tokenUuid}&limit=1`
        )

        if (!historyResponse.ok) {
          // Keep pending if we can't fetch
          return
        }

        const historyData = await historyResponse.json()

        if (historyData.history && historyData.history.length > 0) {
          const latestTx = historyData.history[0]

          // Check if this transaction is after EVM confirmation
          if (latestTx.timestamp > evmConfirmationTime && latestTx.balance > 0) {
            // Get transaction details to verify it's confirmed
            const nodeUrl = isTestnet
              ? 'https://node1.bravo.nano-testnet.hathor.network/v1a'
              : 'https://node1.mainnet.hathor.network/v1a'

            const txResponse = await fetch(`${nodeUrl}/transaction?id=${latestTx.tx_id}`)

            if (txResponse.ok) {
              const txData = await txResponse.json()

              // Check if transaction is confirmed (has first_block and not voided)
              if (
                txData.success &&
                txData.meta?.first_block &&
                (!txData.meta?.voided_by || txData.meta.voided_by.length === 0)
              ) {
                setStatus('completed')
                updateNotificationLastState(txHash, 'completed', 'Bridge completed successfully')
                return
              }
            }
          }
        }

        // Still pending
        setStatus('pending')
      } catch (e) {
        console.error('Error checking bridge transaction:', e)
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
