import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsProps {
  slippageTolerance: number
  setSlippageTolerance: (slippageTolerance: number) => void
  slippageToleranceType: 'auto' | 'custom'
  setSlippageToleranceType: (slippageToleranceType: 'auto' | 'custom') => void
}

export const useSettings = create<SettingsProps>()(
  persist(
    (set) => ({
      slippageTolerance: 0.5,
      setSlippageTolerance: (slippageTolerance: number) => set((state) => ({ slippageTolerance: slippageTolerance })),
      slippageToleranceType: 'auto',
      setSlippageToleranceType: (slippageToleranceType: 'auto' | 'custom') =>
        set((state) => ({
          slippageToleranceType: slippageToleranceType,
          slippageTolerance: slippageToleranceType == 'auto' ? 0.5 : state.slippageTolerance,
        })),
    }),
    {
      name: 'settings-storage',
    }
  )
)
