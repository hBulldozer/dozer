import { App, AppType, Button, CopyHelper, Dialog, IconButton, Link, Menu, Typography } from '@dozer/ui'
import React, { FC } from 'react'
import qrcode from './qrcode.jpeg'
import Image from 'next/image'
import { DuplicateIcon } from '@heroicons/react/solid'

interface DonateModalInterface {
  open: boolean
  setOpen(open: boolean): void
}
export const DonateModal: FC<DonateModalInterface> = ({ open, setOpen }) => {
  const address = 'H7hwed6NR6fLQN1Sh7P7ddC5BmoDLu9kkh'
  return (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <Dialog.Content className="max-w-sm !pb-4">
        <Dialog.Header border={false} title="Help the build of Dozer" onClose={() => setOpen(false)} />
        <div className="!my-0 grid grid-cols-12 items-center">
          <div className="relative flex flex-col col-span-12 gap-1 p-2 border sm:p-4 rounded-2xl bg-stone-700/40 border-stone-200/5">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-between w-full gap-2">
                <Image className="rounded-2xl" alt="qrcode" src={qrcode} />
              </div>
            </div>
          </div>
          <div className="relative flex flex-col col-span-12 gap-1 p-2 mt-3 border sm:p-4 rounded-2xl bg-stone-300/40 border-stone-100/5">
            <div className="grid items-center grid-cols-10 gap-1">
              <CopyHelper toCopy={address} hideIcon>
                {(isCopied) => (
                  <IconButton className="p-0.5" description={isCopied ? 'Copied!' : 'Copy'}>
                    <DuplicateIcon width={25} height={25} color="yellow" />
                  </IconButton>
                )}
              </CopyHelper>
              <Typography className="col-span-2 text-sm">{address}</Typography>
            </div>
          </div>
        </div>
        <Typography className="items-center mt-3 text-sm text-center">Buy as a coffee, a dozer, or a lambo.</Typography>
      </Dialog.Content>
    </Dialog>
  )
}
