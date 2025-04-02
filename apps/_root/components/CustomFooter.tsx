import React from 'react'
import { Container } from '@dozer/ui/container'
import { Typography } from '@dozer/ui/typography'
import { Link } from '@dozer/ui/link'
import { DiscordIcon, GithubIcon, TwitterIcon, DozerWithTextIcon, TelegramIcon } from '@dozer/ui/icons'

export const CustomFooter: React.FC = () => {
  return (
    <footer className="hidden md:flex flex-col border-t border-stone-300/5 mt-auto pt-[26px]">
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
        <div className="md:px-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 mt-[40px] sm:mt-[10px]">
          <div className="flex flex-col gap-[10px]">
            <Typography variant="xs" weight={500} className="text-sm sm:text-xs text-stone-100">
              Features
            </Typography>
            <a
              href="https://testnet.dozer.finance/swap"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm cursor-pointer sm:text-xs text-stone-400 hover:underline"
            >
              Swap
            </a>
            <a
              href="https://testnet.dozer.finance/pool"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm cursor-pointer sm:text-xs text-stone-400 hover:underline"
            >
              Earn
            </a>
            <a
              href="https://testnet.dozer.finance/pool/create_token"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm cursor-pointer sm:text-xs text-stone-400 hover:underline"
            >
              Launch
            </a>
          </div>

          <div className="flex flex-col gap-[10px]">
            <Typography variant="xs" weight={500} className="text-sm sm:text-xs text-stone-100">
              Help
            </Typography>
            <a
              href="https://docs.dozer.finance"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm cursor-pointer sm:text-xs text-stone-400 hover:underline"
            >
              Docs
            </a>
            <a
              href="https://t.me/dozerfinance"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm cursor-pointer sm:text-xs text-stone-400 hover:underline"
            >
              Support
            </a>
          </div>

          <div className="flex flex-col gap-[10px]">
            <Typography variant="xs" weight={500} className="text-sm sm:text-xs text-stone-100">
              Partners
            </Typography>
            <a
              href="https://hathor.network"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm cursor-pointer sm:text-xs text-stone-400 hover:underline"
            >
              Hathor Network
            </a>
          </div>
        </div>
      </Container>
      <Container maxWidth="5xl" className="mx-auto mt-8 mb-2">
        <div className="flex justify-between py-2 mx-4 border-t border-stone-800">
          <Typography variant="xs" className="text-stone-300">
            Copyright © 2024 Dozer. All rights reserved.
          </Typography>
          <div className="flex divide-x divide-stone-100/20">
            <Link.Internal href="https://mvp.dozer.finance" passHref={true}>
              <Typography as="a" variant="xs" weight={500} className="px-3 text-stone-200">
                Terms of Use
              </Typography>
            </Link.Internal>
          </div>
        </div>
      </Container>
    </footer>
  )
}
