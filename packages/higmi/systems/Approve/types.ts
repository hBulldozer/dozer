import { ButtonProps, NotificationData } from '@dozer/ui'
import { ReactElement } from 'react'

// import { ApprovalState } from '../../hooks'
import { ApprovalAction } from './Approve'

export enum ApprovalState {
  LOADING = 'LOADING',
  UNKNOWN = 'UNKNOWN',
  NOT_APPROVED = 'NOT_APPROVED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
}

export type ApprovalButtonRenderProp = {
  onApprove(): void
  approvalState: ApprovalState
}

export interface ApproveButton<T> extends Omit<ButtonProps<'button'>, 'onClick'> {
  id?: string
  dispatch?(payload: ApprovalAction): void
  index?: number
  render?: (renderProps: T) => ReactElement
  initialized?: boolean
  allApproved?: boolean
  hideIcon?: boolean
  onSuccess?(data: NotificationData): void
  enabled?: boolean
}
