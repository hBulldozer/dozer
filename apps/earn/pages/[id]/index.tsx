import { AppearOnMount, BreadcrumbLink, LoadingOverlay } from '@dozer/ui'
import { GetStaticPaths, GetStaticProps } from 'next'
import { useRouter } from 'next/router'
import { Pair } from '@dozer/api'
import { PoolChart } from '../../components/PoolSection/PoolChart'
import TransactionHistory from '../../components/TransactionHistory/TransactionHistory'

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
import BlockTracker from '@dozer/higmi/components/BlockTracker/BlockTracker'

export const config = {
  maxDuration: 60,
}

export const getStaticPaths: GetStaticPaths = async () => {
  const ssg = generateSSGHelper()
  const pools = await ssg.getPools.all.fetch()

  if (!pools) {
    throw new Error(`Failed to fetch pool, received ${pools}`)
  }
  // Get the paths we want to pre-render based on pairs
  const paths = pools?.map((pool: any) => ({
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
  const pool = pools.find((pool: any) => pool.id === id)
  if (!pool) {
    throw new Error(`Failed to find pool with id ${id}`)
  }

  await ssg.getPools.all.prefetch()
  await ssg.getPrices.allUSD.prefetch()
  await ssg.getPools.transactionHistory.prefetch({ poolKey: pool.id })

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
    label: `${pair.name}`,
  },
]

const Pool = () => {
  const router = useRouter()
  if (router.isFallback) {
    return <div>Loading...</div>
  }

  const id = router.query.id as string

  const { data: initialPrices = {} } = api.getPrices.allUSD.useQuery(undefined, {
    suspense: false,
    refetchOnMount: false,
    staleTime: 30000,
  })
  const { data: initialPools } = api.getPools.all.useQuery(undefined, {
    suspense: false,
    refetchOnMount: false,
    staleTime: 30000,
  })

  const initialPair = initialPools?.find((pool: any) => pool.id === id)
  const tokens = initialPair ? [initialPair.token0, initialPair.token1] : []

  const { data: detailedPrices = {}, isLoading: isLoadingPrices } = api.getPrices.allUSD.useQuery(undefined, {
    staleTime: 30000,
    enabled: !!initialPrices,
  })
  const { data: detailedPools, isLoading: isLoadingPools } = api.getPools.all.useQuery(undefined, {
    staleTime: 30000,
    enabled: !!initialPools,
  })

  const detailedPair = detailedPools?.find((pool: any) => pool.id === id)

  const isLoadingDetailed = isLoadingPrices || isLoadingPools

  const prices = detailedPrices || initialPrices || {}
  const pair = detailedPair || initialPair

  // Show loading overlay instead of early returns
  const isLoading = !initialPrices || !initialPools || !initialPair || !tokens.length || !pair

  if (isLoading) {
    return (
      <Layout breadcrumbs={[]}>
        <LoadingOverlay show={true} />
      </Layout>
    )
  }

  return (
    <PoolPositionProvider pair={pair} prices={prices}>
      <>
        <Layout breadcrumbs={LINKS({ pair })}>
          <div className="flex flex-col lg:grid lg:grid-cols-[568px_auto] gap-12">
            <div className="flex flex-col order-1 gap-9">
              <PoolHeader pair={pair} prices={prices} isLoading={isLoadingDetailed} />
              <hr className="my-3 border-t border-stone-200/5" />
              {/* TODO: Re-enable once history data access is refined */}
              {/* <PoolChart pair={pair} /> */}
              <AppearOnMount>
                <PoolStats pair={pair} prices={prices} />
              </AppearOnMount>

              {/* TODO: Re-enable once history data access is refined */}
              {/* <AppearOnMount>
                <TransactionHistory pair={pair} />
              </AppearOnMount> */}
            </div>

            <div className="flex flex-col order-2 gap-4">
              <AppearOnMount>
                <div className="flex flex-col gap-10">
                  <PoolComposition pair={pair} prices={prices} isLoading={isLoadingDetailed} />
                  <PoolPosition pair={pair} isLoading={isLoadingDetailed} />
                </div>
              </AppearOnMount>
              <div className="hidden lg:flex">
                <PoolButtons pair={pair} />
              </div>
            </div>
          </div>
          <BlockTracker client={api} />
        </Layout>
        <PoolActionBar pair={pair} />
      </>
    </PoolPositionProvider>
  )
}

export default Pool
