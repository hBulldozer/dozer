import { XCircleIcon } from '@heroicons/react/24/outline'
// import { Chain } from '@dozer/chain'
import { FC } from 'react'

import { NotificationData } from './index'
import { ToastButtons } from './ToastButtons'
import { ToastContent } from './ToastContent'

interface ToastFailed extends Omit<NotificationData, 'promise'> {
  onDismiss(): void
}

export const ToastFailed: FC<ToastFailed> = ({ href, onDismiss, summary }) => {
  const txUrl = href ? href : ''
  return (
    <>
      <ToastContent
        icon={<XCircleIcon width={18} height={18} className="text-red" />}
        title="Transaction Failed"
        summary={summary.failed}
      />
      <ToastButtons href={txUrl} onDismiss={onDismiss} />
    </>
  )
}
