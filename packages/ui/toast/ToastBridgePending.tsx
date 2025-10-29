import { FC, useEffect, useState, useCallback } from 'react'
import { toast } from 'react-toastify'

import { Loader, NotificationData } from '..'
import { ToastButtons } from './ToastButtons'
import { ToastContent } from './ToastContent'
import { ToastCompleted } from './ToastCompleted'
import { TOAST_OPTIONS } from './Toast'

interface BridgePollingConfig {
  hathorAddress: string
  tokenUuid: string
  evmConfirmationTime: number
  isTestnet: boolean
  toastId: string
  bridgeTxHash: string
}

interface ToastBridgePending extends Omit<NotificationData, 'promise'> {
  onDismiss(): void
  pollingConfig: BridgePollingConfig
}

export const ToastBridgePending: FC<ToastBridgePending> = ({
  href,
  onDismiss,
  summary,
  pollingConfig,
  ...props
}) => {
  const [isChecking, setIsChecking] = useState(true)
  const txUrl = href ? href : ''

  const checkHathorReceipt = useCallback(async () => {
    const { hathorAddress, tokenUuid, evmConfirmationTime, isTestnet, toastId, bridgeTxHash } =
      pollingConfig

    try {
      // Get the latest transaction for this token from explorer
      const explorerUrl = isTestnet
        ? 'https://explorer-service.bravo.nano-testnet.hathor.network'
        : 'https://explorer-service.hathor.network'

      const historyResponse = await fetch(
        `${explorerUrl}/address/history?address=${hathorAddress}&token=${tokenUuid}&limit=1`
      )

      if (!historyResponse.ok) return false

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
              // Transaction confirmed! Dismiss pending toast and show success
              console.log('Bridge completed! Hathor tx:', latestTx.tx_id)

              // Dismiss the pending toast
              toast.dismiss(toastId)

              // Create explorer URL for Hathor transaction
              const hathorExplorerUrl = `https://explorer.${
                isTestnet ? 'bravo.nano-testnet.' : ''
              }hathor.network/transaction/${latestTx.tx_id}`

              // Show success toast
              const successToastId = `bridge-completed:${bridgeTxHash}`
              toast(
                <ToastCompleted
                  {...props}
                  summary={{
                    ...summary,
                    completed: `Bridge complete! Tokens received on Hathor network.`,
                  }}
                  href={hathorExplorerUrl}
                  onDismiss={() => toast.dismiss(successToastId)}
                />,
                {
                  ...TOAST_OPTIONS,
                  toastId: successToastId,
                  autoClose: 10000,
                }
              )

              setIsChecking(false)
              return true // Stop polling
            }
          }
        }
      }

      return false // Continue polling
    } catch (error) {
      console.error('Error checking Hathor receipt:', error)
      return false // Continue polling despite error
    }
  }, [pollingConfig, props, summary])

  useEffect(() => {
    if (!isChecking) return

    let interval: NodeJS.Timeout

    // Initial check after 5 seconds (give blockchain time to process)
    const timeout = setTimeout(async () => {
      const completed = await checkHathorReceipt()
      if (completed) return

      // Start polling every 10 seconds
      interval = setInterval(async () => {
        const completed = await checkHathorReceipt()
        if (completed && interval) {
          clearInterval(interval)
        }
      }, 10000)
    }, 5000)

    return () => {
      clearTimeout(timeout)
      if (interval) clearInterval(interval)
    }
  }, [isChecking, checkHathorReceipt])

  return (
    <>
      <ToastContent
        icon={<Loader width={18} height={18} className="text-blue-400" />}
        title="Bridge Transaction Pending"
        summary={
          <div className="space-y-1">
            <div>{summary.pending}</div>
            <div className="text-xs text-gray-400">
              Checking for Hathor network confirmation... This may take a few minutes.
            </div>
          </div>
        }
      />
      <ToastButtons href={txUrl} onDismiss={onDismiss} />
    </>
  )
}
