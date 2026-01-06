import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/solid'
import { formatPercent } from '@dozer/format'
import { Pair } from '@dozer/api'
import { AppearOnMount, BreadcrumbLink, Container, Link, Typography } from '@dozer/ui'
import { GetStaticPaths, GetStaticProps, NextPage } from 'next'
import { useRouter } from 'next/router'

import { AddSectionMyPosition, Layout } from '../../components'
import { AddSectionCombined } from '../../components/AddSection/AddSectionCombined'

import { RouterOutputs, api } from '../../utils/api'
import { generateSSGHelper } from '@dozer/api/src/helpers/ssgHelper'
import BlockTracker from '@dozer/higmi/components/BlockTracker/BlockTracker'
import { useMemo } from 'react'
import { Token } from '@dozer/currency'

type PoolsOutputArray = RouterOutputs['getPools']['all']

type ElementType<T> = T extends (infer U)[] ? U : never
type PoolsOutput = ElementType<PoolsOutputArray>

const LINKS = (pool: PoolsOutput): BreadcrumbLink[] => [
  {
    href: `/${(pool as any).symbolId || pool.id}`,
    label: `${pool.name}`,
  },
  {
    href: `/${(pool as any).symbolId || pool.id}/add`,
    label: `Add Liquidity`,
  },
]

const Add: NextPage = () => {
  const router = useRouter()
  const id = router.query.id as string

  // Detect if ID is symbol-based (e.g., "HTR-DZR-3") or pool key (e.g., "00/abc123/30")
  const isSymbolId = id && id.includes('-') && !id.includes('/')

  // Use appropriate query based on ID format
  const { data: poolFromSymbol } = api.getPools.bySymbolId.useQuery({ symbolId: id }, { enabled: Boolean(isSymbolId) })
  const { data: pools } = api.getPools.all.useQuery(undefined, { enabled: !Boolean(isSymbolId) })
  const { data: prices = {} } = api.getPrices.all.useQuery()

  const pair = useMemo(() => {
    if (isSymbolId) {
      return poolFromSymbol || null
    }
    if (!pools) return null
    return pools.find((pool) => pool.id === id)
  }, [pools, poolFromSymbol, id, isSymbolId])

  const memoizedPair = useMemo(() => {
    if (!pair) return null
    return {
      ...pair,
      token0: new Token({ ...pair.token0, imageUrl: pair.token0.imageUrl ?? undefined }),
      token1: new Token({ ...pair.token1, imageUrl: pair.token1.imageUrl ?? undefined }),
    }
  }, [pair])

  if (!prices || !pair || !memoizedPair) return <></>

  return (
    // <PoolPositionProvider pair={pair}>
    <>
      {/* <PoolPositionStakedProvider pair={pair}> */}
      <Layout breadcrumbs={LINKS(pair)}>
        <BlockTracker client={api} />
        <div className="grid grid-cols-1 sm:grid-cols-[340px_auto] md:grid-cols-[auto_396px_264px] gap-10">
          <div className="hidden md:block" />
          <div className="flex flex-col order-3 gap-3 pb-40 sm:order-2">
            <AddSectionCombined pool={memoizedPair as Pair} prices={prices} />
            {/* <AddSectionStake poolAddress={pair.id} /> */}
            <Container className="flex justify-center">
              <Link.External
                href="https://docs.dozer.finance/trading-platform/liquidity-pools"
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
              <AddSectionMyPosition pair={memoizedPair as Pair} />
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
  // During build, we may hit rate limits on the public node.
  // To prevent build failures, we wrap this in a try-catch and return empty paths.
  // Pages will still be generated on-demand via fallback: 'blocking'
  try {
    const ssg = generateSSGHelper()
    const pools = await ssg.getPools.all.fetch()

    if (!pools) {
      console.warn('[getStaticPaths] Failed to fetch pools, returning empty paths')
      return { paths: [], fallback: 'blocking' }
    }

    // Generate paths for both symbol-based IDs and pool keys
    const paths = pools?.flatMap((pool) => {
      const poolPaths = [{ params: { id: `${pool.id}` } }] // Pool key format

      // Add symbol-based ID if available
      if ((pool as any).symbolId) {
        poolPaths.push({ params: { id: `${(pool as any).symbolId}` } })
      }

      return poolPaths
    })

    // We'll pre-render only these paths at build time.
    // { fallback: blocking } will server-render pages
    // on-demand if the path doesn't exist.
    return { paths, fallback: 'blocking' }
  } catch (error) {
    console.warn('[getStaticPaths] Error fetching pools during build, returning empty paths:', error)
    // Return empty paths - all pages will be generated on-demand
    return { paths: [], fallback: 'blocking' }
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const id = params?.id as string
  const ssg = generateSSGHelper()

  try {
    // Detect if ID is symbol-based or pool key
    const isSymbolId = id && id.includes('-') && !id.includes('/')

    let pool
    if (isSymbolId) {
      // Fetch pool by symbol ID
      try {
        pool = await ssg.getPools.bySymbolId.fetch({ symbolId: id })
      } catch (error) {
        console.error(`[getStaticProps] Failed to fetch pool by symbol ID ${id}:`, error)
        // Return notFound instead of throwing - allows build to succeed
        return { notFound: true, revalidate: 10 }
      }
    } else {
      // Fetch all pools and find by pool key
      const pools = await ssg.getPools.all.fetch()
      if (!pools) {
        console.error(`[getStaticProps] Failed to fetch pools for id ${id}`)
        return { notFound: true, revalidate: 10 }
      }
      pool = pools.find((pool) => pool.id === id)
    }

    if (!pool) {
      console.error(`[getStaticProps] Failed to find pool with id ${id}`)
      return { notFound: true, revalidate: 10 }
    }

    const tokens = [pool.token0, pool.token1]
    await ssg.getTokens.all.prefetch()
    await ssg.getPrices.all.prefetch()

    // Only prefetch all pools if we're not using symbol ID
    if (!isSymbolId) {
      await ssg.getPools.all.prefetch()
    }

    return {
      props: {
        trpcState: ssg.dehydrate(),
      },
      revalidate: 60,
    }
  } catch (error) {
    console.error(`[getStaticProps] Unexpected error for pool ${id}:`, error)
    // Return notFound to allow build to succeed - page will retry on next request
    return { notFound: true, revalidate: 10 }
  }
}

export default Add
