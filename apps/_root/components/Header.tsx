import { App, AppType, Button, Link, Menu } from '@dozer/ui'
import { BorderButton } from '@dozer/ui/aceternity/moving-border'
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
        <BorderButton
          as="a"
          href="https://t.me/dozerfinance"
          target="_blank"
          rel="noopener noreferrer"
          duration={4000}
          borderRadius="0.75rem"
          containerClassName="ml-4 h-auto w-auto p-[2px]"
          className="bg-yellow-400 !text-black text-sm px-4 py-2 font-semibold hover:bg-yellow-300 !border-0"
          borderClassName="h-24 w-24 opacity-90 bg-[radial-gradient(#FCD34D_30%,#FBBF24_50%,transparent_70%)]"
        >
          Join now
        </BorderButton>
      </div>
      {/* <DonateModal open={open} setOpen={setOpen} /> */}
    </App.Header>
  )
}
