import { ChevronRightIcon, ExternalLinkIcon } from '@heroicons/react/solid'
import { Button, Container, Typography } from '@dozer/ui'
import { FC } from 'react'
import { motion } from 'framer-motion'

import { MoveImage } from './MoveImage'
import { ExpandableCard, ExpendableCardData } from 'components/ExpandableCard/ExpandableCard'

const DATA: ExpendableCardData = {
  title: 'EVM Bridge',
  caption: 'Cross-chain',
  content: (
    <>
      <p>
        Seamlessly connect the world of Ethereum Virtual Machine (EVM) networks with Hathor&apos;s cutting-edge
        blockchain ecosystem; unlock a new range of opportunities with your EVM native tokens such as $ETH, $WBTC, $USDT
        and more.
      </p>
      <p>
        Experience the ultimate trio: Zero Gas Fees, Scalability, and Security, all powered by Hathor BlockDag. Thanks
        to the robust backing of Bitcoin proof of work merged mining, Hathor achieves high transactions per second
        without compromising security or decentralization.
      </p>
      <p>
        Exchange EVM tokens to Hathor native tokens without KYC; buy $HTR, $DZR, $NST, and more without CEX using Dozer
        Protocol.
      </p>
      <p>
        Experience Hathor&apos;s bridge and redefine the way you interact with the blockchain universe. This is your
        gateway to a future where innovation, speed, and limitless exploration converge to rewrite the rules of the
        game. Click below for technical details.
      </p>
      <div className="flex -mt-10">
        <Button
          as="a"
          target="_blank"
          href="https://github.com/HathorNetwork/rfcs/blob/fa6bb67db9f82e47efdfd02cb527366cab9772fe/projects/evm-compatible-bridge/design.md"
          className="!p-0 mt-3 "
          variant="empty"
          endIcon={<ExternalLinkIcon width={16} height={16} />}
        >
          RFC
        </Button>
      </div>
    </>
  ),
  link: 'https://dozer.finance/swap',
  linkText: 'Visit Swap',
}

export const Move: FC = () => {
  return (
    <section className="py-20 sm:py-40">
      <Container maxWidth="5xl" className="px-4 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_auto] justify-center gap-x-[100px] gap-y-[20px]">
          <div className="flex flex-col justify-center order-1 gap-3">
            <ExpandableCard
              title={DATA.title}
              caption={DATA.caption}
              content={DATA.content}
              link={DATA.link}
              linkText={DATA.linkText}
            >
              {({ setOpen, containerId, titleId }) => (
                <motion.div layoutId={containerId} className="flex flex-col items-center lg:items-start">
                  <Typography
                    as={motion.h1}
                    layoutId={titleId}
                    variant="h1"
                    weight={600}
                    className="flex flex-col items-center text-center lg:items-start lg:text-left"
                  >
                    {DATA.title}
                  </Typography>
                  <Typography variant="lg" weight={400} className="mt-2 text-center lg:text-left">
                    Bring your assets to Hathor Network, enjoy zero fees and blasting speed on your transactions.
                  </Typography>
                  <Button
                    onClick={() => setOpen(true)}
                    className="!p-0 mt-3"
                    variant="empty"
                    endIcon={<ChevronRightIcon width={16} height={16} />}
                  >
                    Learn More
                  </Button>
                </motion.div>
              )}
            </ExpandableCard>
          </div>
          <div className="flex justify-center order-2 ">
            <MoveImage />
          </div>
        </div>
      </Container>
    </section>
  )
}
