// import { ChainId } from '@dozer/chain'
import { nanoid } from 'nanoid'
import React, { ReactNode } from 'react'
import { toast, ToastOptions } from 'react-toastify'

import { ToastButtons } from './ToastButtons'
import { ToastCompleted } from './ToastCompleted'
import { ToastContent } from './ToastContent'
import { ToastFailed } from './ToastFailed'
import { ToastInfo } from './ToastInfo'
import { ToastInline } from './ToastInline'
import { ToastPending } from './ToastPending'
import { ToastBridgePending } from './ToastBridgePending'
import { ChainId } from '@dozer/chain'

export const TOAST_OPTIONS: ToastOptions = {
  position: 'bottom-right',
  autoClose: false,
  hideProgressBar: true,
  closeOnClick: false,
  pauseOnHover: true,
  draggable: false,
  progress: undefined,
  closeButton: false,
  icon: false,
}

export interface NotificationData {
  type:
    | 'send'
    | 'stargate'
    | 'swap'
    | 'mint'
    | 'burn'
    | 'approval'
    | 'enterBar'
    | 'leaveBar'
    | 'claimRewards'
    | 'withdrawStream'
    | 'cancelStream'
    | 'transferStream'
    | 'transferVesting'
    | 'updateStream'
    | 'withdrawVesting'
    | 'createStream'
    | 'createMultipleStream'
    | 'createVesting'
    | 'createMultipleVesting'
    | 'add_liquidity_single_token'
    | 'add_liquidity'
    | 'remove_liquidity'
    | 'remove_liquidity_single_token'
    | 'bridge' // Bridge transaction from EVM to Hathor
  // chainId: ChainId
  summary: {
    pending: ReactNode | Array<ReactNode>
    completed: ReactNode | Array<ReactNode>
    failed: ReactNode | Array<ReactNode>
    info?: ReactNode | Array<ReactNode>
  }
  chainId?: ChainId
  href?: string
  txHash: string
  groupTimestamp: number
  timestamp: number
  last_status?: string
  last_message?: string
  promise: Promise<any>
  status?: string
  account?: string
  title?: string
  // Bridge-specific metadata
  bridgeMetadata?: {
    tokenUuid: string
    tokenSymbol: string
    evmConfirmationTime: number
    isTestnet: boolean
  }
}

export const createInlineToast = (props: NotificationData) => {
  const onDismiss = () => toast.dismiss(props.txHash)

  return toast(<ToastInline {...props} onDismiss={onDismiss} />, {
    ...TOAST_OPTIONS,
    toastId: props.txHash,
  })
}

export const createToast = (props: NotificationData) => {
  const onDismiss = () => toast.dismiss(props.txHash)

  // Spawn new toasts based on promise result
  props.promise
    .then(() => {
      setTimeout(onDismiss, 1000)

      // Spawn success notification
      const toastId = `completed:${props.txHash}`
      toast(<ToastCompleted {...props} onDismiss={() => toast.dismiss(toastId)} />, {
        ...TOAST_OPTIONS,
        toastId,
        autoClose: 5000,
      })
    })
    .catch(() => {
      setTimeout(onDismiss, 3000)

      // Spawn error notification
      const toastId = `failed:${props.txHash}`
      toast(<ToastFailed {...props} onDismiss={() => toast.dismiss(toastId)} />, {
        ...TOAST_OPTIONS,
        toastId,
      })
    })

  return toast(<ToastPending {...props} onDismiss={onDismiss} />, {
    ...TOAST_OPTIONS,
    toastId: props.txHash,
  })
}

export const createErrorToast = (message: string | undefined, code: boolean) => {
  if (!message) return

  const toastId = `failed:${nanoid()}`
  toast(
    <>
      <ToastContent title="Error Occurred" summary={message} code={code} />
      <ToastButtons onDismiss={() => toast.dismiss(toastId)} />
    </>,
    {
      ...TOAST_OPTIONS,
      toastId,
    }
  )
}

export const createZealyErrorToast = (message: string | undefined, code: boolean) => {
  if (!message) return

  const toastId = `zealy`
  toast(
    <>
      <ToastContent title="Error Occurred" summary={message} code={code} />
      <ToastButtons onDismiss={() => toast.dismiss(toastId)} />
    </>,
    {
      position: 'bottom-right',
      autoClose: 5000,
      hideProgressBar: true,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: false,
      progress: undefined,
      closeButton: false,
      icon: false,
      toastId,
    }
  )
}

export const createSuccessToast = (props: Omit<NotificationData, 'promise'>) => {
  const toastId = `completed:${props.txHash}`
  toast(<ToastCompleted {...props} onDismiss={() => toast.dismiss(toastId)} />, {
    ...TOAST_OPTIONS,
    toastId,
    autoClose: 5000,
  })
}

export const createFailedToast = (props: Omit<NotificationData, 'promise'>) => {
  const toastId = `failed:${props.txHash}`
  toast(<ToastFailed {...props} onDismiss={() => toast.dismiss(toastId)} />, {
    ...TOAST_OPTIONS,
    toastId,
    autoClose: 5000,
  })
}

export const createInfoToast = (props: Omit<NotificationData, 'promise'>) => {
  const toastId = `info:${props.txHash}`
  toast(<ToastInfo {...props} onDismiss={() => toast.dismiss(toastId)} />, {
    ...TOAST_OPTIONS,
    toastId,
    autoClose: 5000,
  })
}

export interface BridgeToastConfig {
  tokenSymbol: string
  bridgeTxHash: string
  evmExplorerUrl: string
}

export const createBridgeToast = (config: BridgeToastConfig) => {
  const toastId = `bridge-pending:${config.bridgeTxHash}`

  toast(
    <ToastBridgePending
      type="send"
      summary={{
        pending: `Waiting for ${config.tokenSymbol} to arrive on Hathor network`,
        completed: `Bridge complete! ${config.tokenSymbol} received on Hathor network.`,
        failed: '',
      }}
      txHash={config.bridgeTxHash}
      href={config.evmExplorerUrl}
      groupTimestamp={Date.now()}
      timestamp={Date.now()}
      onDismiss={() => toast.dismiss(toastId)}
    />,
    {
      ...TOAST_OPTIONS,
      toastId,
      autoClose: false, // Don't auto-close, let notification center polling complete it
    }
  )

  return toastId
}
