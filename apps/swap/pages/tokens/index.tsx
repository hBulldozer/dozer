import { PlusIcon } from '@heroicons/react/solid'
import { Button, Typography } from '@dozer/ui'
import type { GetStaticProps, InferGetStaticPropsType } from 'next'
import { FC } from 'react'

import { Layout } from 'components/Layout'
import { TokensSection } from 'components/TokensPage'
import { generateSSGHelper } from '@dozer/api/src/helpers/ssgHelper'
import { api } from 'utils/api'
import BlockTracker from '@dozer/higmi/components/BlockTracker/BlockTracker'

export const getStaticProps: GetStaticProps = async () => {
  const ssg = generateSSGHelper()
  await ssg.getPools.all.prefetch()
  await ssg.getTokens.all.prefetch()
  await ssg.getPrices.all.prefetch()
  await ssg.getPrices.all24h.prefetch()
  return {
    props: {
      trpcState: ssg.dehydrate(),
    },
    revalidate: 3600,
  }
}

const Tokens: FC = () => {
  return (
    <Layout>
      <div className="flex flex-col gap-10 md:gap-16">
        <section className="flex flex-col gap-6 lg:flex-row">
          <div className="max-w-md space-y-4">
            <Typography variant="hero" weight={600} className="text-stone-50">
              Tokens
            </Typography>
            <Typography className="text-stone-300">Dozer Protocol featured Tokens.</Typography>
          </div>
          <div className="flex justify-end flex-grow not-prose"></div>
        </section>
        <TokensSection />
      </div>
      <BlockTracker client={api} />
    </Layout>
  )
}

export default Tokens
