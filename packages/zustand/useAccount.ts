import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
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
      ],
      setBalance: (balance) => set((state) => ({ balance: balance })),
    }),
    {
      name: 'account-storage',
    }
  )
)
