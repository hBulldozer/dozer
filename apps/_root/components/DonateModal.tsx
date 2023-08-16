import { App, AppType, Button, CopyHelper, Dialog, IconButton, Link, Menu, Typography } from '@dozer/ui'
import React, { FC } from 'react'
import qrcode from '../public/qrcode.jpeg'
import Image from 'next/image'
import { DuplicateIcon } from '@heroicons/react/solid'

interface DonateModalInterface {
  open: boolean
  setOpen(open: boolean): void
}
export const DonateModal: FC<DonateModalInterface> = ({ open, setOpen }) => {
  const address = 'HUnmVsAN4tC6geCNe54KniPNbbwkV6kC1e'
  return (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <Dialog.Content className="max-w-sm !pb-4">
        <Dialog.Header border={true} title="Support Dozer development" onClose={() => setOpen(false)} />
        <div className="grid grid-cols-12 items-center">
          <div className="relative flex flex-col col-span-12 my-4 gap-1 p-2 border sm:p-4 rounded-2xl bg-stone-700/40 border-stone-200/5">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-between w-full gap-2">
                <Image className="rounded-2xl" alt="qrcode" src={qrcode} />
              </div>
            </div>
          </div>
          <div className="relative flex flex-col col-span-12 gap-1 p-3 mt-3 border sm:p-4 rounded-2xl bg-yellow-400 border-yellow-400">
            <CopyHelper toCopy={address}>
              {(isCopied) => (
                <IconButton className="p-1" altColor description={isCopied ? 'Copied!' : 'Copy'}>
                  <div className="grid items-center grid-cols-10 gap-1">
                    <DuplicateIcon width={25} height={25} color="black" />
                    <Typography className="col-span-2 md:text-sm text-xs text-black">{address}</Typography>
                  </div>
                </IconButton>
              )}
            </CopyHelper>
          </div>
        </div>
        <Typography className="items-center mt-3  text-center">Buy us a coffee, a dozer, or a lambo.</Typography>
      </Dialog.Content>
    </Dialog>
  )
}
