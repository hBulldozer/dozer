import { Listbox, Transition } from '@headlessui/react'
import { ChevronDownIcon, ExternalLinkIcon } from '@heroicons/react/outline'
import useScrollPosition from '@react-hook/window-scroll'
import { useBreakpoint, useIsMounted } from '@dozer/hooks'
import Image from 'next/legacy/image'
import React, { Fragment } from 'react'

import { classNames, Container, IconButton, Link, MaxWidth, Select, DozerIcon, Typography } from '..'

export enum AppType {
  Root = 'Explore Apps',
  Swap = 'Swap',
  Invest = 'Earn',
  Blog = 'Blog',
}

const LINK = {
  [AppType.Root]: '/',
  [AppType.Swap]: '/swap',
  [AppType.Invest]: '/earn',
  [AppType.Blog]: '/blog',
}

export interface HeaderProps extends React.HTMLProps<HTMLElement> {
  nav?: JSX.Element
  withScrollBackground?: boolean
  appType: AppType
  maxWidth?: MaxWidth
  bgColor?: string
}

export function Header({
  children,
  appType,
  className,
  nav,
  withScrollBackground = false,
  bgColor = 'bg-slate-900',
  maxWidth = 'full',
  ...props
}: HeaderProps): JSX.Element {
  const isMounted = useIsMounted()
  const scrollY = useScrollPosition()

  const { isMd } = useBreakpoint('md')

  // Show when:
  // 1. We scroll down for 45px
  // 2. When body has a negative top set for body lock for Dialogs on small screens
  const showBackground =
    (scrollY > 45 && withScrollBackground && isMounted) ||
    (typeof window !== 'undefined' && !isMd
      ? Number(document.body.style.top.slice(0, -2)) < 0 && withScrollBackground
      : false)

  return (
    <header
      className={classNames('sticky mt-0 flex items-center left-0 right-0 top-0 w-full z-[1070] h-[54px]', className)}
      {...props}
    >
      <Transition
        as={Fragment}
        show={showBackground || !withScrollBackground}
        enter="transform transition ease-in-out duration-100"
        enterFrom="translate-y-[-100%]"
        enterTo="translate-y-0"
        leave="transform transition ease-in-out duration-200"
        leaveFrom="translate-y-0"
        leaveTo="translate-y-[-100%]"
      >
        <div className={classNames(bgColor, 'absolute inset-0 border-b pointer-events-none border-slate-200/10')} />
      </Transition>
      <Container
        maxWidth={maxWidth}
        className={classNames('grid grid-cols-3 items-center w-full mx-auto z-[101] px-4 row-full')}
      >
        <div className="flex items-center flex-grow gap-3">
          <a className="flex flex-row items-center gap-1.5" href="/">
            <div className="w-7 h-7">
              <DozerIcon width="100%" height="100%" className="mr-2 hover:animate-heartbeat" />
            </div>
          </a>
          <div className="bg-slate-200/10 w-0.5 h-[20px]" />
          <Select
            button={
              <Listbox.Button
                type="button"
                className="flex items-center gap-2 font-semibold hover:text-slate-200 text-slate-300"
              >
                <span className="hidden text-sm truncate sm:block">{AppType.Root}</span>
                <IconButton as="div" className="p-1">
                  <ChevronDownIcon className="w-4 h-4" aria-hidden="true" />
                </IconButton>
              </Listbox.Button>
            }
          >
            <Select.Options className="w-[max-content] !bg-slate-700 -ml-5 mt-5 !max-h-[unset]">
              <div className="grid grid-cols-1 gap-1 px-2 py-2 md:grid-cols-3">
                <div>
                  <Typography variant="xs" weight={600} className="hidden px-2 mb-1 uppercase md:block text-slate-400">
                    Core
                  </Typography>
                  <Select.Option
                    as="a"
                    href="https://dozer.finance/swap"
                    key={AppType.Swap}
                    value={AppType.Swap}
                    className="!border-slate-700 !cursor-pointer px-2 flex flex-col gap-0 !items-start group"
                  >
                    {AppType.Swap}
                    <Typography variant="xs" className="text-slate-400 group-hover:text-blue-100">
                      The easiest way to trade
                    </Typography>
                  </Select.Option>
                  <Select.Option
                    as="a"
                    href="https://dozer.finance/earn"
                    key={AppType.Invest}
                    value={AppType.Invest}
                    className="!border-slate-700 !cursor-pointer px-2 flex flex-col gap-0 !items-start group"
                  >
                    {AppType.Invest}
                    <Typography variant="xs" className="text-slate-400 group-hover:text-blue-100">
                      Earn fees by providing liquidity
                    </Typography>
                  </Select.Option>
                </div>
                <div>
                  <Typography variant="xs" weight={600} className="hidden px-2 mb-1 uppercase md:block text-slate-400">
                    Products
                  </Typography>
                </div>
                <div>
                  <Typography variant="xs" weight={600} className="hidden px-2 mb-1 uppercase md:block text-slate-400">
                    Links
                  </Typography>
                  <Select.Option
                    as="a"
                    href="https://dozer.finance/blog"
                    key={AppType.Blog}
                    value={AppType.Blog}
                    className="!border-slate-700 !cursor-pointer px-2 flex flex-col gap-0 !items-start group"
                  >
                    {AppType.Blog}
                    <Typography variant="xs" className="text-slate-400 group-hover:text-blue-100">
                      Stay up to date with Dozer
                    </Typography>
                  </Select.Option>
                </div>
              </div>
            </Select.Options>
          </Select>
        </div>
        <div className="flex justify-center flex-grow">{nav}</div>
        <div className="flex justify-end flex-grow">{children}</div>
      </Container>
    </header>
  )
}

export default Header
