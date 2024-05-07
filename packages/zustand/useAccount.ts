import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

const { USDT_UUID } = process.env
interface TokenBalance {
  token_uuid: string
  token_symbol: string
  token_balance: number
}
export interface AccountState {
  address: string
  setAddress: (address: string) => void
  balance: TokenBalance[]
  setBalance: (balance: TokenBalance[]) => void
  editBalanceOnSwap: (amount_in: number, token_in: string, amount_out: number, token_out: string) => void
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
      editBalanceOnSwap: (amount_in: number, token_in: string, amount_out: number, token_out: string) =>
        set((state) => ({
          balance: state.balance.map((token: TokenBalance) => {
            if (token.token_uuid == token_in) return { ...token, token_balance: token.token_balance - amount_in }
            else if (token.token_uuid == token_out) return { ...token, token_balance: token.token_balance + amount_out }
            else return token
          }),
        })),
      notifications: [],
      setNotifications: (notifications) => set((state) => ({ notifications: notifications })),
      clearNotifications: () => set((state) => ({ notifications: [] })),
      setNotificationValidated: (txHash: string) =>
        set((state) => ({
          notifications: [
            state.notifications[0].map((notification) => {
              const json = JSON.parse(notification)
              console.log(json)
              if (json.txHash == txHash) {
                const new_json = { ...json, validated: true }
                return JSON.stringify(new_json)
              } else {
                return notification
              }
            }),
          ],
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
