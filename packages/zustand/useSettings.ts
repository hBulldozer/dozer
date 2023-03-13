import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsProps {
  slippageTolerance: number
  setSlippageTolerance: (slippageTolerance: number) => void
}

export const useSettings = create<SettingsProps>()(
  persist(
    (set) => ({
      slippageTolerance: 0.5,
      setSlippageTolerance: (slippageTolerance: number) => set((state) => ({ slippageTolerance: slippageTolerance })),
    }),
    {
      name: 'settings-storage',
    }
  )
)
