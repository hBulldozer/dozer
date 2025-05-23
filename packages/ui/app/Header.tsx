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

export enum AppType {
  Root = 'Explore',
  Swap = 'Swap',
  Invest = 'Pools',
  Blog = 'Blog',
  Tokens = 'Tokens',
}

const LINK = {
  [AppType.Root]: '/',
  [AppType.Swap]: '/swap',
  [AppType.Invest]: '/pool',
  [AppType.Tokens]: '/swap/tokens',
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
    <>
      <div className="w-full bg-yellow-500 text-stone-900 z-[9999] sticky top-0">
        <Container maxWidth="full" className="flex items-center justify-center h-12 px-4">
          <div className="w-full text-center">
            <a
              href="https://testnet.dozer.finance/swap"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 font-semibold transition-opacity text-md hover:opacity-80"
            >
              <span>TESTNET IS LIVE! 🚀 Experience the future of DeFi on Dozer.</span>
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            </a>
          </div>
        </Container>
      </div>

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
          <div className={classNames(bgColor, 'absolute inset-0 border-b pointer-events-none border-stone-200/10')} />
        </Transition>
        <Container
          maxWidth={maxWidth}
          className={classNames('grid grid-cols-3 items-center w-full mx-auto z-[101] px-4 row-full')}
        >
          <div className="flex items-center flex-grow gap-3">
            {withScrollBackground ? (
              <a className="flex flex-row items-center gap-1.5" href="/">
                <div
                  className={classNames(
                    'relative overflow-hidden transition-all duration-300 ease-in-out',
                    !showBackground ? 'w-[120px] h-9' : 'w-9 h-9'
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
                      <div className="absolute inset-0 pr-1 bg-black bg-clip-content"></div>
                      <DozerIcon width="36" height="36" className="relative z-20" />
                    </div>
                  </div>
                </div>
              </a>
            ) : (
              <a className="flex flex-row items-center gap-1.5" href="/">
                <div className="hidden md:block w-9 h-9 hover:animate-heartbeat">
                  <DozerIcon width="100%" height="100%" className="mr-2 " />
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
                    className="flex items-center gap-2 font-semibold hover:text-stone-200 text-stone-300"
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
                        href="https://forms.gle/8cEKvsaNrTP4c8Ef6"
                        target="_blank"
                        rel="noopener noreferrer"
                        key={AppType.Blog}
                        value={AppType.Blog}
                        className="!border-stone-700 !cursor-pointer px-2 flex flex-col gap-0 !items-start group"
                      >
                        <div className=" bg-clip-text text-transparent bg-gradient-to-br from-amber-400 via-amber-100 to-yellow-500 !hover:text-transparent">
                          Presale
                        </div>
                        <Typography variant="xs" className="text-stone-400 group-hover:text-yellow-100">
                          Don't be late anon!
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
          <div className="flex justify-center flex-grow">{nav}</div>
          <div className="flex justify-end flex-grow">{children}</div>
        </Container>
      </header>
    </>
  )
}
