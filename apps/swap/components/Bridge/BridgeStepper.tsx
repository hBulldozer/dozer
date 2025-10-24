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
  const { evmConfirmationTime, hathorAddress, tokenUuid, updateStep, setHathorReceipt, tokenSymbol } =
    useBridgeTransactionStore()

  // NOTE: Hathor receipt polling has been moved to ToastBridgePending component
  // The toast notification will handle checking for Hathor network confirmation in the background
  // This allows the user to continue using the app without being blocked by the stepper

  return (
    <div className="w-full bg-stone-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <Typography variant="lg" weight={600} className="text-white">
          Bridge Transaction Progress
        </Typography>
        {onClose && (
          <button onClick={onClose} className="text-stone-400 hover:text-white transition-colors">
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
                    step.status === 'completed'
                      ? 'text-green-400'
                      : step.status === 'active'
                      ? 'text-blue-400'
                      : step.status === 'failed'
                      ? 'text-red-400'
                      : 'text-stone-400'
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
                        ? `https://explorer.${
                            bridgeConfig.isTestnet ? 'bravo.nano-testnet.' : ''
                          }hathor.network/transaction/${step.txHash}`
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
                {step.description}
              </Typography>
            </div>

            {/* Connecting Line */}
            {index < steps.length - 1 && <div className="absolute left-[42px] w-0.5 h-8 bg-stone-600 mt-6" />}
          </div>
        ))}
      </div>
    </div>
  )
}
