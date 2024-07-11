import { CogIcon } from '@heroicons/react/24/outline'
import { ChainId } from '@dozer/chain'
import { classNames, IconButton, Overlay, SlideIn } from '@dozer/ui'
import { useSettings } from '@dozer/zustand'
import { FC, useState } from 'react'

// import { CarbonOffsetOverlay } from './CarbonOffsetOverlay'
// import { CustomTokensOverlay } from './CustomTokensOverlay'
// import { ExpertMode } from './ExpertMode'
import { SlippageToleranceDisclosure } from './SlippageToleranceDisclosure'

interface SettingsOverlay {
  chainId: ChainId | undefined
}

export const SettingsOverlay: FC<SettingsOverlay> = ({ chainId }) => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <div className="grid grid-flow-col gap-4">
        <IconButton className="flex items-center hover:animate-spin-slow min-w-5 min-h-5" onClick={() => setOpen(true)}>
          <CogIcon width={20} height={20} />
        </IconButton>
      </div>
      <SlideIn>
        <SlideIn.FromLeft show={open} onClose={() => setOpen(false)}>
          <Overlay.Content className="!bg-stone-800 !pb-0">
            <div className="h-full px-3 -ml-3 -mr-3 overflow-x-hidden overflow-y-auto scroll">
              <Overlay.Header onClose={() => setOpen(false)} title="Settings" />
              <div className="px-1 py-1">
                <SlippageToleranceDisclosure />
              </div>
            </div>
          </Overlay.Content>
        </SlideIn.FromLeft>
      </SlideIn>
    </>
  )
}
