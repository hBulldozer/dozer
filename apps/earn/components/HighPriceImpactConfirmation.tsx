import React, { FC, useState, useCallback } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Button, Typography } from '@dozer/ui'

interface HighPriceImpactConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  priceImpact: number
  action?: 'add' | 'remove'
  blocking?: boolean
}

export const HighPriceImpactConfirmation: FC<HighPriceImpactConfirmationProps> = ({
  isOpen,
  onClose,
  onConfirm,
  priceImpact,
  action = 'add',
  blocking = false,
}) => {
  const [confirmText, setConfirmText] = useState('')
  const isConfirmValid = confirmText.toLowerCase() === 'confirm'

  const handleConfirm = useCallback(() => {
    if (isConfirmValid) {
      onConfirm()
      setConfirmText('')
      onClose()
    }
  }, [isConfirmValid, onConfirm, onClose])

  const handleClose = useCallback(() => {
    setConfirmText('')
    onClose()
  }, [onClose])

  const actionText = action === 'add' ? 'Add Liquidity' : 'Remove Liquidity'

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-stone-900 border border-stone-700 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title as="div" className="flex items-center gap-3">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                    <Typography variant="lg" weight={600} className="text-white">
                      {blocking ? 'Price Impact Too High' : 'High Price Impact Warning'}
                    </Typography>
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    className="rounded-lg p-1 text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                    <Typography variant="sm" className="text-red-200 mb-2">
                      {blocking ? (
                        <>Single token liquidity addition only works for price impacts lower than <span className="font-bold">5%</span>.</>
                      ) : (
                        <>This transaction has a price impact of <span className="font-bold">{priceImpact.toFixed(2)}%</span></>
                      )}
                    </Typography>
                    <Typography variant="xs" className="text-red-300">
                      {blocking
                        ? 'Please lower the amount of the deposit.'
                        : 'You will lose a significant amount of value due to the internal swap required. Consider using a smaller amount.'}
                    </Typography>
                  </div>

                  {!blocking && (
                    <div className="space-y-2">
                      <Typography variant="sm" className="text-stone-300">
                        Type <span className="font-mono font-bold text-white">"confirm"</span> to proceed with this transaction:
                      </Typography>
                      <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="confirm"
                        className="w-full px-3 py-2 bg-stone-800 border border-stone-600 rounded-lg text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        autoFocus
                      />
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button
                      fullWidth
                      onClick={handleClose}
                      color="gray"
                      variant="outlined"
                    >
                      {blocking ? 'Close' : 'Cancel'}
                    </Button>
                    {!blocking && (
                      <Button
                        fullWidth
                        onClick={handleConfirm}
                        color="red"
                        disabled={!isConfirmValid}
                      >
                        {actionText} Anyway
                      </Button>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
