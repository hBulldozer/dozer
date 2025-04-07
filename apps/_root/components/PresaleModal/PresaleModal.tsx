'use client'
import React, { useState } from 'react'
import { Dialog, Typography, Button, CopyHelper, Input } from '@dozer/ui'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { CheckIcon, CurrencyDollarIcon } from '@heroicons/react/24/solid'
import { ChevronRightIcon, ArrowPathIcon, ArrowLeftIcon, LinkIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import { api } from '../../utils/api'
import { createSuccessToast, createErrorToast, createFailedToast } from '@dozer/ui/toast'
import Image from 'next/image'
import { PRESALE_CONFIG } from '../../utils/presalePrice'

interface PresaleModalProps {
  isOpen: boolean
  onClose: () => void
  className?: string
  currentPrice?: number
  isPresaleActive?: boolean
}

// Network payment information
interface NetworkInfo {
  id: string
  name: string
  description: string
  icon: JSX.Element
  address: string
  qrValue: string
  tokenSymbol: string
}

const PresaleModal: React.FC<PresaleModalProps> = ({
  isOpen,
  onClose,
  className,
  currentPrice = 1.0,
  isPresaleActive = true,
}) => {
  // Track the current step in the process
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedNetwork, setSelectedNetwork] = useState<'solana' | 'evm' | null>(null)

  // Form data for step 3
  const [transactionProof, setTransactionProof] = useState('')
  const [contactInfo, setContactInfo] = useState('')
  const [hathorAddress, setHathorAddress] = useState('')
  const [formErrors, setFormErrors] = useState({
    transactionProof: false,
    hathorAddress: false,
  })

  // State for success message
  const [submissionSuccess, setSubmissionSuccess] = useState(false)
  const [submissionMessage, setSubmissionMessage] = useState('')

  // Networks available for selection with payment information
  const networks: NetworkInfo[] = [
    {
      id: 'solana',
      name: 'Solana',
      description: 'Fast and cost-effective transactions',
      icon: <Image src="/logos/SOL.svg" alt="Solana" width={20} height={20} className="max-w-full" />,
      address: 'BXoPwnP5AASwV9cM1mDkMh5GL7iearqabEx1r8Wp1M4t',
      qrValue: 'solana:BXoPwnP5AASwV9cM1mDkMh5GL7iearqabEx1r8Wp1M4t',
      tokenSymbol: 'USDT',
    },
    {
      id: 'evm',
      name: 'EVM Networks',
      description: 'Compatible with Ethereum, BSC, Polygon, etc.',
      icon: <Image src="/logos/ETH.svg" alt="Ethereum" width={18} height={18} className="max-w-full" />,
      address: '0xd4252011f8197FaD96f11Ca04D13b70806f05060',
      qrValue: 'ethereum:0xd4252011f8197FaD96f11Ca04D13b70806f05060',
      tokenSymbol: 'USDT/USDC',
    },
  ]

  // tRPC mutation for submitting presale proof
  const submitPresaleMutation = api.getPresale.submitPresaleProof.useMutation({
    onSuccess: (data) => {
      setSubmissionSuccess(true)
      setSubmissionMessage(data.message)
      // Will reset and close when user clicks "Done"
    },
    onError: (error) => {
      console.error('Submission error:', error)
      // Use the appropriate toast structure
      const txHash = `submission-error-${Date.now()}`

      createSuccessToast({
        type: 'send',
        summary: {
          pending: 'Processing submission...',
          completed: 'Submission successful!',
          failed: error.message || 'Failed to submit your presale information. Please try again.',
        },
        txHash,
        groupTimestamp: Date.now(),
        timestamp: Date.now(),
      })

      // Force it to show as error
      createFailedToast({
        type: 'send',
        summary: {
          pending: 'Processing submission...',
          completed: 'Submission successful!',
          failed: error.message || 'Failed to submit your presale information. Please try again.',
        },
        txHash: `error-${txHash}`,
        groupTimestamp: Date.now(),
        timestamp: Date.now(),
      })
    },
  })

  // Handle network selection
  const handleNetworkSelect = (network: 'solana' | 'evm') => {
    setSelectedNetwork(network)
  }

  // Handle continue to next step
  const handleContinue = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSubmit()
    }
  }

  // Handle back to previous step
  const handleBack = () => {
    setCurrentStep(currentStep - 1)
  }

  // Get the selected network info
  const getSelectedNetworkInfo = (): NetworkInfo | undefined => {
    return networks.find((network) => network.id === selectedNetwork)
  }

  // Validate form fields
  const validateForm = () => {
    const errors = {
      transactionProof: !transactionProof.trim(),
      hathorAddress: !hathorAddress.trim(),
    }

    setFormErrors(errors)
    return !Object.values(errors).some((error) => error)
  }

  // Handle form submission
  const handleSubmit = () => {
    if (validateForm()) {
      try {
        // Submit to the API with all required fields
        submitPresaleMutation.mutate({
          network: selectedNetwork as 'solana' | 'evm',
          transactionProof,
          contactInfo: contactInfo || 'Will provide later', // Default value to satisfy validation
          hathorAddress,
          price: currentPrice || 1.0, // Use safe value
        })
      } catch (error) {
        console.error('Submission error:', error)
        createErrorToast('Failed to submit. Please try again.', false)
      }
    }
  }

  // Handle done after successful submission
  const handleDone = () => {
    // Reset form
    setTransactionProof('')
    setContactInfo('')
    setHathorAddress('')
    setCurrentStep(1)
    setSubmissionSuccess(false)
    onClose()
  }

  // API endpoint for updating contact info
  const updateContactInfoMutation = api.getPresale.updateContactInfo.useMutation({
    onSuccess: (data) => {
      createSuccessToast({
        type: 'send',
        summary: {
          pending: 'Updating contact information...',
          completed: 'Contact information updated successfully!',
          failed: 'Failed to update contact information.',
        },
        txHash: `contact-${Date.now()}`,
        groupTimestamp: Date.now(),
        timestamp: Date.now(),
      })
    },
    onError: (error) => {
      console.error('Update contact info error:', error)

      const txHash = `contact-error-${Date.now()}`
      createFailedToast({
        type: 'send',
        summary: {
          pending: 'Updating contact information...',
          completed: 'Contact information updated!',
          failed: error.message || 'Failed to update contact information.',
        },
        txHash,
        groupTimestamp: Date.now(),
        timestamp: Date.now(),
      })
    },
  })

  // Add default in the error handler to avoid exceptions
  const priceToDisplay = typeof currentPrice === 'number' ? currentPrice : 1.0

  // Update the content based on presale status
  if (!isPresaleActive) {
    return (
      <Dialog open={isOpen} onClose={onClose}>
        <Dialog.Content
          className={`w-screen max-w-md bg-stone-950 !mt-24 pt-16 !pb-2 flex flex-col min-h-[560px] ${className || ''}`}
        >
          <Dialog.Header title="Dozer Presale" onClose={onClose} className="pb-2" />

          <div className="flex flex-col items-center justify-center flex-grow p-8 text-center">
            <Typography
              variant="h3"
              weight={700}
              className="mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600"
            >
              {new Date() < PRESALE_CONFIG.START_DATE ? 'Presale Not Started Yet' : 'Presale Has Ended'}
            </Typography>

            <Typography variant="lg" className="mb-8 text-neutral-300">
              {new Date() < PRESALE_CONFIG.START_DATE
                ? `The presale starts on ${PRESALE_CONFIG.START_DATE.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}.`
                : 'Thank you for your interest in the Dozer presale. The presale period has ended.'}
            </Typography>

            <Button
              onClick={onClose}
              className="px-10 py-3 text-sm font-bold tracking-wider bg-yellow-800/50 text-yellow-200 rounded-xl hover:bg-yellow-700/50"
            >
              Close
            </Button>
          </div>
        </Dialog.Content>
      </Dialog>
    )
  }

  // Rest of the component for active presale
  return (
    <Dialog open={isOpen} onClose={onClose}>
      <Dialog.Content
        className={`w-screen max-w-md bg-stone-950 !mt-24 pt-16 !pb-2 flex flex-col min-h-[560px] ${className || ''}`}
      >
        <Dialog.Header title="Join the Dozer Presale" onClose={onClose} className="pb-2" />

        {/* Price information */}
        <div className="mx-4 mb-2 p-1.5 bg-black/30 border border-yellow-500/20 rounded-md">
          <Typography variant="sm" className="flex justify-between text-neutral-300">
            <span>Current Price:</span>
            <span className="text-yellow-400">${priceToDisplay.toFixed(2)} USD</span>
          </Typography>
          <Typography variant="xs" className="text-neutral-400">
            1 DZD = 1 USD worth of DZR at TGE
          </Typography>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-yellow-500/20">
          <div className="flex items-center space-x-2">
            <div
              className={`flex items-center justify-center w-5 h-5 text-black rounded-full ${
                currentStep === 1 ? 'bg-yellow-500' : 'bg-gray-500'
              }`}
            >
              <span className="text-xs font-bold">1</span>
            </div>
            <Typography variant="sm" weight={600} className={currentStep === 1 ? 'text-yellow-500' : 'text-gray-500'}>
              Network
            </Typography>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className={`flex items-center justify-center w-5 h-5 text-black rounded-full ${
                currentStep === 2 ? 'bg-yellow-500' : 'bg-gray-500'
              }`}
            >
              <span className="text-xs font-bold">2</span>
            </div>
            <Typography variant="sm" weight={600} className={currentStep === 2 ? 'text-yellow-500' : 'text-gray-500'}>
              Payment
            </Typography>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className={`flex items-center justify-center w-5 h-5 text-black rounded-full ${
                currentStep === 3 ? 'bg-yellow-500' : 'bg-gray-500'
              }`}
            >
              <span className="text-xs font-bold">3</span>
            </div>
            <Typography variant="sm" weight={600} className={currentStep === 3 ? 'text-yellow-500' : 'text-gray-500'}>
              Proof
            </Typography>
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto">
          {/* Step 1: Network Selection */}
          {currentStep === 1 && (
            <div className="flex flex-col p-4">
              <Typography variant="lg" weight={600} className="mb-2 text-neutral-300">
                Choose a Network
              </Typography>
              <Typography variant="sm" className="mb-3 text-neutral-400">
                Select the blockchain network you want to use for your USDT payment.
              </Typography>

              {/* Network options */}
              <div className="flex flex-col mb-4 space-y-2">
                {networks.map((network) => (
                  <motion.div
                    key={network.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleNetworkSelect(network.id as 'solana' | 'evm')}
                    className={`relative flex items-center p-3 border rounded-lg cursor-pointer ${
                      selectedNetwork === network.id
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-stone-700 hover:border-stone-500'
                    }`}
                  >
                    <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 mr-3 text-xl rounded-full bg-stone-800">
                      {network.icon}
                    </div>
                    <div className="flex-1">
                      <Typography variant="base" weight={600} className="text-white">
                        {network.name}
                      </Typography>
                      <Typography variant="xs" className="text-neutral-400">
                        {network.description}
                      </Typography>
                    </div>
                    {selectedNetwork === network.id && (
                      <div className="absolute flex items-center justify-center w-5 h-5 text-black bg-yellow-500 rounded-full -top-1.5 -right-1.5">
                        <CheckIcon className="w-3 h-3" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Payment Information */}
          {currentStep === 2 && selectedNetwork && (
            <div className="flex flex-col p-4">
              <Typography variant="lg" weight={600} className="mb-2 text-neutral-300">
                Send {getSelectedNetworkInfo()?.tokenSymbol || 'USDT'}
              </Typography>

              <Typography variant="sm" className="mb-3 text-neutral-400">
                Scan the QR code or copy the address below to send your payment.
              </Typography>

              {/* Desktop: 2-column layout with QR, Mobile: 1-column layout without QR */}
              <div className="grid grid-cols-1 gap-4 mb-3 md:grid-cols-2">
                {/* QR Code - centered - hidden on mobile */}
                <div className="items-center justify-center hidden md:flex">
                  <div className="p-2 bg-white rounded-lg">
                    {getSelectedNetworkInfo() && (
                      <QRCodeSVG
                        value={getSelectedNetworkInfo()?.qrValue || ''}
                        size={120}
                        level="H"
                        includeMargin={false}
                      />
                    )}
                  </div>
                </div>

                {/* Address and Important Notes */}
                <div className="flex flex-col justify-center col-span-1 space-y-2 md:col-span-1">
                  <div className="p-2 border rounded-lg bg-black/40 border-yellow-500/20">
                    <Typography variant="xs" className="text-neutral-400">
                      {selectedNetwork.toUpperCase()} ADDRESS:
                    </Typography>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 break-all">
                        <Typography variant="sm" className="font-mono text-neutral-300">
                          {getSelectedNetworkInfo()?.address || ''}
                        </Typography>
                      </div>
                      <div className="flex-shrink-0">
                        <CopyHelper toCopy={getSelectedNetworkInfo()?.address || ''} />
                      </div>
                    </div>
                  </div>

                  <div className="p-2 border rounded-lg bg-yellow-500/10 border-yellow-500/30">
                    <Typography variant="xs" className="text-neutral-300">
                      • Min: 100 USDT ({Math.floor(100 / priceToDisplay)} DZD)
                      <br />• Max: 10,000 USDT ({Math.floor(10000 / priceToDisplay)} DZD)
                      <br />• DZD sent after confirmation
                    </Typography>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Transaction Proof and Contact Information */}
          {currentStep === 3 && !submissionSuccess && (
            <div className="flex flex-col p-4">
              <Typography variant="lg" weight={600} className="mb-2 text-neutral-300">
                Submit Transaction Proof
              </Typography>

              <Typography variant="sm" className="mb-3 text-neutral-400">
                Provide your transaction details and contact information to complete your purchase.
              </Typography>

              <div className="flex flex-col mb-3 space-y-3">
                {/* Transaction ID/URL Input */}
                <div>
                  <label className="block mb-1 text-xs text-neutral-400">Transaction ID or Explorer URL*</label>
                  <div className="flex items-center">
                    <div className="absolute pl-2">
                      <LinkIcon className="w-4 h-4 text-neutral-500" />
                    </div>
                    <Input.TextGeneric
                      id="transactionProof"
                      pattern=".*"
                      value={transactionProof}
                      onChange={setTransactionProof}
                      placeholder="Enter transaction ID or explorer URL"
                      className={`w-full pl-8 py-2 bg-transparent border ${
                        formErrors.transactionProof ? 'border-red-500' : 'border-stone-700'
                      } rounded-lg text-white text-sm focus:border-yellow-500 focus:outline-none`}
                    />
                  </div>
                  {formErrors.transactionProof && (
                    <p className="mt-1 text-xs text-red-500">Please enter a transaction ID or URL</p>
                  )}
                </div>

                {/* Hathor Address Input */}
                <div>
                  <label className="block mb-1 text-xs text-neutral-400">Hathor Wallet Address (to receive DZD)*</label>
                  <Input.TextGeneric
                    id="hathorAddress"
                    pattern=".*"
                    value={hathorAddress}
                    onChange={setHathorAddress}
                    placeholder="Enter your Hathor wallet address"
                    className={`w-full py-2 bg-transparent border ${
                      formErrors.hathorAddress ? 'border-red-500' : 'border-stone-700'
                    } rounded-lg text-white text-sm focus:border-yellow-500 focus:outline-none`}
                  />
                  {formErrors.hathorAddress && (
                    <p className="mt-1 text-xs text-red-500">Please enter your Hathor wallet address</p>
                  )}
                  <a
                    href="https://hathor.network/developers/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center mt-1 text-xs text-yellow-500 hover:text-yellow-400"
                  >
                    <span>Don't have a Hathor wallet? Download here</span>
                    <ArrowRightIcon className="w-3 h-3 ml-1" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Success Screen */}
          {submissionSuccess && (
            <div className="flex flex-col p-6">
              <div className="flex flex-col items-center justify-center mb-6 text-center">
                <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-green-500/20">
                  <CheckIcon className="w-8 h-8 text-green-500" />
                </div>
                <Typography variant="lg" weight={600} className="mb-2 text-green-500">
                  Submission Successful!
                </Typography>
                <Typography variant="base" className="mb-2 text-neutral-300">
                  {submissionMessage}
                </Typography>
              </div>

              {/* Optional Contact Info */}
              <div className="pt-4 mb-6 border-t border-stone-700">
                <Typography variant="base" weight={600} className="mb-3 text-neutral-300">
                  Would you like to add contact information? (Optional)
                </Typography>
                <label className="block mb-1 text-xs text-neutral-400">
                  Contact Info (Discord, Telegram, X, or Email)
                </label>
                <Input.TextGeneric
                  id="contactInfo"
                  pattern=".*"
                  value={contactInfo}
                  onChange={setContactInfo}
                  placeholder="Enter your contact information (optional)"
                  className="w-full py-2 text-sm text-white bg-transparent border rounded-lg border-stone-700 focus:border-yellow-500 focus:outline-none"
                />
                <Typography variant="xs" className="mt-2 text-neutral-400">
                  This helps us contact you if there are any issues with your transaction.
                </Typography>

                {/* Add button to save contact info */}
                {contactInfo.trim() && (
                  <Button
                    size="sm"
                    onClick={() => {
                      updateContactInfoMutation.mutate({
                        transactionProof,
                        contactInfo,
                      })
                    }}
                    disabled={updateContactInfoMutation.isLoading}
                    className="px-4 mt-3 text-yellow-500 bg-stone-800 hover:bg-stone-700"
                  >
                    {updateContactInfoMutation.isLoading ? 'Saving...' : 'Save Contact Info'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons - fixed at the bottom */}
        <div className="flex justify-between p-4 mt-auto border-t border-stone-800">
          {currentStep > 1 && !submissionSuccess ? (
            <Button
              size="lg"
              onClick={handleBack}
              className="px-6 bg-stone-800 text-neutral-300 hover:bg-stone-700"
              startIcon={<ArrowLeftIcon width={20} height={20} />}
              disabled={submitPresaleMutation.isLoading}
            >
              Back
            </Button>
          ) : (
            <div></div> // Empty div for spacing when there's no back button
          )}

          {submissionSuccess ? (
            <Button
              size="lg"
              onClick={handleDone}
              className="px-6 text-black bg-gradient-to-r from-green-500 to-green-600"
            >
              Done
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={currentStep < 3 ? handleContinue : handleSubmit}
              disabled={(currentStep === 1 && !selectedNetwork) || submitPresaleMutation.isLoading}
              className={`px-6 ${
                (currentStep === 1 && !selectedNetwork) || submitPresaleMutation.isLoading
                  ? 'bg-stone-800 text-stone-500'
                  : 'bg-gradient-to-r from-yellow-500 to-amber-600 text-black'
              }`}
              endIcon={currentStep < 3 ? <ChevronRightIcon width={20} height={20} /> : undefined}
            >
              {submitPresaleMutation.isLoading ? 'Submitting...' : currentStep < 3 ? 'Continue' : 'Submit'}
            </Button>
          )}
        </div>
      </Dialog.Content>
    </Dialog>
  )
}

export default PresaleModal
