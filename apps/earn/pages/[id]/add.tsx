import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/solid'
import { formatPercent } from '@dozer/format'
// import { Pair } from '@dozer/api'
import { AppearOnMount, BreadcrumbLink, Container, Link, Typography } from '@dozer/ui'
import { GetStaticPaths, GetStaticProps, NextPage } from 'next'
import { useRouter } from 'next/router'

import { AddSectionLegacy, AddSectionMyPosition, Layout } from '../../components'

import { RouterOutputs, api } from '../../utils/api'
import { generateSSGHelper } from '@dozer/api/src/helpers/ssgHelper'
import BlockTracker from '@dozer/higmi/components/BlockTracker/BlockTracker'

type PoolsOutputArray = RouterOutputs['getPools']['all']

type ElementType<T> = T extends (infer U)[] ? U : never
type PoolsOutput = ElementType<PoolsOutputArray>

const LINKS = (pool: PoolsOutput): BreadcrumbLink[] => [
  {
    href: `/${pool.id}`,
    label: `${pool.name}`,
  },
  {
    href: `/${pool.id}/add`,
    label: `Add Liquidity`,
  },
]

const Add: NextPage = () => {
  const router = useRouter()
  const id = router.query.id as string

  const { data: pools } = api.getPools.all.useQuery()
  if (!pools) return <></>
  const pair = pools.find((pool) => pool.id === id)
  // const pair = pool ? pairFromPool(pool) : ({} as Pair)
  if (!pair) return <></>
  const tokens = pair ? [pair.token0, pair.token1] : []
  if (!tokens) return <></>
  const { data: prices = {} } = api.getPrices.all.useQuery()
  if (!prices) return <></>

  return (
    // <PoolPositionProvider pair={pair}>
    <>
      {/* <PoolPositionStakedProvider pair={pair}> */}
      <Layout breadcrumbs={LINKS(pair)}>
        <BlockTracker client={api} />
        <div className="grid grid-cols-1 sm:grid-cols-[340px_auto] md:grid-cols-[auto_396px_264px] gap-10">
          <div className="hidden md:block" />
          <div className="flex flex-col order-3 gap-3 pb-40 sm:order-2">
            <AddSectionLegacy pool={pair} prices={prices} />
            {/* <AddSectionStake poolAddress={pair.id} /> */}
            <Container className="flex justify-center">
              <Link.External
                href="https://docs.dozer.finance/products/dex-liquidity-pools"
                className="flex justify-center px-6 py-4 decoration-stone-500 hover:bg-opacity-[0.06] cursor-pointer rounded-2xl"
              >
                <Typography variant="xs" weight={500} className="flex items-center gap-1 text-stone-500">
                  Learn more about liquidity and yield farming
                  <ArrowTopRightOnSquareIcon width={16} height={16} className="text-stone-500" />
                </Typography>
              </Link.External>
            </Container>
          </div>
          {/* <div className="order-1 sm:order-3">
            <AppearOnMount>
              <AddSectionMyPosition pair={pair} />
            </AppearOnMount>
          </div> */}
        </div>
        {/* <div className="z-[-1] bg-gradient-radial fixed inset-0 bg-scroll bg-clip-border transform pointer-events-none" /> */}
      </Layout>
      {/* </PoolPositionStakedProvider> */}
    </>
    // </PoolPositionProvider>
  )
}

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

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const id = params?.id as string
  const ssg = generateSSGHelper()
  const pools = await ssg.getPools.all.fetch()
  if (!pools) {
    throw new Error(`Failed to fetch pool, received ${pools}`)
  }
  const pool = pools.find((pool) => pool.id === id)
  if (!pool) {
    throw new Error(`Failed to find pool with id ${id}`)
  }
  const tokens = [pool.token0, pool.token1]
  await ssg.getTokens.all.prefetch()
  await ssg.getPrices.all.prefetch()
  return {
    props: {
      trpcState: ssg.dehydrate(),
    },
    revalidate: 3600,
  }
}

export default Add
