import { ExternalLinkIcon } from '@heroicons/react/solid'
import { formatPercent } from '@dozer/format'
import { pairFromPool } from '../../utils/Pair'
import { AppearOnMount, BreadcrumbLink, Container, Link, Typography } from '@dozer/ui'
import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType, NextPage } from 'next'
import { useRouter } from 'next/router'
import { FC } from 'react'

import { AddSectionLegacy, AddSectionMyPosition, Layout } from '../../components'
import { dbPoolWithTokens } from '../../interfaces'
import { getPoolWithTokens, getPools, getPrices } from '../../utils/api'
import { RouterOutputs, api } from '../../utils/trpc'
import { generateSSGHelper } from '@dozer/api/src/helpers/ssgHelper'

type PoolsOutputArray = RouterOutputs['getPools']['all']

type ElementType<T> = T extends (infer U)[] ? U : never
type PoolsOutput = ElementType<PoolsOutputArray>

const LINKS = (pool: PoolsOutput): BreadcrumbLink[] => [
  {
    href: `/${pool.id}`,
    label: `${pool.name} - ${formatPercent(pool.swapFee / 10000)}`,
  },
  {
    href: `/${pool.id}/add`,
    label: `Add Liquidity`,
  },
]

const Add: NextPage = () => {
  const router = useRouter()
  const id = router.query.id as string

  const { data: pre_pool = {} as PoolsOutput } = api.getPools.byId.useQuery({ id })
  const pool = pre_pool ? pre_pool : ({} as PoolsOutput)
  const tokens = pool ? [pool.token0, pool.token1] : []
  const { data: prices = {} } = api.getPrices.byTokens.useQuery({ tokens })

  return (
    // <PoolPositionProvider pair={pair}>
    <>
      {/* <PoolPositionStakedProvider pair={pair}> */}
      <Layout breadcrumbs={LINKS(pool)}>
        <div className="grid grid-cols-1 sm:grid-cols-[340px_auto] md:grid-cols-[auto_396px_264px] gap-10">
          <div className="hidden md:block" />
          <div className="flex flex-col order-3 gap-3 pb-40 sm:order-2">
            <AddSectionLegacy pool={pool} prices={prices} />
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
              <AddSectionMyPosition pair={pairFromPool(pool)} />
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
  const { data: pools } = api.getPools.all.useQuery()

  if (!pools) {
    throw new Error(`Failed to fetch pool, received ${pools}`)
  }
  // Get the paths we want to pre-render based on pairs
  const paths = pools?.map((pool) => ({
    params: { id: `${pool.id}` },
  }))

  // We'll pre-render only these paths at build time.
  // { fallback: blocking } will server-render pages
  // on-demand if the path doesn't exist.
  return { paths, fallback: 'blocking' }
}

// export const getStaticProps: GetStaticProps = async ({ params }) => {
//   const id = params?.id as string
//   const pool = await getPoolWithTokens(id)
//   const tokens = [pool.token0, pool.token1]
//   const prices = await getPrices(tokens)

//   if (!tokens) {
//     throw new Error(`Failed to fetch tokens, received ${tokens}`)
//   }

//   if (!prices) {
//     throw new Error(`Failed to fetch prices, received ${prices}`)
//   }

//   if (!pool) {
//     throw new Error(`Failed to fetch pool, received ${pool}`)
//   }

//   return {
//     props: {
//       fallback: {
//         [`/api/pool/${id}`]: { pool },
//         [`/api/prices`]: { prices },
//       },
//     },
//     revalidate: 60,
//   }
// }

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const id = params?.id as string
  const ssg = generateSSGHelper()
  const pool = await ssg.getPools.byId.fetch({ id })
  if (!pool) {
    throw new Error(`Failed to fetch pool, received ${pool}`)
  }
  const tokens = [pool.token0, pool.token1]
  await ssg.getTokens.all.prefetch()
  await ssg.getPrices.byTokens.prefetch({ tokens })
  return {
    props: {
      trpcState: ssg.dehydrate(),
    },
    revalidate: 3600,
  }
}

export default Add
