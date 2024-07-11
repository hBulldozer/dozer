import { ChevronRightIcon, VideoCameraIcon } from '@heroicons/react/24/solid'
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
    //   <>
    //   <p>
    //     DeFi, or decentralized finance, has revolutionized the financial industry, but not without challenges.The
    //     growing popularity of DeFi platforms has caused congestion on blockchains, leading to exorbitant gas fees that
    //     hinders accessibility and scalability for users. ’
    //   </p>
    //   <p>
    //     This is a infraestrucure and blockchain architecture issue, a lot of clever solutions were made to solve this
    //     issue but most of them achieve escalability at the cost of security or decentralization.
    //   </p>
    //   <p>
    //     Dozer choose to build upon Hathor Network that arguably solve the blockchain tryllema and has a easy to use
    //     approuch.
    //   </p>
    //   <div className="flex gap-6">
    //     <Button
    //       as="a"
    //       target="_blank"
    //       href="https://www.youtube.com/watch?v=6s3Hkog7bd"
    //       className="!p-0 mt-3 "
    //       variant="empty"
    //       endIcon={<VideoCameraIcon width={16} height={16} />}
    //     >
    //       Watch this video
    //     </Button>
    //   </div>

    //   <p>
    //     We also are using Nano Contracts for the dApp logics, this is a contract implementation that mitigates risks and
    //     ensure a more secure implementation while being less complicated than solidity. This ensures a sure and fast
    //     paced development facilitating upgrades and delivering more value to users
    //   </p>
    //   <p>
    //     The last but not least, we are not reinventing the wheel, we are absorving all the previous DeFi implementations
    //     learning from their mistakes to craft the better journey for both our users and investors.
    //   </p>
    // </>
    <>
      <p>
        DeFi, or decentralized finance, has brought about a revolutionary shift in the financial industry. However, this
        transformation hasn&apos;t occurred without its fair share of challenges. The soaring popularity of DeFi
        platforms has led to blockchain congestion, resulting in exorbitant gas fees that hinder accessibility and
        scalability for users.
      </p>
      <p>
        This issue pertains to infrastructure and blockchain architecture, and although numerous ingenious solutions
        have been devised to address it, many of these solutions achieve scalability at the expense of security or
        decentralization.
      </p>
      <p>
        Dozer has chosen to build upon the Hathor Network, which arguably resolves the blockchain trilemma and offers a
        user-friendly approach.
      </p>
      <div className="flex -mt-10">
        <Button
          as="a"
          target="_blank"
          href="https://youtu.be/6s3Hkog7bdc"
          className="!p-0 mt-3"
          variant="empty"
          endIcon={<VideoCameraIcon width={16} height={16} />}
        >
          Hathor BlockDag
        </Button>
      </div>

      <p>
        Additionally, we employ Nano Contracts for dApp logic. These contract implementations mitigate risks and ensure
        a more secure execution while being less complex than Solidity. This ensures a reliable and swift development
        process, enabling upgrades and delivering greater value to users.
      </p>
      <p>
        Last but certainly not least, we are not reinventing the wheel; rather, we are absorbing the insights from
        previous DeFi implementations, learning from their shortcomings, and crafting an enhanced journey for both our
        users and investors.
      </p>
    </>
  ),
  link: 'https://mvp.dozer.finance/',
  linkText: 'Visit Swap',
}

export const Hathor: FC = () => {
  return (
    <section className="py-20 sm:py-40">
      <Container maxWidth="5xl" className="px-4 mx-auto space-y-20">
        {/* <div className="grid grid-cols-1 lg:grid-cols-2 justify-center gap-[100px]"> */}
        <div className="grid grid-cols-1 lg:grid-cols-[380px_auto] justify-center gap-x-[100px] gap-y-[20px]">
          <div className="flex flex-col justify-center order-1 gap-3 ">
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
                    Leveraging Hathor BlockDag architecture, innovating with Nano Contracts and building on the
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
          <div className="justify-center order-2">
            <HowImage />
          </div>
        </div>
      </Container>
    </section>
  )
}
