// import { Chain } from '@dozer/chain'
import { FC } from 'react'

import { Loader, NotificationData } from '..'
import { ToastButtons } from './ToastButtons'
import { ToastContent } from './ToastContent'

interface ToastPending extends Omit<NotificationData, 'promise'> {
  onDismiss(): void
}

export const ToastPending: FC<ToastPending> = ({ href, onDismiss, summary }) => {
  const txUrl = href ? href : ''
  return (
    <>
      <ToastContent
        icon={<Loader width={18} height={18} className="text-yellow" />}
        title="Transaction Pending"
        summary={summary.pending}
      />
      <ToastButtons href={txUrl} onDismiss={onDismiss} />
    </>
  )
}
