import {create} from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface AccountState {
    address: string
    setAddress: (address: string) => void
  }
  
  export const useAccount = create<AccountState>()(    
        (set) => ({
          address: '',
          setAddress: (address) => set((state) => ({ address: address })),
        })
    )