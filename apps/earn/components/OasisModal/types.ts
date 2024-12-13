// types.ts
export interface OasisToken {
  symbol: string
}

export interface OasisPosition {
  id: string
  user_deposit_b: number
  user_balance_a: number
  user_withdrawal_time: Date
  max_withdraw_htr: number
  max_withdraw_b: number
  token: OasisToken
  user_lp_htr: number
  user_lp_b: number
}

export interface OasisRemoveModalProps {
  open: boolean
  setOpen: (open: boolean) => void
  oasis: OasisPosition | null
  onConfirm: (amount: string) => Promise<void>
  isRpcRequestPending: boolean
  onReset: () => void
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