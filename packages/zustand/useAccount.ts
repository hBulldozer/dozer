import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

const { USDT_UUID } = process.env
export interface TokenBalance {
  token_uuid: string
  token_symbol: string
  token_balance: number
}
export interface AccountState {
  address: string
  setAddress: (address: string) => void
  balance: TokenBalance[]
  setBalance: (balance: TokenBalance[]) => void
  notifications: Record<number, string[]>
  setNotifications: (notifications: Record<number, string[]>) => void
  clearNotifications: () => void
  setNotificationValidated: (txHash: string) => void
  addNotification: (notification: string[]) => void
}

export const useAccount = create<AccountState>()(
  persist(
    (set) => ({
      address: '',
      setAddress: (address) => set((state) => ({ address: address })),
      balance: [
        {
          token_uuid: '00',
          token_symbol: 'HTR',
          token_balance: 0,
        },
        {
          token_uuid: USDT_UUID ? USDT_UUID : '',
          token_symbol: 'USDT',
          token_balance: 100,
        },
      ],
      setBalance: (balance) => set((state) => ({ balance: balance })),

      notifications: [],
      setNotifications: (notifications) => set((state) => ({ notifications: notifications })),
      clearNotifications: () => set((state) => ({ notifications: [] })),
      setNotificationValidated: (txHash: string) =>
        set((state) => ({
          notifications: Object.keys(state.notifications).map((val: string, idx: number, array) => {
            const notification = JSON.parse(array[0])
            if (notification == txHash) {
              const arr: string[] = []
              const new_json = { ...notification, validated: true }
              const new_str = JSON.stringify(new_json)
              arr.push(new_str)
              return arr
            } else return array
          }),
        })),
      addNotification: (notification: string[]) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            [Object.keys(state.notifications).length + 1]: notification,
          },
        })),
    }),
    {
      name: 'account-storage',
    }
  )
)
