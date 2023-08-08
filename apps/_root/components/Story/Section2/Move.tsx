import { ExternalLinkIcon } from '@heroicons/react/solid'
import { Button, Container, Typography } from '@dozer/ui'
import { FC } from 'react'

import { MoveImage } from './MoveImage'

export const Move: FC = () => {
  return (
    <section className="py-20 sm:py-40">
      <Container maxWidth="5xl" className="px-4 mx-auto space-y-20">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_auto] justify-center gap-x-[100px] gap-y-[20px]">
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
                  as="a"
                  target="_blank"
                  href="https://github.com/HathorNetwork/rfcs/blob/fa6bb67db9f82e47efdfd02cb527366cab9772fe/projects/evm-compatible-bridge/design.md"
                  className="!p-0 mt-3"
                  variant="empty"
                  endIcon={<ExternalLinkIcon width={16} height={16} />}
                >
                  Learn More
                </Button>
              </div>
            </div>
          </div>
          <div className="flex justify-center order-1 mr-12">
            <MoveImage />
          </div>
        </div>
      </Container>
    </section>
  )
}
