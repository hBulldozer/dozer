import { AppearOnMount, BreadcrumbLink } from '@dozer/ui'
import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next'
import { useRouter } from 'next/router'
import { Pair, pairFromPool, pairFromPoolAndTokens, pairWithSnapsFromPool } from '../../utils/Pair'
import { PoolChart } from '../../components/PoolSection/PoolChart'

import {
  Layout,
  PoolActionBar,
  PoolButtons,
  PoolComposition,
  PoolHeader,
  PoolMyRewards,
  PoolPosition,
  PoolPositionProvider,
  PoolRewards,
  PoolStats,
} from '../../components'

import { formatPercent } from '@dozer/format'
import { FC } from 'react'
import { getPairs, getPoolWithTokensAndSnaps, getPrices } from '../../utils/api'
import { generateSSGHelper } from '@dozer/api/src/helpers/ssgHelper'
import { RouterOutputs, api } from '../../utils/trpc'

type PoolsOutputArray = RouterOutputs['getPools']['all']

type ElementType<T> = T extends (infer U)[] ? U : never
type PoolsOutput = ElementType<PoolsOutputArray>

export const getStaticPaths: GetStaticPaths = async () => {
  const ssg = generateSSGHelper()
  const pools = await ssg.getPools.all.fetch()

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
  await ssg.getPools.byIdWithSnaps.prefetch({ id })
  await ssg.getTokens.all.prefetch()
  await ssg.getPrices.byTokens.prefetch({ tokens })
  return {
    props: {
      trpcState: ssg.dehydrate(),
    },
    revalidate: 3600,
  }
}

const LINKS = ({ pair }: { pair: Pair }): BreadcrumbLink[] => [
  {
    href: `/${pair.id}`,
    label: `${pair.name} - ${formatPercent(pair.swapFee / 10000)}`,
  },
]

const Pool = () => {
  const router = useRouter()
  const id = router.query.id as string

  const { data: pool } = api.getPools.byIdWithSnaps.useQuery({ id })
  if (!pool) return <></>
  const pair = pool ? pairWithSnapsFromPool(pool) : ({} as Pair)
  if (!pair) return <></>
  const tokens = pair ? [pair.token0, pair.token1] : []
  if (!tokens) return <></>
  const { data: prices = {} } = api.getPrices.byTokens.useQuery({ tokens })
  if (!prices) return <></>

  return (
    <PoolPositionProvider pair={pair} prices={prices}>
      <>
        <Layout breadcrumbs={LINKS({ pair })}>
          <div className="flex flex-col lg:grid lg:grid-cols-[568px_auto] gap-12">
            <div className="flex flex-col order-1 gap-9">
              <PoolHeader pair={pair} prices={prices} />
              <hr className="my-3 border-t border-stone-200/5" />
              <PoolChart pair={pair} />
              <AppearOnMount>
                <PoolStats pair={pair} prices={prices} />
              </AppearOnMount>
              <PoolComposition pair={pair} prices={prices} />
              <PoolRewards pair={pair} />
            </div>

            <div className="flex flex-col order-2 gap-4">
              <AppearOnMount>
                <div className="flex flex-col gap-10">
                  <PoolMyRewards pair={pair} />
                  <PoolPosition pair={pair} />
                </div>
              </AppearOnMount>
              <div className="hidden lg:flex">
                <PoolButtons pair={pair} />
              </div>
            </div>
          </div>
        </Layout>
        <PoolActionBar pair={pair} />
      </>
    </PoolPositionProvider>
  )
}

export default Pool
