import { PlusIcon } from '@heroicons/react/24/solid'
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

  // Skip heavy prefetches in development to avoid socket hang ups
  // In production, prefetch data for optimal ISG performance
  const isDevelopment = process.env.NODE_ENV === 'development'

  if (!isDevelopment) {
    // Prefetch core data in parallel for faster SSG (production only)
    await Promise.all([
      ssg.getTokens.all.prefetch(),
      ssg.getPrices.allUSD.prefetch(),
      ssg.getPools.all.prefetch(),
      ssg.getTokens.allTotalSupply.prefetch(),
      ssg.getNetwork.getBestBlock.prefetch(),
    ])

    // Optionally prefetch tokens summary - but don't block on it
    // If it fails, the client will fetch it anyway
    try {
      await Promise.race([
        ssg.getPrices.tokensSummary.prefetch({ currency: 'USD', miniChartPoints: 10 }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000)),
      ])
    } catch (error) {
      console.warn('Tokens summary prefetch timed out or failed, will be fetched client-side')
    }
  }

  return {
    props: {
      trpcState: ssg.dehydrate(),
    },
    revalidate: isDevelopment ? false : 60, // Disable revalidation in dev, 60s in production
  }
}

const Tokens: FC = () => {
  return (
    <Layout>
      <div className="flex flex-col gap-10 md:gap-16">
        <section className="flex flex-col gap-6 lg:flex-row">
          <div className="space-y-4 max-w-md">
            <Typography variant="hero" weight={600} className="text-stone-50">
              Tokens
            </Typography>
            <Typography className="text-stone-300">Dozer Protocol featured Tokens.</Typography>
          </div>
          {/* <div className="flex flex-grow justify-end not-prose">
            <Button
              as="a"
              href="/pool/create_token"
              className="gap-2"
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault()
                window.location.href = '/pool/create_token'
              }}
            >
              <PlusIcon className="w-5 h-5" />
              Create Token
            </Button>
          </div> */}
        </section>
        <TokensSection />
      </div>
      <BlockTracker client={api} />
    </Layout>
  )
}

export default Tokens
