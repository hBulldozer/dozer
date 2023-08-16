import { ChevronRightIcon } from '@heroicons/react/solid'
import { Button, Container, Typography } from '@dozer/ui'
import { motion } from 'framer-motion'
import { FC } from 'react'

import { ExpandableCard, ExpendableCardData } from '../ExpandableCard/ExpandableCard'
import { HowImage } from './HowImage'

{
  /* <Typography variant="h1" weight={600} className="text-center lg:text-left">
How we make it.
</Typography>
<Typography variant="lg" weight={400} className="mt-2 text-center lg:text-left">
What are the modern DeFi issues and how we mitigate them.
<br /> Slow confirmation times
<br /> High gas fees
<br /> Contract vulnerabilities
</Typography> */
}
const DATA: ExpendableCardData = {
  title: 'How we make it',
  caption: 'The solution',
  content: (
    <>
      <p>
        DeFi, or decentralized finance, has revolutionized the financial industry, but not without challenges.The
        growing popularity of DeFi platforms has caused congestion on blockchains, leading to exorbitant gas fees that
        hinders accessibility and scalability for users. ’
      </p>
      <p>
        This is a infraestrucure and blockchain architecture issue, a lot of clever solutions were made to solve this
        issue but most of them achieve escalability at the cost of security or decentralization.
      </p>
      <p>
        Dozer choose to build upon Hathor Network that arguably solve the blockchain tryllema and has a easy to use
        approuch.
      </p>
      <p>Video Link https://www.youtube.com/watch?v=6s3Hkog7bdc </p>
      <p>
        We also are using Nano Contracts for the dApp logics, this is a contract implementation that mitigates risks and
        ensure a more secure implementation while being less complicated than solidity. This ensures a sure and fast
        paced development facilitating upgrades and delivering more value to users
      </p>
      <p>
        The last but not least, we are not reinventing the wheel, we are absorving all the previus DeFi implementations
        learning from their mistakes to craft the better journey for both our users and investors.
      </p>
    </>
  ),
  link: 'https://dozer.finance/swap',
  linkText: 'Visit Swap',
}

export const Hathor: FC = () => {
  return (
    <section className="py-20 sm:py-40">
      <Container maxWidth="5xl" className="px-4 mx-auto space-y-20">
        {/* <div className="grid grid-cols-1 lg:grid-cols-2 justify-center gap-[100px]"> */}
        <div className="grid grid-cols-1 lg:grid-cols-[380px_auto] justify-center gap-x-[100px] gap-y-[20px]">
          <div className="flex flex-col justify-center sm:order-1 order-2 gap-3">
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
                    {/* Own your own crypto, just like cash in your wallet. Fully decentralized & self custody of your funds
                    means your money in your wallet, as it should be. */}
                    Leveraging Hathor Blockchain architecture, innovating with Nano Contracts and building on the
                    shoulders of DeFi giants
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
          <div className=" justify-center order-1 sm:order-2">
            <HowImage />
          </div>
        </div>
      </Container>
    </section>
  )
}
