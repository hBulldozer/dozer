import { Listbox, Transition } from '@headlessui/react'
import { ChevronDownIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import useScrollPosition from '@react-hook/window-scroll'
import { useBreakpoint, useIsMounted } from '@dozer/hooks'
import React, { Fragment, useState } from 'react'

import {
  classNames,
  Container,
  IconButton,
  Link,
  MaxWidth,
  Select,
  DozerIcon,
  DozerWithTextIcon,
  Typography,
  App,
  OzerText,
} from '..'
import { isFeatureEnabled } from '../config/features'

export enum AppType {
  Root = 'Explore',
  Swap = 'Swap',
  Invest = 'Pools',
  Oasis = 'Oasis',
  Blog = 'Blog',
  Tokens = 'Tokens',
}

const LINK = {
  [AppType.Root]: '/',
  [AppType.Swap]: '/swap',
  [AppType.Invest]: '/pool',
  [AppType.Tokens]: '/swap/tokens',
  [AppType.Oasis]: '/pool/oasis',
}

export interface HeaderProps extends React.HTMLProps<HTMLElement> {
  nav?: JSX.Element
  withScrollBackground?: boolean
  appType: AppType
  maxWidth?: MaxWidth
  bgColor?: string
  hide?: boolean
}

export function Header({
  children,
  appType,
  className,
  nav,
  hide = false,
  withScrollBackground = false,
  bgColor = 'bg-stone-900',
  maxWidth = 'full',
  ...props
}: HeaderProps): JSX.Element {
  const isMounted = useIsMounted()
  const scrollY = useScrollPosition()
  const [open, setOpen] = useState<boolean>(false)

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
      className={classNames('flex sticky top-0 right-0 left-0 items-center mt-0 w-full z-[1070] h-[54px]', className)}
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
        <div className={classNames(bgColor, 'absolute inset-0 border-b pointer-events-none border-stone-200/10')} />
      </Transition>
      <Container
        maxWidth={maxWidth}
        className={classNames('grid grid-cols-3 items-center px-4 mx-auto w-full z-[101] row-full')}
      >
        <div className="flex flex-grow gap-3 items-center">
          {withScrollBackground ? (
            <a className="flex flex-row items-center gap-1.5" href="/">
              <div
                className={classNames(
                  'overflow-hidden relative transition-all duration-300 ease-in-out',
                  !showBackground ? 'h-9 w-[120px]' : 'w-9 h-9'
                )}
              >
                <div
                  className={classNames(
                    'absolute -inset-0.5 transition-transform duration-300 ease-in-out',
                    showBackground ? '-translate-x-[100px]' : 'translate-x-0'
                  )}
                >
                  <OzerText width="100%" height="36" className="absolute top-0 left-0" />
                </div>
                <div className="absolute inset-0 z-10 pointer-events-none">
                  <div className="relative w-9 h-9">
                    <div className="absolute inset-0 pr-1 bg-clip-content bg-black"></div>
                    <DozerIcon width="36" height="36" className="relative z-20" />
                  </div>
                </div>
              </div>
            </a>
          ) : (
            <a className="flex flex-row items-center gap-1.5" href="/">
              <div className="hidden w-9 h-9 md:block hover:animate-heartbeat">
                <DozerIcon width="100%" height="100%" className="mr-2" />
              </div>
              <div className="w-24 md:hidden">
                <DozerWithTextIcon width="100%" height="100%" />
              </div>
            </a>
          )}
          <div className="bg-stone-200/10 w-0.5 h-[20px]" />
          {!hide ? (
            <Select
              button={
                <Listbox.Button
                  type="button"
                  className="flex gap-2 items-center font-semibold hover:text-stone-200 text-stone-300"
                >
                  <span className="hidden text-sm truncate sm:block">{AppType.Root}</span>
                  <IconButton as="div" className="p-1">
                    <ChevronDownIcon className="w-4 h-4" aria-hidden="true" />
                  </IconButton>
                </Listbox.Button>
              }
            >
              <Select.Options className=" !bg-stone-700 -ml-5 mt-5 !max-h-[unset]">
                <div className="grid grid-cols-1 gap-1 px-2 py-2 md:grid-cols-2">
                  <div>
                    <Typography
                      variant="xs"
                      weight={600}
                      className="hidden px-2 mb-1 uppercase md:block text-stone-400"
                    >
                      Core
                    </Typography>
                    <Select.Option
                      as="a"
                      href="/swap"
                      key={AppType.Swap}
                      value={AppType.Swap}
                      className="!border-stone-700 !cursor-pointer px-2 flex flex-col gap-0 !items-start group"
                    >
                      {AppType.Swap}
                      <Typography variant="xs" className="text-stone-400 group-hover:text-yellow-100">
                        The easiest way to trade
                      </Typography>
                    </Select.Option>
                    <Select.Option
                      as="a"
                      href="/swap/tokens"
                      key={AppType.Tokens}
                      value={AppType.Tokens}
                      className="!border-stone-700 !cursor-pointer px-2 flex flex-col gap-0 !items-start group"
                    >
                      {AppType.Tokens}
                      <Typography variant="xs" className="text-stone-400 group-hover:text-yellow-100">
                        Top tokens on Dozer
                      </Typography>
                    </Select.Option>

                    <Select.Option
                      as="a"
                      href="/pool"
                      key={AppType.Invest}
                      value={AppType.Invest}
                      className="!border-stone-700 !cursor-pointer px-2 flex flex-col gap-0 !items-start group"
                    >
                      {AppType.Invest}
                      <Typography variant="xs" className="text-stone-400 group-hover:text-yellow-100">
                        Earn fees by providing liquidity
                      </Typography>
                    </Select.Option>

                    {/* Oasis feature is currently hidden via feature flag */}
                    {isFeatureEnabled('OASIS_ENABLED') && (
                      <Select.Option
                        as="a"
                        href="/pool/oasis"
                        key={AppType.Oasis}
                        value={AppType.Oasis}
                        className="!border-stone-700 !cursor-pointer px-2 flex flex-col gap-0 !items-start group"
                      >
                        <div className=" bg-clip-text text-transparent bg-gradient-to-br from-amber-400 via-amber-100 to-yellow-500 !hover:text-transparent">
                          Oasis
                        </div>
                        <Typography variant="xs" className="text-stone-400 group-hover:text-yellow-100">
                          The liquidity incentive program
                        </Typography>
                      </Select.Option>
                    )}
                  </div>
                  {/* <div>
                    <Typography
                      variant="xs"
                      weight={600}
                      className="hidden px-2 mb-1 uppercase md:block text-stone-400"
                    >
                      Products
                    </Typography>
                  </div> */}
                  <div>
                    <Typography
                      variant="xs"
                      weight={600}
                      className="hidden px-2 mb-1 uppercase md:block text-stone-400"
                    >
                      Links
                    </Typography>
                    <Select.Option
                      as="a"
                      href="https://t.me/hathor_solana_bot"
                      target="_blank"
                      rel="noopener noreferrer"
                      key={AppType.Blog}
                      value={AppType.Blog}
                      className="!border-stone-700 !cursor-pointer px-2 flex flex-col gap-0 !items-start group"
                    >
                      Get HTR
                      <Typography variant="xs" className="text-stone-400 group-hover:text-yellow-100">
                        No-KYC on-ramp option
                      </Typography>
                    </Select.Option>
                    {/* <Select.Option
                      as="a"
                      href="https://mvp.dozer.finance/blog"
                      key={AppType.Blog}
                      value={AppType.Blog}
                      className="!border-stone-700 !cursor-pointer px-2 flex flex-col gap-0 !items-start group"
                    >
                      {AppType.Blog}
                      <Typography variant="xs" className="text-stone-400 group-hover:text-yellow-100">
                        Stay up to date with Dozer
                      </Typography>
                    </Select.Option> */}
                    <Select.Option
                      as="a"
                      href="https://www.x.com/DozerProtocol"
                      target="_blank"
                      rel="noopener noreferrer"
                      key="Check our Tweets"
                      value="Check our Tweets"
                      className="!border-stone-700 !cursor-pointer pl-2 pr-12 flex flex-col gap-0 !items-start group"
                    >
                      Twitter
                      <Typography variant="xs" className="text-stone-400 group-hover:text-yellow-100">
                        Stay up to date with Dozer
                      </Typography>
                    </Select.Option>
                    {/* <Select.Option
                      as="a"
                      href="https://www.t.me/h_bulldozer"
                      key="Contact us!"
                      value="Contact us!"
                      className="!border-stone-700 !cursor-pointer pl-2 pr-12 flex flex-col gap-0 !items-start group"
                    >
                      Contact us!
                      <Typography variant="xs" className="text-stone-400 group-hover:text-yellow-100">
                        DM us!
                      </Typography>
                    </Select.Option> */}
                    <Select.Option
                      as="a"
                      href="https://docs.dozer.finance"
                      target="_blank"
                      rel="noopener noreferrer"
                      key="Check our Docs"
                      value="Check our Docs"
                      className="!border-stone-700 !cursor-pointer pl-2 pr-12 flex flex-col gap-0 !items-start group"
                    >
                      Documentation
                      <Typography variant="xs" className="text-stone-400 group-hover:text-yellow-100">
                        Read our Early Documentation
                      </Typography>
                    </Select.Option>{' '}
                    {/* <Select.Option
                      as="a"
                      // href="https://www.docs.dozer.finance"
                      key="Donate"
                      value="Donate"
                      className="!border-stone-700 !cursor-pointer pl-2 pr-12 flex flex-col gap-0 !items-start group"
                    >
                      <a
                        onClick={() => {
                          setOpen(true)
                        }}
                      >
                        <App.DonateModal open={open && !hide} setOpen={setOpen} />
                        Donate
                        <Typography variant="xs" className="text-stone-400 group-hover:text-yellow-100">
                          Support us
                        </Typography>
                      </a>
                    </Select.Option>{' '} */}
                  </div>
                </div>
              </Select.Options>
            </Select>
          ) : (
            <></>
          )}
        </div>
        <div className="flex flex-grow justify-center">{nav}</div>
        <div className="flex flex-grow justify-end">{children}</div>
      </Container>
    </header>
  )
}
