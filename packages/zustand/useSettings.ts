import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsProps {
  slippageTolerance: number
  setSlippageTolerance: (slippageTolerance: number) => void
  slippageToleranceType: 'auto' | 'custom'
  setSlippageToleranceType: (slippageToleranceType: 'auto' | 'custom') => void
  expertMode: boolean
  updateExpertMode: (expertMode: boolean) => void
}

export const useSettings = create<SettingsProps>()(
  persist(
    (set) => ({
      slippageTolerance: 1.5 / 100,
      setSlippageTolerance: (slippageTolerance: number) => set((state) => ({ slippageTolerance: slippageTolerance })),
      slippageToleranceType: 'auto',
      setSlippageToleranceType: (slippageToleranceType: 'auto' | 'custom') =>
        set((state) => ({
          slippageToleranceType: slippageToleranceType,
          slippageTolerance: slippageToleranceType == 'auto' ? 1.5 / 100 : state.slippageTolerance,
        })),
      expertMode: false,
      updateExpertMode: (expertMode: boolean) => set((state) => ({ expertMode })),
    }),
    {
      name: 'settings-storage',
    }
  )
)
