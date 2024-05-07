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
  notifications: Record<number, string[]>
  setNotifications: (notifications: Record<number, string[]>) => void
  clearNotifications: () => void
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
    }),
    {
      name: 'account-storage',
    }
  )
)
