import { AppearOnMount, BreadcrumbLink } from '@dozer/ui'
import { GetStaticPaths, GetStaticProps } from 'next'
import { useRouter } from 'next/router'
import { Pair } from '@dozer/api'
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
import { generateSSGHelper } from '@dozer/api/src/helpers/ssgHelper'
import { RouterOutputs, api } from '../../utils/api'
import { useAccount } from '@dozer/zustand'

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
  // const poolNC = await ssg.getPools.byIdFromContract.fetch({ id: pool.id })
  // if (!poolNC) {
  //   throw new Error(`Failed to fetch pool, received ${poolNC}`)
  // }
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

const LINKS = ({ pair }: { pair: Pair }): BreadcrumbLink[] => [
  {
    href: `/${pair.id}`,
    label: `${pair.name} - ${formatPercent(pair.swapFee / 10000)}`,
  },
]

const Pool = () => {
  const router = useRouter()
  const id = router.query.id as string

  const { data: prices = {} } = api.getPrices.all.useQuery()
  if (!prices) return <></>
  const { data: pools } = api.getPools.all.useQuery()
  if (!pools) return <></>
  const pair = pools.find((pool) => pool.id === id)
  if (!pair) return <></>
  const tokens = pair ? [pair.token0, pair.token1] : []
  if (!tokens) return <></>

  const { address } = useAccount()

  const { data: poolInfo } = api.getProfile.poolInfo.useQuery({ address: address, contractId: pair.id })

  return (
    <PoolPositionProvider pair={pair} prices={prices}>
      <>
        <Layout breadcrumbs={LINKS({ pair })}>
          <div className="flex flex-col lg:grid lg:grid-cols-[568px_auto] gap-12">
            <div className="flex flex-col order-1 gap-9">
              <PoolHeader pair={pair} prices={prices} />
              {/* uses chainid, swapfee, apr, incentivesapr */}
              <hr className="my-3 border-t border-stone-200/5" />
              <PoolChart pair={pair} />
              {/* uses snapshots and swapfees */}
              <AppearOnMount>
                <PoolStats pair={pair} prices={prices} />
                {/* liquidityusd, volume1d, swapfee  */}
              </AppearOnMount>
              <PoolComposition pair={pair} prices={prices} />
              {/* uses token0 token1 reserve0 reserve1 */}
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
