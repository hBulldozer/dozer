import { Disclosure, Transition } from '@headlessui/react'
import { App, AppType, Button, CopyHelper, Dialog, IconButton, Link, Menu, Tab, Typography } from '..'
import React, { FC, useState } from 'react'
import qrcode from './qrcode.png'
import qrcode_eth from './qrcode_eth.png'
import Image from 'next/image'
import { Square2StackIcon } from '@heroicons/react/24/solid'

export interface DonateModalInterface {
  open: boolean
  setOpen(open: boolean): void
}
export const DonateModal: FC<DonateModalInterface> = ({ open, setOpen }) => {
  const address = 'HFAbxweRfZDCJy56KULwBUWttoWgGuhXeT'
  const address_eth = '0xd4252011f8197FaD96f11Ca04D13b70806f05060'
  const [network, setNetwork] = useState<number>(0)
  return (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <Dialog.Content className="max-w-sm !pb-4">
        <Dialog.Header border={true} title="Support Dozer development" onClose={() => setOpen(false)} />
        <Transition
          unmount={false}
          className="transition-[max-height] overflow-hidden mb-3"
          enter="duration-300 ease-in-out"
          enterFrom="transform max-h-0"
          enterTo="transform max-h-[380px]"
          leave="transition-[max-height] duration-250 ease-in-out"
          leaveFrom="transform max-h-[380px]"
          leaveTo="transform max-h-0"
        >
          <Typography className="items-center mt-2 mb-2 text-center">Select a network</Typography>
          <Tab.Group selectedIndex={network} onChange={setNetwork}>
            <Tab.List>
              <Tab>Hathor</Tab>
              <Tab>EVM</Tab>
            </Tab.List>
            <Tab.Panels>
              <Tab.Panel>
                <div className="grid items-center grid-cols-12">
                  <div className="relative flex flex-col col-span-12 gap-1 p-2 my-4 border sm:p-4 rounded-2xl bg-stone-700/40 border-stone-200/5">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-between w-full gap-2">
                        <Image className="rounded-2xl" alt="qrcode" src={qrcode} />
                      </div>
                    </div>
                  </div>
                  <div className="relative flex flex-col col-span-12 gap-1 p-3 mt-3 bg-yellow-400 border border-yellow-400 sm:p-4 rounded-2xl">
                    <CopyHelper toCopy={address}>
                      {(isCopied) => (
                        <IconButton className="p-1" altColor description={isCopied ? 'Copied!' : 'Copy'}>
                          <div className="grid items-center grid-cols-10 gap-1">
                            <Square2StackIcon width={25} height={25} color="black" />
                            <Typography className="col-span-2 text-xs text-black md:text-sm">{address}</Typography>
                          </div>
                        </IconButton>
                      )}
                    </CopyHelper>
                  </div>
                </div>
              </Tab.Panel>
              <Tab.Panel>
                <div className="grid items-center grid-cols-12">
                  <div className="relative flex flex-col col-span-12 gap-1 p-2 my-4 border sm:p-4 rounded-2xl bg-stone-700/40 border-stone-200/5">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-between w-full gap-2">
                        <Image className="rounded-2xl" alt="qrcode_eth" src={qrcode_eth} />
                      </div>
                    </div>
                  </div>
                  <div className="relative flex flex-col col-span-12 gap-1 p-3 mt-3 bg-yellow-400 border border-yellow-400 sm:p-4 rounded-2xl">
                    <CopyHelper toCopy={address}>
                      {(isCopied) => (
                        <IconButton className="p-1" altColor description={isCopied ? 'Copied!' : 'Copy'}>
                          <div className="grid items-center grid-cols-10 gap-1">
                            <Square2StackIcon width={25} height={25} color="black" />
                            <Typography className="col-span-2 text-xs text-black md:text-xs">{address_eth}</Typography>
                          </div>
                        </IconButton>
                      )}
                    </CopyHelper>
                  </div>
                </div>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </Transition>
        <Typography className="items-center mt-3 text-center">Buy us a coffee, a dozer, or a lambo.</Typography>
      </Dialog.Content>
    </Dialog>
  )
}
