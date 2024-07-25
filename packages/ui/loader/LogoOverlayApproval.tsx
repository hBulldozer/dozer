import { Transition } from '@headlessui/react'
import React, { FC, Fragment } from 'react'

import { LogoLoader } from './LogoLoader'
import { Typography } from '../typography'
import { Button } from '../button'
import { useRouter } from 'next/router'

export const LoadingOverlayApproval: FC<{ show?: boolean }> = ({ show }) => {
  const router = useRouter()
  return (
    <>
      <Transition
        as={Fragment}
        show={show}
        enter="ease-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed z-[9999] flex flex-col items-center justify-center inset-0 transition-opacity bg-white bg-opacity-5 backdrop-blur-sm rounded-xl overflow-hidden">
          <LogoLoader width={50} height={50} />
          <Typography variant="sm" className="text-center text-stone-300">
            {'Waiting for approval. Go to your wallet and confirm the connection or transaction.'}
          </Typography>
          <Button
            variant="outlined"
            size="sm"
            className="mt-3"
            onClick={() => {
              router.reload()
            }}
          >
            Refresh
          </Button>
        </div>
      </Transition>
    </>
  )
}
