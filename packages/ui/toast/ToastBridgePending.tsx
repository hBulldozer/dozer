import { FC } from 'react'

import { Loader, NotificationData } from '..'
import { ToastButtons } from './ToastButtons'
import { ToastContent } from './ToastContent'

interface ToastBridgePending extends Omit<NotificationData, 'promise'> {
  onDismiss(): void
}

export const ToastBridgePending: FC<ToastBridgePending> = ({
  href,
  onDismiss,
  summary,
}) => {
  const txUrl = href ? href : ''

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
