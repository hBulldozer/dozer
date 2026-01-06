export interface OasisPosition {
  id: string
  user_deposit_b: number
  user_balance_a: number
  user_withdrawal_time: Date
  max_withdraw_htr: number
  max_withdraw_b: number
  token: { symbol: string; uuid: string }
  user_lp_htr: number
  user_lp_b: number
  htr_price_in_deposit: number
  token_price_in_htr_in_deposit: number
  position_closed?: boolean
  closed_balance_a?: number
  closed_balance_b?: number
}

export interface OasisAddModalProps {
  open: boolean
  setOpen: (open: boolean) => void
  amount: string
  token: string
  bonus: number
  htrMatch: number
  unlockDate: Date
  onConfirm: () => Promise<void>
  isRpcRequestPending: boolean
  onReset: () => void
}

export interface OasisRemoveModalProps {
  open: boolean
  setOpen: (open: boolean) => void
  oasis: OasisPosition | null
  onConfirm: (amount: number, amount_htr: number) => Promise<void>
  isRpcRequestPending: boolean
  onReset: () => void
}

export interface OasisClosePositionModalProps {
  open: boolean
  setOpen: (open: boolean) => void
  oasis: OasisPosition | null
  onConfirm: () => Promise<void>
  isRpcRequestPending: boolean
  onReset: () => void
}
