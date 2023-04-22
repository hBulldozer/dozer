import { ExternalLinkIcon } from '@heroicons/react/solid'
import { ChainId, chainName } from '@dozer/chain'
import { formatPercent } from '@dozer/format'
// import { getBuiltGraphSDK, Pair } from '@dozer/graph-client'
import { Pair, pairFromPoolAndTokens, pairFromPoolAndTokensList } from '../../utils/Pair'
import { AppearOnMount, BreadcrumbLink, Container, Link, Typography } from '@dozer/ui'
// import { SUPPORTED_CHAIN_IDS } from '../../config'
import {
  GetServerSideProps,
  GetStaticPaths,
  GetStaticProps,
  InferGetServerSidePropsType,
  InferGetStaticPropsType,
  NextPage,
} from 'next'
import { useRouter } from 'next/router'
import { FC } from 'react'
import useSWR, { SWRConfig } from 'swr'

import {
  AddSectionLegacy,
  AddSectionMyPosition,
  // AddSectionStake,
  // AddSectionTrident,
  Layout,
  // PoolPositionProvider,
  // PoolPositionStakedProvider,
} from '../../components'
import { getTokens } from '@dozer/currency'
// import { GET_POOL_TYPE_MAP } from '../../lib/constants'
import { prisma } from '@dozer/database'

const Add: FC<InferGetStaticPropsType<typeof getStaticProps>> = ({ fallback }) => {
  return (
    <SWRConfig value={{ fallback }}>
      <_Add />
    </SWRConfig>
  )
}

const _Add: NextPage = () => {
  const router = useRouter()
  const { data } = useSWR<{ pair: Pair }>(`/earn/api/pool/${router.query.id}`, (url) =>
    fetch(url).then((response) => response.json())
  )

  if (!data) return <></>

  const { pair } = data

  return (
    // <PoolPositionProvider pair={pair}>
    <>
      {/* <PoolPositionStakedProvider pair={pair}> */}
      <Layout
      // breadcrumbs={LINKS(data)}
      >
        <div className="grid grid-cols-1 sm:grid-cols-[340px_auto] md:grid-cols-[auto_396px_264px] gap-10">
          <div className="hidden md:block" />
          <div className="flex flex-col order-3 gap-3 pb-40 sm:order-2">
            {/* <AddSectionLegacy pair={pair} prices={prices} /> */}
            {/* <AddSectionStake poolAddress={pair.id} /> */}
            <Container className="flex justify-center">
              <Link.External
                href="https://docs.dozer.finance/docs/Products/dozer/Liquidity%20Pools"
                className="flex justify-center px-6 py-4 decoration-stone-500 hover:bg-opacity-[0.06] cursor-pointer rounded-2xl"
              >
                <Typography variant="xs" weight={500} className="flex items-center gap-1 text-stone-500">
                  Learn more about liquidity and yield farming
                  <ExternalLinkIcon width={16} height={16} className="text-stone-500" />
                </Typography>
              </Link.External>
            </Container>
          </div>
          <div className="order-1 sm:order-3">
            <AppearOnMount>
              <AddSectionMyPosition pair={pair} />
            </AppearOnMount>
          </div>
        </div>
        <div className="z-[-1] bg-gradient-radial fixed inset-0 bg-scroll bg-clip-border transform pointer-events-none" />
      </Layout>
      {/* </PoolPositionStakedProvider> */}
    </>
    // </PoolPositionProvider>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const pre_pools = await prisma.pool.findMany({
    include: {
      token0: true,
      token1: true,
    },
  })

  // Get the paths we want to pre-render based on pairs
  const paths = pre_pools.map((pool, i) => ({
    params: { id: `${pool.id}` },
  }))

  // We'll pre-render only these paths at build time.
  // { fallback: blocking } will server-render pages
  // on-demand if the path doesn't exist.
  return { paths, fallback: 'blocking' }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const id = params?.id as string
  const pre_pool = await prisma.pool.findUnique({
    where: { id: id },
    include: {
      token0: true,
      token1: true,
      hourSnapshots: { orderBy: { date: 'desc' } },
      daySnapshots: { orderBy: { date: 'desc' } },
    },
  })
  const pair: Pair = pairFromPoolAndTokens(pre_pool)
  if (!pair) {
    throw new Error(`Failed to fetch pair, received ${pair}`)
  }
  return {
    props: {
      fallback: {
        [`/earn/api/pool/${id}`]: { pair },
      },
    },
    revalidate: 60,
  }
}

export default Add
