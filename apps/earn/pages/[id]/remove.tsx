import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/solid'
import { formatPercent } from '@dozer/format'
import { Pair } from '@dozer/api'
import { AppearOnMount, BreadcrumbLink, Container, Link, Typography } from '@dozer/ui'

import { AddSectionMyPosition, Layout, RemoveSectionLegacy } from '../../components'

import { GetStaticPaths, GetStaticProps, NextPage } from 'next'
import { useRouter } from 'next/router'
import { PoolPositionProvider } from '../../components/PoolPositionProvider'
import { RouterOutputs } from '@dozer/api'
import { api } from '../../utils/api'
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
    href: `/${(pool as any).symbolId || pool.id}/remove`,
    label: `Remove Liquidity`,
  },
]

const Remove: NextPage = () => {
  const router = useRouter()
  const id = router.query.id as string

  // Detect if ID is symbol-based (e.g., "HTR-DZR-3") or pool key (e.g., "00/abc123/30")
  const isSymbolId = id && id.includes('-') && !id.includes('/')

  // Use appropriate query based on ID format
  const { data: poolFromSymbol } = api.getPools.bySymbolId.useQuery({ symbolId: id }, { enabled: Boolean(isSymbolId) })
  const { data: pools } = api.getPools.all.useQuery(undefined, { enabled: !Boolean(isSymbolId) })
  const { data: prices = {} } = api.getPrices.allUSD.useQuery()

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
      token0: new Token(pair.token0),
      token1: new Token(pair.token1),
    }
  }, [pair])

  if (!prices || !pair || !memoizedPair) return <></>

  return (
    <PoolPositionProvider pair={memoizedPair as Pair} prices={prices}>
      <Layout breadcrumbs={LINKS(pair)}>
        <BlockTracker client={api} />
        <div className="grid grid-cols-1 sm:grid-cols-[340px_auto] md:grid-cols-[auto_396px_264px] gap-10">
          <div className="hidden md:block" />
          <div className="flex flex-col order-3 gap-3 pb-40 sm:order-2">
            <RemoveSectionLegacy pair={memoizedPair as Pair} prices={prices} />
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
    </PoolPositionProvider>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const ssg = generateSSGHelper()
  const pools = await ssg.getPools.all.fetch()

  if (!pools) {
    throw new Error(`Failed to fetch pool, received ${pools}`)
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
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const id = params?.id as string
  const ssg = generateSSGHelper()

  // Detect if ID is symbol-based or pool key
  const isSymbolId = id && id.includes('-') && !id.includes('/')

  let pool
  if (isSymbolId) {
    // Fetch pool by symbol ID
    try {
      pool = await ssg.getPools.bySymbolId.fetch({ symbolId: id })
    } catch (error) {
      console.error(`Failed to fetch pool by symbol ID ${id}:`, error)
      throw new Error(`Failed to find pool with symbol ID ${id}`)
    }
  } else {
    // Fetch all pools and find by pool key
    const pools = await ssg.getPools.all.fetch()
    if (!pools) {
      throw new Error(`Failed to fetch pools, received ${pools}`)
    }
    pool = pools.find((pool) => pool.id === id)
  }

  if (!pool) {
    throw new Error(`Failed to find pool with id ${id}`)
  }

  const tokens = [pool.token0, pool.token1]
  await ssg.getTokens.all.prefetch()
  await ssg.getPrices.allUSD.prefetch()

  // Only prefetch all pools if we're not using symbol ID
  if (!isSymbolId) {
    await ssg.getPools.all.prefetch()
  }

  return {
    props: {
      trpcState: ssg.dehydrate(),
    },
    revalidate: 3600,
  }
}

export default Remove
