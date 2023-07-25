import { App, AppType, Button, Link, Menu } from '@dozer/ui'
import React, { FC, useState } from 'react'
import { DonateModal } from './DonateModal'
export const Header: FC = () => {
  const [open, setOpen] = useState(false)
  return (
    <App.Header hide withScrollBackground={true} appType={AppType.Root} maxWidth="5xl" bgColor="bg-black">
      <div className="flex items-center gap-2">
        {/* <Link.Internal href="/swap" passHref={true}>
          <Button  as="a" size="sm" className="ml-4 whitespace-nowrap">
            Enter App
          </Button>
        </Link.Internal> */}
        <Button as="a" onClick={() => setOpen(true)} size="sm" className="ml-4 whitespace-nowrap">
          Donate
        </Button>
      </div>
      <DonateModal open={open} setOpen={setOpen} />
    </App.Header>
  )
}
