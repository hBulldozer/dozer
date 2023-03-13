import { CheckCircleIcon } from '@heroicons/react/outline'
// import { Chain } from '@dozer/chain'
import { FC } from 'react'

import { NotificationData } from './index'
import { ToastButtons } from './ToastButtons'
import { ToastContent } from './ToastContent'

interface ToastCompleted extends Omit<NotificationData, 'promise'> {
  onDismiss(): void
}

export const ToastCompleted: FC<ToastCompleted> = ({ href, onDismiss, summary }) => {
  const txUrl = href
  return (
    <>
      <ToastContent
        icon={<CheckCircleIcon width={18} height={18} className="text-green" />}
        title="Transaction Completed"
        summary={summary.completed}
      />
      <ToastButtons href={txUrl} onDismiss={onDismiss} />
    </>
  )
}
