import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ChainId } from '@dozer/chain'

interface Network {
  network: ChainId
  setNetwork: (network: ChainId) => void
}

export const useNetwork = create<Network>()(
  persist(
    (set) => ({
      network: ChainId.HATHOR,
      setNetwork: (network) => set((state) => ({ network: network })),
    }),
    {
      name: 'network-storage',
    }
  )
)
