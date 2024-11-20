import { App, AppType, Button, Link, Menu } from '@dozer/ui'
import React, { FC, useEffect, useState } from 'react'
// import { DonateModal } from './DonateModal'
export const Header: FC = () => {
  // const [open, setOpen] = useState(false)

  // useEffect(() => {
  //   const handleScroll = () => {
  //     const windowHeight = window.innerHeight
  //     const scrollY = window.scrollY || window.pageYOffset
  //     const documentHeight = document.documentElement.scrollHeight

  //     if (windowHeight + scrollY >= documentHeight) {
  //       // User has reached the end of the page
  //       setTimeout(() => {
  //         setOpen(true) // Show modal after 30 seconds
  //       }, 10000) // 30 seconds in milliseconds
  //     }
  //   }

  //   window.addEventListener('scroll', handleScroll)

  //   return () => {
  //     window.removeEventListener('scroll', handleScroll)
  //   }
  // }, [])
  return (
    <App.Header hide withScrollBackground={true} appType={AppType.Root} maxWidth="5xl" bgColor="bg-black">
      <div className="flex items-center gap-2">
        {/* <Link.Internal href="/swap" passHref={true}>
          <Button  as="a" size="sm" className="ml-4 whitespace-nowrap">
            Enter App
          </Button>
        </Link.Internal> */}
        <Button as="a" href="https://testnet.dozer.finance/swap" size="sm" className="ml-4 whitespace-nowrap">
          Join Now
        </Button>
      </div>
      {/* <DonateModal open={open} setOpen={setOpen} /> */}
    </App.Header>
  )
}
