import { ChevronRightIcon, ExternalLinkIcon } from '@heroicons/react/solid'
import { Button, Container, Typography } from '@dozer/ui'
import { FC } from 'react'

import { MoveImage } from './MoveImage'
import { ExpandableCard, ExpendableCardData } from 'components/ExpandableCard/ExpandableCard'

const DATA: ExpendableCardData = {
  title: 'Assets across networks',
  caption: 'Hathor bridge',
  content: (
    <>
      <p>
        Transform the way you trade assets between EVM networks through the upcoming bridge feature. Effortlessly
        enabling fluid movement of assets, encounter unhindered flow and smooth transactions.
      </p>
      <p>
        Fueled by Hathor&apos;s strengths — fast transactions, scalability, and secure PoW architecture — this EVM
        bridge bridges the gaps, delivering efficiency where it&apos;s most needed.
      </p>
      <p>
        Uncover decentralized finance&apos;s next level through this innovation. Click below for comprehensive bridge
        development details and embrace a future of unobstructed cross-network asset exchange.
      </p>
      <div className="flex gap-6">
        <Button
          as="a"
          target="_blank"
          href="https://github.com/HathorNetwork/rfcs/blob/fa6bb67db9f82e47efdfd02cb527366cab9772fe/projects/evm-compatible-bridge/design.md"
          className="!p-0 mt-3 "
          variant="empty"
          endIcon={<ExternalLinkIcon width={16} height={16} />}
        >
          More details
        </Button>
      </div>
    </>
  ),
  link: 'https://dozer.finance/swap',
  linkText: 'Visit Swap',
}

export const Move: FC = () => {
  return (
    <section className="">
      <Container maxWidth="5xl" className="px-4 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_auto] justify-center gap-x-[100px] gap-y-[20px]">
          <ExpandableCard
            title={DATA.title}
            caption={DATA.caption}
            content={DATA.content}
            link={DATA.link}
            linkText={DATA.linkText}
          >
            {({ setOpen, containerId, titleId }) => (
              <div className="flex flex-col justify-center order-2 gap-3">
                <div className="flex flex-col items-center lg:items-start">
                  <Typography variant="h1" weight={600} className="text-center lg:text-left">
                    Move assets across networks.
                  </Typography>
                  <Typography variant="lg" weight={400} className="mt-2 text-center lg:text-left">
                    Bring your assets to Hathor Network, enjoy zero fess and blasting speed on your transactions.
                  </Typography>
                  <div className="flex gap-6">
                    <Button
                      onClick={() => setOpen(true)}
                      className="!p-0 mt-3"
                      variant="empty"
                      endIcon={<ChevronRightIcon width={16} height={16} />}
                    >
                      Learn More
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </ExpandableCard>
          <div className="flex justify-center order-1 ">
            <MoveImage />
          </div>
        </div>
      </Container>
    </section>
  )
}
