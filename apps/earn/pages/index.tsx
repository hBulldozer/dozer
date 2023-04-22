import { PlusIcon } from '@heroicons/react/solid'
import { Button, Link, OnsenIcon, Typography } from '@dozer/ui'
import type { GetStaticProps, InferGetServerSidePropsType, InferGetStaticPropsType, NextPage } from 'next'
// import { SUPPORTED_CHAIN_IDS } from '../config'
// import { GetStaticProps, InferGetStaticPropsType } from 'next'
import { GetServerSideProps } from 'next'
import {
  FC,
  JSXElementConstructor,
  Key,
  ReactElement,
  ReactFragment,
  ReactPortal,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { Layout, PoolsSection } from '../components'
import { Pool, prisma } from '@dozer/database'
import { Pair, pairFromPoolAndTokensList } from '../utils/Pair'
import { getTokens } from '@dozer/currency'
import useSWR, { SWRConfig } from 'swr'

// export const getServerSideProps: GetServerSideProps = async ({ req }) => {
//   const pre_pools = await prisma.pool.findMany()
//   const tokens = await prisma.token.findMany()
//   const pools: Pair[] = []
//   pre_pools.forEach((pool: Pool) => {
//     pools?.push(pairFromPoolAndTokensList(pool, tokens))
//   })
//   return { props: { pools } }
// }

export const getStaticProps: GetStaticProps = async (context) => {
  // const [pairs, bundles, poolCount, bar] = await Promise.all([getPools(), getBundles(), getPoolCount(), getSushiBar()])
  const pre_pairs = await prisma.pool.findMany({
    include: {
      token0: true,
      token1: true,
    },
  })
  const pairs: Pair[] = []
  pre_pairs.forEach((pair) => {
    pairs?.push(pairFromPoolAndTokensList(pair))
  })
  return {
    props: {
      fallback: {
        ['/earn/api/pairs']: { pairs },
      },
      revalidate: 60,
    },
  }
}

const Pools: FC<InferGetStaticPropsType<typeof getStaticProps>> = ({ fallback }) => {
  return (
    <SWRConfig value={{ fallback }}>
      <_Pools />
    </SWRConfig>
  )
}

const _Pools = () => {
  return (
    <Layout>
      <div className="flex flex-col gap-10 md:gap-16">
        <section className="flex flex-col gap-6 lg:flex-row">
          <div className="max-w-md space-y-4">
            <Typography variant="hero" weight={600} className="text-stone-50">
              Earn
            </Typography>
            <p className="text-stone-300">Earn fees by providing liquidity.</p>
          </div>
          <div className="flex justify-end flex-grow not-prose">
            <div className="flex flex-col gap-3 w-full lg:w-[200px]">
              {/* <Link.Internal href="/add" passHref={true}> */}
              <Button as="a" href="/earn/add" fullWidth color="yellow" startIcon={<PlusIcon width={16} height={16} />}>
                New Position
              </Button>
              {/* </Link.Internal> */}
              {/* <Link.External href="https://rbieu62gj0f.typeform.com/to/KkrPkOFe">
                <Button fullWidth color="gray" startIcon={<OnsenIcon width={16} height={16} />}>
                  Join Onsen
                </Button>
              </Link.External> */}
            </div>
          </div>
        </section>
        {/* <SushiBarSection /> */}
        {/* <PoolsFiltersProvider selectedNetworks={selectedNetworks}> */}
        <PoolsSection />
        {/* </PoolsFiltersProvider> */}
      </div>
    </Layout>
  )
}

export default Pools
