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
        Centralized exchanges, or exchanges run by a centralized entity, custody users’ tokens on their behalf into an
        intermediary account, and are prone to many attack vectors such as hacks, government intervention, internal
        mismanagement, frozen withdrawals, bank runs, etc. Due to the unfortunate prevalence of these issues with users’
        funds on centralized exchanges, the space had adopted a common mantra: “Not your keys, not your crypto.” This
        refers to the idea that if you yourself do not have the literal custody of your funds (because a third party is
        looking over them for you), you can never be completely sure your funds are safe.
      </p>
      <p>
        As a decentralized exchange, Dozer never has control of users’ funds, nor will they ever in the future. The
        decentralized nature of it means that we do not rely on a third party or an intermediary account; the users are
        always in full custody of your their tokens, and can exchange with them at any time, without ever having to jump
        through any hoops or submit any personal information. Stay in full control of your money.
      </p>
    </>
  ),
  link: 'https://dozer.finance/swap',
  linkText: 'Visit Swap',
}

export const Hathor: FC = () => {
  return (
    <section className="py-48">
      <Container maxWidth="5xl" className="px-4 mx-auto space-y-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 justify-center gap-[100px]">
          <div className="flex flex-col justify-center gap-3">
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
          {/* <CustodyImage /> */}
          <HowImage />
        </div>
      </Container>
    </section>
  )
}
