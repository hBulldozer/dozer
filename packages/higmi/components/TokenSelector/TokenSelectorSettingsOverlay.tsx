import { CogIcon } from '@heroicons/react/24/outline'
import { IconButton, Overlay, SlideIn } from '@dozer/ui'
import React, { FC, useState } from 'react'

import { TokenSelectorProps } from './TokenSelector'
// import { TokenSelectorCustomTokensOverlay } from './TokenSelectorCustomTokensOverlay'

type TokenSelectorSettingsOverlayProps = TokenSelectorProps

const TokenSelectorSettingsOverlay: FC<TokenSelectorSettingsOverlayProps> = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <IconButton
        className="hover:animate-spin-slow w-[24px] h-[24px] flex items-center justify-center"
        onClick={() => {
          setOpen(true)
        }}
      >
        <CogIcon width={20} height={20} className="hover:text-stone-50 text-stone-100" />
      </IconButton>
      <SlideIn.FromLeft show={open} onClose={() => setOpen(false)}>
        <Overlay.Content className="!bg-stone-800">
          <Overlay.Header onClose={() => setOpen(false)} title="Settings" />
          {/* <div className="px-1 py-1">
            <TokenSelectorCustomTokensOverlay customTokenMap={customTokenMap} onRemoveToken={onRemoveToken} />
          </div> */}
        </Overlay.Content>
      </SlideIn.FromLeft>
    </>
  )
}
