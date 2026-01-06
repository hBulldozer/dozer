import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface BridgeStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'active' | 'completed' | 'failed'
  txHash?: string
  timestamp?: number
  error?: string
}

export interface BridgeTransactionState {
  // Transaction details
  tokenAddress?: string
  tokenUuid?: string
  tokenSymbol?: string
  amount?: string
  hathorAddress?: string
  
  // Transaction hashes
  approvalTxHash?: string
  bridgeTxHash?: string
  hathorTxHash?: string
  
  // Timestamps
  approvalTime?: number
  bridgeTime?: number
  evmConfirmationTime?: number
  hathorReceiptTime?: number
  
  // UI state
  isActive: boolean
  currentStep: number
  steps: BridgeStep[]
  
  // User preferences
  isDismissed: boolean
}

export interface BridgeTransactionActions {
  // Transaction management
  startBridge: (params: {
    tokenAddress: string
    tokenUuid: string
    tokenSymbol: string
    amount: string
    hathorAddress: string
  }) => void
  
  // Step updates
  updateStep: (stepId: string, status: BridgeStep['status'], txHash?: string, error?: string) => void
  setApprovalTxHash: (txHash: string) => void
  setBridgeTxHash: (txHash: string) => void
  setEvmConfirmationTime: (timestamp: number) => void
  setHathorReceipt: (txHash: string, timestamp: number) => void
  
  // UI actions
  setCurrentStep: (step: number) => void
  dismissTransaction: () => void
  clearTransaction: () => void
  restoreTransaction: () => void
  
  // Utility
  getActiveTransaction: () => BridgeTransactionState | null
  isTransactionActive: () => boolean
}

const initialSteps: BridgeStep[] = [
  {
    id: 'processing',
    title: 'Processing Request',
    description: 'Preparing transaction and opening MetaMask...',
    status: 'pending'
  },
  {
    id: 'approval',
    title: 'Token Approval',
    description: 'Approve token spending in MetaMask',
    status: 'pending'
  },
  {
    id: 'approval-confirmed',
    title: 'Approval Confirmed',
    description: 'Approval transaction confirmed on network',
    status: 'pending'
  },
  {
    id: 'bridge-tx',
    title: 'Bridge Transaction',
    description: 'Sign bridge transaction in MetaMask',
    status: 'pending'
  },
  {
    id: 'evm-confirming',
    title: 'EVM Confirming',
    description: 'Waiting for block confirmations on Ethereum network',
    status: 'pending'
  }
]

const initialState: BridgeTransactionState = {
  isActive: false,
  currentStep: 0,
  steps: initialSteps,
  isDismissed: false
}

export const useBridgeTransactionStore = create<BridgeTransactionState & BridgeTransactionActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      startBridge: (params) => {
        set({
          ...params,
          isActive: true,
          currentStep: 0,
          steps: initialSteps.map(step => ({ ...step, status: 'pending' as const })),
          isDismissed: false,
          // Clear previous transaction data
          approvalTxHash: undefined,
          bridgeTxHash: undefined,
          hathorTxHash: undefined,
          approvalTime: undefined,
          bridgeTime: undefined,
          evmConfirmationTime: undefined,
          hathorReceiptTime: undefined
        })
      },
      
      updateStep: (stepId, status, txHash, error) => {
        const state = get()
        const stepIndex = state.steps.findIndex(step => step.id === stepId)
        
        if (stepIndex === -1) return
        
        const newSteps = [...state.steps]
        newSteps[stepIndex] = {
          ...newSteps[stepIndex],
          status,
          ...(txHash && { txHash }),
          ...(error && { error }),
          timestamp: Date.now()
        }
        
        // Update current step based on progress
        let newCurrentStep = state.currentStep
        if (status === 'active') {
          newCurrentStep = stepIndex
        } else if (status === 'completed') {
          newCurrentStep = Math.min(stepIndex + 1, newSteps.length - 1)
        }
        
        set({
          steps: newSteps,
          currentStep: newCurrentStep
        })
      },
      
      setApprovalTxHash: (txHash) => {
        set({
          approvalTxHash: txHash,
          approvalTime: Date.now()
        })
      },
      
      setBridgeTxHash: (txHash) => {
        set({
          bridgeTxHash: txHash,
          bridgeTime: Date.now()
        })
      },
      
      setEvmConfirmationTime: (timestamp) => {
        set({
          evmConfirmationTime: timestamp
        })
      },
      
      setHathorReceipt: (txHash, timestamp) => {
        set({
          hathorTxHash: txHash,
          hathorReceiptTime: timestamp
        })
      },
      
      setCurrentStep: (step) => {
        set({ currentStep: step })
      },
      
      dismissTransaction: () => {
        set({ isDismissed: true })
      },
      
      clearTransaction: () => {
        set(initialState)
      },
      
      restoreTransaction: () => {
        set({ isDismissed: false })
      },
      
      getActiveTransaction: () => {
        const state = get()
        return state.isActive ? state : null
      },
      
      isTransactionActive: () => {
        const state = get()
        return state.isActive && !state.isDismissed
      }
    }),
    {
      name: 'bridge-transaction-storage',
      // Only persist the transaction data, not UI state
      partialize: (state) => ({
        tokenAddress: state.tokenAddress,
        tokenUuid: state.tokenUuid,
        tokenSymbol: state.tokenSymbol,
        amount: state.amount,
        hathorAddress: state.hathorAddress,
        approvalTxHash: state.approvalTxHash,
        bridgeTxHash: state.bridgeTxHash,
        hathorTxHash: state.hathorTxHash,
        approvalTime: state.approvalTime,
        bridgeTime: state.bridgeTime,
        evmConfirmationTime: state.evmConfirmationTime,
        hathorReceiptTime: state.hathorReceiptTime,
        isActive: state.isActive,
        currentStep: state.currentStep,
        steps: state.steps,
        isDismissed: state.isDismissed
      })
    }
  )
)