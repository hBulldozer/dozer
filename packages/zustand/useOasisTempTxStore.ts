// packages/zustand/useOasisTempTxStore.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type TransactionType = 'bonus' | 'withdraw' | 'add' | 'close'

interface OasisTempTx {
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
  blockHeight: number
  txType: TransactionType
}

interface OasisTempTxState {
  pendingPositions: {
    [address: string]: OasisTempTx[]
  }
  addPendingPosition: (
    address: string,
    position: Omit<OasisTempTx, 'blockHeight' | 'txType'>,
    blockHeight: number,
    txType: TransactionType
  ) => void
  clearOldPendingPositions: (currentBlockHeight: number) => void
  getPendingPositions: (address: string) => OasisTempTx[]
}

export const useOasisTempTxStore = create<OasisTempTxState>()(
  persist(
    (set, get) => ({
      pendingPositions: {},

      addPendingPosition: (address, position, blockHeight, txType) =>
        set((state) => {
          const addressPositions = state.pendingPositions[address] || []
          return {
            pendingPositions: {
              ...state.pendingPositions,
              [address]: [...addressPositions, { ...position, blockHeight, txType }],
            },
          }
        }),

      clearOldPendingPositions: (currentBlockHeight) =>
        set((state) => {
          const newPendingPositions = { ...state.pendingPositions }
          Object.keys(newPendingPositions).forEach((address) => {
            newPendingPositions[address] = newPendingPositions[address].filter(
              (pos) => pos.blockHeight >= currentBlockHeight
            )
            if (newPendingPositions[address].length === 0) {
              delete newPendingPositions[address]
            }
          })
          return { pendingPositions: newPendingPositions }
        }),

      getPendingPositions: (address) => {
        const state = get()
        return state.pendingPositions[address] || []
      },
    }),
    {
      name: 'oasis-temp-tx-storage',
    }
  )
)
