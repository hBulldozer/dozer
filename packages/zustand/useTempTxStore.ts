import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TempTx {
  addedLiquidity: { tokenA: number; tokenB: number }
  removedLiquidity: { tokenA: number; tokenB: number }
  blockHeight: number
}

interface TempTxState {
  tempTxs: {
    [poolId: string]: {
      [address: string]: TempTx
    }
  }
  addTempTx: (
    poolId: string,
    address: string,
    tokenA: number,
    tokenB: number,
    isAdding: boolean,
    blockHeight: number
  ) => void
  clearOldTempTxs: (currentBlockHeight: number) => void
  getTempTx: (poolId: string, address: string) => TempTx
}

export const useTempTxStore = create<TempTxState>()(
  persist(
    (set, get) => ({
      tempTxs: {},
      addTempTx: (poolId, address, tokenA, tokenB, isAdding, blockHeight) =>
        set((state) => {
          const poolTxs = state.tempTxs[poolId] || {}
          const addressTxs = poolTxs[address] || {
            addedLiquidity: { tokenA: 0, tokenB: 0 },
            removedLiquidity: { tokenA: 0, tokenB: 0 },
            blockHeight: blockHeight,
          }

          if (isAdding) {
            addressTxs.addedLiquidity.tokenA += tokenA
            addressTxs.addedLiquidity.tokenB += tokenB
          } else {
            addressTxs.removedLiquidity.tokenA += tokenA
            addressTxs.removedLiquidity.tokenB += tokenB
          }

          addressTxs.blockHeight = blockHeight

          return {
            tempTxs: {
              ...state.tempTxs,
              [poolId]: {
                ...poolTxs,
                [address]: addressTxs,
              },
            },
          }
        }),
      clearOldTempTxs: (currentBlockHeight) =>
        set((state) => {
          const newTempTxs = { ...state.tempTxs }
          Object.keys(newTempTxs).forEach((poolId) => {
            Object.keys(newTempTxs[poolId]).forEach((address) => {
              if (newTempTxs[poolId][address].blockHeight < currentBlockHeight) {
                delete newTempTxs[poolId][address]
              }
            })
            if (Object.keys(newTempTxs[poolId]).length === 0) {
              delete newTempTxs[poolId]
            }
          })
          return { tempTxs: newTempTxs }
        }),
      getTempTx: (poolId, address) => {
        const state = get()
        return (
          state.tempTxs[poolId]?.[address] || {
            addedLiquidity: { tokenA: 0, tokenB: 0 },
            removedLiquidity: { tokenA: 0, tokenB: 0 },
            blockHeight: 0,
          }
        )
      },
    }),
    {
      name: 'temp-tx-storage',
    }
  )
)
