import { App, AppType, Button, Link, Menu } from '@dozer/ui'
import React, { FC, useState } from 'react'
import PresaleModal from '../components/PresaleModal/PresaleModal'

export const Header: FC = () => {
  const [isPresaleModalOpen, setIsPresaleModalOpen] = useState<boolean>(false)

  return (
    <App.Header hide withScrollBackground={true} appType={AppType.Root} maxWidth="5xl" bgColor="bg-black">
      <div className="flex items-center gap-2">
        <Button
          onClick={() => setIsPresaleModalOpen(true)}
          size="sm"
          className="ml-2 whitespace-nowrap bg-gradient-to-r from-yellow-500 to-amber-600 text-black"
        >
          Join Now
        </Button>
      </div>

      {/* Presale Modal */}
      <PresaleModal isOpen={isPresaleModalOpen} onClose={() => setIsPresaleModalOpen(false)} className="max-w-2xl" />
    </App.Header>
  )
}
