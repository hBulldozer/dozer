import { useCallback } from 'react'

import { Container, DiscordIcon, GithubIcon, InstagramIcon, Link, DozerWithTextIcon, TwitterIcon, Typography } from '..'
import { TelegramIcon } from '../icons/TelegramIcon'

export type FooterProps = React.HTMLProps<HTMLDivElement>

const config: Record<
  string,
  | Record<string, { href: string; rel?: string; target?: string }>
  | Array<Record<string, Record<string, { href: string; rel?: string; target?: string }>>>
> = {
  Features: {
    Swap: {
      href: 'https://5years.dozer.finance/swap',
      target: '_blank',
      rel: 'noopener noreferrer',
    },
    Earn: {
      href: 'https://5years.dozer.finance/pool',
      target: '_blank',
      rel: 'noopener noreferrer',
    },
    Launch: {
      href: 'https://5years.dozer.finance/pool/create_token',
      target: '_blank',
      rel: 'noopener noreferrer',
    },
    // Borrowing: {
    //   href: 'https://mvp.dozer.finance',
    //   target: '_blank',
    //   rel: 'noopener noreferrer',
    // },
  },
  Help: {
    // 'About Us': {
    //   href: 'https://mvp.dozer.finance',
    //   target: '_blank',
    //   rel: 'noopener noreferrer',
    // },
    Docs: {
      href: 'https://docs.dozer.finance',
      target: '_blank',
      rel: 'noopener noreferrer',
    },
    // 'Discord Support': {
    //   href: 'https://discord.gg/',
    //   target: '_blank',
    //   rel: 'noopener noreferrer',
    // },
    Support: {
      href: 'https://t.me/dozerfinance',
      target: '_blank',
      rel: 'noopener noreferrer',
    },
    // 'Twitter Support': {
    //   href: 'https://twitter.com/DozerProtocol',
    //   target: '_blank',
    //   rel: 'noopener noreferrer',
    // },
  },

  Items: [
    {
      Partners: {
        'Hathor Network': {
          href: 'https://hathor.network',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
        // NileSwap: {
        //   href: 'https://nileswap.com',
        //   target: '_blank',
        //   rel: 'noopener noreferrer',
        // },
      },
    },
  ],
}

export function Footer(props: FooterProps): JSX.Element {
  const leafNode = useCallback(
    (title: string, items: Record<string, { href: string; rel?: string; target?: string }>) => {
      return (
        <div key={title} className="flex flex-col gap-[10px]">
          <Typography variant="xs" weight={500} className="text-sm sm:text-xs text-stone-100">
            {title}
          </Typography>
          {Object.entries(items).map(([item, { href, rel, target }]) => (
            <a
              key={item}
              href={href}
              target={target}
              rel={rel}
              className="text-sm cursor-pointer sm:text-xs text-stone-400 hover:underline"
            >
              {item}
            </a>
          ))}
        </div>
      )
    },
    []
  )

  return (
    <footer className="hidden md:flex flex-col border-t border-stone-300/5 mt-auto pt-[26px]" {...props}>
      <Container maxWidth="5xl" className="grid grid-cols-1 md:grid-cols-[176px_auto] mx-auto px-4 gap-4">
        <div className="flex flex-col gap-3">
          <div className="items-center justify-start w-32">
            <DozerWithTextIcon />
          </div>
          <div className="text-sm sm:text-[0.8rem] leading-5 sm:leading-4 text-stone-300 pl-2">
            Easy, Fast and Safe.
          </div>
          <div className="flex items-center gap-4 pl-2">
            <a href="https://twitter.com/DozerProtocol" target="_blank" rel="noopener noreferrer">
              <TwitterIcon width={16} className="text-stone-200 hover:text-stone-50" />
            </a>
            <a href="https://t.me/DozerFinance" target="_blank" rel="noopener noreferrer">
              <TelegramIcon width={16} className="text-stone-200 hover:text-stone-50" />
            </a>
            <a href="https://forms.gle/8cEKvsaNrTP4c8Ef6" target="_blank" rel="noopener noreferrer">
              <DiscordIcon width={16} className="text-stone-200 hover:text-stone-50" />
            </a>
            <a href="https://github.com/Dozer-Protocol" target="_blank" rel="noopener noreferrer">
              <GithubIcon width={16} className="text-stone-200 hover:text-stone-50" />
            </a>
          </div>
        </div>
        <div className="md:px-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mt-[40px] sm:mt-[10px]">
          {Object.entries(config).map(([title, items], i) => {
            if (Array.isArray(items)) {
              return (
                <div key={i} className="flex flex-col gap-6">
                  {items.map((item) =>
                    Object.entries(item).map(([_title, _items]) => {
                      return leafNode(_title, _items)
                    })
                  )}
                </div>
              )
            } else {
              return leafNode(title, items)
            }
          })}
        </div>
      </Container>
      <Container maxWidth="5xl" className="mx-auto mt-8 mb-2">
        <div className="flex justify-between py-2 mx-4 border-t border-stone-800">
          <Typography variant="xs" className="text-stone-300">
            Copyright © 2024 Dozer. All rights reserved.
          </Typography>
          <div className="flex divide-x divide-stone-100/20 gap-">
            <Link.Internal href="https://mvp.dozer.finance" passHref={true}>
              <Typography as="a" variant="xs" weight={500} className="px-3 text-stone-200">
                Terms of Use
              </Typography>
            </Link.Internal>
            {/*<Link.Internal href="/privacy-policy" passHref={true}>*/}
            {/*  <Typography as="a" variant="xs" weight={500} className="pl-3 text-stone-300">*/}
            {/*    Privacy Policy*/}
            {/*  </Typography>*/}
            {/*</Link.Internal>*/}
          </div>
        </div>
      </Container>
    </footer>
  )
}
