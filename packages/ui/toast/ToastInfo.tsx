// import { Chain } from '@dozer/chain'
import { FC } from 'react'

import { HalfCircleIcon } from '../icons'
import { NotificationData } from './index'
import { ToastButtons } from './ToastButtons'
import { ToastContent } from './ToastContent'

interface ToastInfo extends Omit<NotificationData, 'promise'> {
  onDismiss(): void
}

export const ToastInfo: FC<ToastInfo> = ({ href, onDismiss, summary }) => {
  const txUrl = href ? href : ''
  return (
    <>
      <ToastContent
        icon={<HalfCircleIcon width={18} height={18} className="text-yellow" />}
        title="Transaction Info"
        summary={summary?.info}
      />
      <ToastButtons href={txUrl} onDismiss={onDismiss} />
    </>
  )
}
