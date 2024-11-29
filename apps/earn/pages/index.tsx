import { PlusCircleIcon, BeakerIcon } from '@heroicons/react/24/outline'
import { Button, Typography } from '@dozer/ui'
import type { GetStaticProps, InferGetStaticPropsType } from 'next'
import { FC } from 'react'

import { Layout, PoolsSection } from '../components'
import { generateSSGHelper } from '@dozer/api/src/helpers/ssgHelper'
import BlockTracker from '@dozer/higmi/components/BlockTracker/BlockTracker'
import { api } from '../utils/api'

export const getStaticProps: GetStaticProps = async () => {
  const ssg = generateSSGHelper()
  await ssg.getPools.all.prefetch()
  // await ssg.getPools.firstLoadAllDay.prefetch()
  // await ssg.getPools.allDay.prefetch()
  await ssg.getTokens.all.prefetch()
  await ssg.getPrices.all.prefetch()
  await ssg.getNetwork.getBestBlock.prefetch()
  return {
    props: {
      trpcState: ssg.dehydrate(),
    },
    revalidate: 3600,
  }
}

const Pools: FC = () => {
  return (
    <Layout>
      <div className="flex flex-col gap-10 md:gap-16">
        <section className="flex flex-col gap-6 lg:flex-row">
          <div className="max-w-md space-y-4">
            <Typography variant="hero" weight={600} className="text-stone-50">
              Pools 💦
            </Typography>
            <Typography className="text-stone-300">Earn fees by providing liquidity.</Typography>
          </div>
          <div className="flex justify-end flex-grow not-prose">
            <div className="flex flex-col gap-3 w-full lg:w-[420px]">
              <div className="flex gap-3">
                <Button
                  as="a"
                  href="/pool/add"
                  fullWidth
                  variant="outlined"
                  color="yellow"
                  startIcon={<PlusCircleIcon width={20} height={20} />}
                >
                  New Position
                </Button>
                <Button as="a" href="/pool/create" fullWidth startIcon={<BeakerIcon width={20} height={20} />}>
                  Create Pool
                </Button>
              </div>
            </div>
          </div>
        </section>
        <PoolsSection />
      </div>
      <BlockTracker client={api} />
    </Layout>
  )
}

export default Pools
