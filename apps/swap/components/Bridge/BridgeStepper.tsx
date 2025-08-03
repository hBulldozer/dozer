import { FC, useEffect, useState } from 'react'
import { CheckCircleIcon, ClockIcon, XMarkIcon } from '@heroicons/react/24/solid'
import { Typography, Loader, classNames } from '@dozer/ui'
import bridgeConfig from '@dozer/higmi/config/bridge'
import { useBridgeTransactionStore } from '@dozer/zustand'

export interface BridgeStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'active' | 'completed' | 'failed'
  txHash?: string
  timestamp?: number
}

interface BridgeStepperProps {
  steps: BridgeStep[]
  currentStep: number
  onClose?: () => void
}

export const BridgeStepper: FC<BridgeStepperProps> = ({ steps, currentStep, onClose }) => {
  const { 
    evmConfirmationTime, 
    hathorAddress, 
    tokenUuid, 
    updateStep, 
    setHathorReceipt,
    tokenSymbol 
  } = useBridgeTransactionStore()

  // State to force re-renders for timing display
  const [currentTime, setCurrentTime] = useState(Date.now())

  // Check Hathor receipt
  useEffect(() => {
    if (!evmConfirmationTime || !hathorAddress || !tokenUuid) {
      return
    }

    const checkHathorReceipt = async () => {
      try {
        // Get the latest transaction for this token from explorer
        const explorerUrl = bridgeConfig.isTestnet 
          ? 'https://explorer-service.bravo.nano-testnet.hathor.network'
          : 'https://explorer-service.hathor.network' // Adjust for mainnet
        
        const historyResponse = await fetch(
          `${explorerUrl}/address/history?address=${hathorAddress}&token=${tokenUuid}&limit=1`
        )
        
        if (!historyResponse.ok) return
        
        const historyData = await historyResponse.json()
        
        if (historyData.history && historyData.history.length > 0) {
          const latestTx = historyData.history[0]
          
          // Check if this transaction is after EVM confirmation
          if (latestTx.timestamp > evmConfirmationTime && latestTx.balance > 0) {
            // Get transaction details to verify it's confirmed
            const nodeUrl = bridgeConfig.isTestnet
              ? 'https://node1.bravo.nano-testnet.hathor.network/v1a'
              : 'https://node1.mainnet.hathor.network/v1a' // Adjust for mainnet
            
            const txResponse = await fetch(`${nodeUrl}/transaction?id=${latestTx.tx_id}`)
            
            if (txResponse.ok) {
              const txData = await txResponse.json()
              
              // Check if transaction is confirmed (has first_block and not voided)
              if (txData.success && 
                  txData.meta?.first_block && 
                  (!txData.meta?.voided_by || txData.meta.voided_by.length === 0)) {
                
                updateStep('hathor-received', 'completed', latestTx.tx_id)
                setHathorReceipt(latestTx.tx_id, latestTx.timestamp)
                return // Stop polling
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking Hathor receipt:', error)
      }
    }

    // Poll every 10 seconds for Hathor confirmation
    const interval = setInterval(checkHathorReceipt, 10000)
    
    // Initial check
    checkHathorReceipt()
    
    return () => clearInterval(interval)
  }, [evmConfirmationTime, hathorAddress, tokenUuid, updateStep, setHathorReceipt])

  // Effect to update the timing display every second for the final step
  useEffect(() => {
    const hathorStep = steps.find(step => step.id === 'hathor-received')
    if (hathorStep?.status === 'active' && evmConfirmationTime) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now()) // Update current time to force re-render
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }, [steps, evmConfirmationTime])

  return (
    <div className="w-full bg-stone-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <Typography variant="lg" weight={600} className="text-white">
          Bridge Transaction Progress
        </Typography>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-stone-400 hover:text-white transition-colors"
          >
            <XMarkIcon width={20} height={20} />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start gap-3">
            {/* Step Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {step.status === 'completed' ? (
                <CheckCircleIcon width={20} height={20} className="text-green-500" />
              ) : step.status === 'active' ? (
                <Loader size={20} className="text-blue-500" />
              ) : step.status === 'failed' ? (
                <XMarkIcon width={20} height={20} className="text-red-500" />
              ) : (
                <ClockIcon width={20} height={20} className="text-stone-500" />
              )}
            </div>

            {/* Step Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Typography 
                  variant="sm" 
                  weight={500} 
                  className={classNames(
                    step.status === 'completed' ? 'text-green-400' :
                    step.status === 'active' ? 'text-blue-400' :
                    step.status === 'failed' ? 'text-red-400' :
                    'text-stone-400'
                  )}
                >
                  {/* Dynamic title based on status */}
                  {step.status === 'completed' && step.id === 'evm-confirming' 
                    ? 'EVM Confirmed'
                    : step.status === 'completed' && step.id === 'hathor-received'
                    ? 'Tokens Received'
                    : step.title}
                </Typography>
                {step.txHash && (
                  <a
                    href={
                      step.id === 'hathor-received' 
                        ? `https://explorer.${bridgeConfig.isTestnet ? 'bravo.nano-testnet.' : ''}hathor.network/transaction/${step.txHash}`
                        : `${bridgeConfig.ethereumConfig.explorer}/tx/${step.txHash}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    View TX
                  </a>
                )}
              </div>
              <Typography variant="xs" className="text-stone-500 mt-0.5">
                {step.id === 'hathor-received' && step.status === 'active' && evmConfirmationTime
                  ? `${step.description} • Started ${Math.floor((currentTime - evmConfirmationTime * 1000) / 1000)}s ago`
                  : step.description}
              </Typography>
            </div>

            {/* Connecting Line */}
            {index < steps.length - 1 && (
              <div className="absolute left-[42px] w-0.5 h-8 bg-stone-600 mt-6" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}