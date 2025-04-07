import { App, AppType, Button, Link, Menu } from '@dozer/ui'
import React, { FC, useState, useEffect } from 'react'
import PresaleModal from '../components/PresaleModal/PresaleModal'
import { calculatePresalePrice } from '../utils/presalePrice'

export const Header: FC = () => {
  const [isPresaleModalOpen, setIsPresaleModalOpen] = useState<boolean>(false)
  const [isPresaleActive, setIsPresaleActive] = useState<boolean>(true)

  // Check if presale is active on mount and when modal is opened/closed
  useEffect(() => {
    const { isPresaleActive } = calculatePresalePrice()
    setIsPresaleActive(isPresaleActive)

    // Update status every minute
    const timer = setInterval(() => {
      const { isPresaleActive } = calculatePresalePrice()
      setIsPresaleActive(isPresaleActive)
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  return (
    <App.Header hide withScrollBackground={true} appType={AppType.Root} maxWidth="5xl" bgColor="bg-black">
      <div className="flex items-center gap-2">
        <Button
          onClick={() => setIsPresaleModalOpen(true)}
          size="sm"
          disabled={!isPresaleActive}
          className={`ml-2 whitespace-nowrap ${
            isPresaleActive
              ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-black'
              : 'bg-gray-800 text-gray-400 border border-gray-700 shadow-inner hover:bg-gray-700'
          }`}
        >
          {isPresaleActive ? 'Join Now' : 'Presale Ended'}
        </Button>
      </div>

      {/* Presale Modal */}
      <PresaleModal
        isOpen={isPresaleModalOpen}
        onClose={() => setIsPresaleModalOpen(false)}
        className="max-w-2xl"
        isPresaleActive={isPresaleActive}
      />
    </App.Header>
  )
}
