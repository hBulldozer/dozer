import {
  AppearOnMount,
  BreadcrumbLink,
  LoadingOverlay,
  SimplePoolTransactionHistory,
  transformTransactions,
} from '@dozer/ui'
import { GetStaticPaths, GetStaticProps } from 'next'
import { useRouter } from 'next/router'
import { Pair } from '@dozer/api'
import { NewPoolChart } from '../../components/PoolSection/NewPoolChart'
// Remove old transaction history import

import {
  Layout,
  PoolActionBar,
  PoolButtons,
  PoolComposition,
  PoolHeader,
  PoolPosition,
  PoolPositionProvider,
  PoolStats,
} from '../../components'

import { generateSSGHelper } from '@dozer/api/src/helpers/ssgHelper'
import { api } from '../../utils/api'
import BlockTracker from '@dozer/higmi/components/BlockTracker/BlockTracker'
import React, { useMemo } from 'react'
import { Token } from '@dozer/currency'

export const config = {
  maxDuration: 60,
}

export const getStaticPaths: GetStaticPaths = async () => {
  const ssg = generateSSGHelper()
  const pools = await ssg.getPools.all.fetch()

  if (!pools) {
    throw new Error(`Failed to fetch pool, received ${pools}`)
  }
  // Get the paths we want to pre-render based on symbol IDs instead of pool keys
  const paths = pools?.map((pool: any) => ({
    params: { id: pool.symbolId || `${pool.id}` }, // Use symbolId if available, fallback to pool key
  }))

  // We'll pre-render only these paths at build time.
  // { fallback: blocking } will server-render pages
  // on-demand if the path doesn't exist.
  return { paths, fallback: 'blocking' }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const id = params?.id as string
  const ssg = generateSSGHelper()

  // Skip heavy prefetches in development to avoid socket hang ups
  const isDevelopment = process.env.NODE_ENV === 'development'

  // Try to determine if this is a symbol-based ID (contains hyphens) or a pool key (contains slashes)
  const isSymbolId = id.includes('-') && !id.includes('/')

  let pool: any = null

  if (isSymbolId) {
    // Try to fetch using the symbol-based ID
    try {
      pool = await ssg.getPools.bySymbolId.fetch({ symbolId: id })
    } catch (error) {
      console.error(`Failed to fetch pool with symbol ID ${id}:`, error)
      throw new Error(`Failed to find pool with symbol ID ${id}`)
    }
  } else {
    // Fallback to old method - search in all pools
    const pools = await ssg.getPools.all.fetch()
    if (!pools) {
      throw new Error(`Failed to fetch pool, received ${pools}`)
    }
    pool = pools.find((pool: any) => pool.id === id || pool.symbolId === id)
    if (!pool) {
      throw new Error(`Failed to find pool with id ${id}`)
    }
  }

  // Skip prefetching in development to avoid socket hang up issues
  if (!isDevelopment) {
    await Promise.all([
      ssg.getPools.all.prefetch(),
      ssg.getPrices.allUSD.prefetch(),
    ])
    // Prefetch transaction history separately to avoid overloading
    await ssg.getPools.getAllTransactionHistory.prefetch({ count: 20, poolFilter: pool.id })
  }

  return {
    props: {
      trpcState: ssg.dehydrate(),
    },
    revalidate: isDevelopment ? false : 3600,
  }
}

const LINKS = ({ pair }: { pair: Pair }): BreadcrumbLink[] => [
  {
    href: `/${(pair as any).symbolId || pair.id}`, // Use symbolId if available, fallback to pool key
    label: `${pair.name}`,
  },
]

// Component to handle simplified pool transaction history
const PoolTransactionHistorySection = ({ poolKey, pair }: { poolKey: string; pair: Pair }) => {
  // Fetch all transaction history (since pool filtering isn't working properly)
  const {
    data: transactionData,
    isLoading,
    error,
    refetch,
  } = api.getPools.getAllTransactionHistory.useQuery(
    {
      count: 100, // Get more to filter client-side
    },
    {
      enabled: !!poolKey,
      staleTime: 30000, // Cache for 30 seconds
      refetchOnWindowFocus: false,
    }
  )

  // Fetch USD prices for value calculation
  const { data: pricesData } = api.getPrices.allUSD.useQuery(undefined, {
    staleTime: 60000, // Cache prices for 1 minute
    refetchOnWindowFocus: false,
  })

  const handleRefresh = () => {
    refetch()
  }

  const allTransactions = transactionData?.transactions || []
  const errorMessage = error ? error.message : undefined
  const prices = pricesData || {}

  // Filter transactions for this specific pool
  const poolToken0 = pair.token0.uuid
  const poolToken1 = pair.token1.uuid

  const poolSpecificTransactions = allTransactions.filter((tx) => {
    // Filter out failed transactions (voided_by)
    if (
      tx.debug?.fullTx?.voided_by &&
      Array.isArray(tx.debug.fullTx.voided_by) &&
      tx.debug.fullTx.voided_by.length > 0
    ) {
      return false
    }

    // Filter out multi-hop transactions
    if (tx.isMultiHop) {
      return false
    }

    // Check if transaction involves both tokens of this pool
    const tokensInvolved = tx.tokensInvolved || []
    const hasToken0 = tokensInvolved.includes(poolToken0)
    const hasToken1 = tokensInvolved.includes(poolToken1)

    // For this pool, we need both tokens to be involved
    return hasToken0 && hasToken1
  })

  // Transform filtered transactions to simple format
  const simpleTransactions = transformTransactions(poolSpecificTransactions, prices)

  return (
    <SimplePoolTransactionHistory
      poolKey={poolKey}
      transactions={simpleTransactions}
      loading={isLoading}
      error={errorMessage}
      onRefresh={handleRefresh}
    />
  )
}

const Pool = () => {
  const router = useRouter()
  const id = router.query.id as string

  // Determine if this is a symbol-based ID or pool key
  const isSymbolId = id.includes('-') && !id.includes('/')

  const { data: initialPrices = {} } = api.getPrices.allUSD.useQuery(undefined, {
    suspense: false,
    refetchOnMount: false,
    staleTime: 30000,
  })

  // Fetch the specific pool by symbol ID if it's a symbol-based ID
  const { data: poolBySymbolId, isLoading: isLoadingPoolBySymbolId } = api.getPools.bySymbolId.useQuery(
    { symbolId: id },
    {
      enabled: isSymbolId,
      suspense: false,
      refetchOnMount: false,
      staleTime: 30000,
    }
  )

  // Fallback: fetch all pools to find the pool by ID (for backwards compatibility)
  const { data: initialPools, isLoading: isLoadingAllPools } = api.getPools.all.useQuery(undefined, {
    enabled: !isSymbolId,
    suspense: false,
    refetchOnMount: false,
    staleTime: 30000,
  })

  // Determine the initial pair
  const initialPair = useMemo(() => {
    if (isSymbolId) {
      return poolBySymbolId
    }
    return initialPools?.find((pool: any) => pool.id === id || pool.symbolId === id)
  }, [isSymbolId, poolBySymbolId, initialPools, id])

  const { data: detailedPrices = {}, isLoading: isLoadingPrices } = api.getPrices.allUSD.useQuery(undefined, {
    staleTime: 30000,
    enabled: !!initialPrices,
  })

  // For detailed data, we'll fetch the specific pool again or from all pools
  const { data: detailedPoolBySymbolId, isLoading: isLoadingDetailedPoolBySymbolId } = api.getPools.bySymbolId.useQuery(
    { symbolId: id },
    {
      enabled: isSymbolId && !!initialPair,
      staleTime: 30000,
    }
  )

  const { data: detailedPools, isLoading: isLoadingDetailedPools } = api.getPools.all.useQuery(undefined, {
    enabled: !isSymbolId && !!initialPair,
    staleTime: 30000,
  })

  const detailedPair = useMemo(() => {
    if (isSymbolId) {
      return detailedPoolBySymbolId
    }
    return detailedPools?.find((pool: any) => pool.id === id || pool.symbolId === id)
  }, [isSymbolId, detailedPoolBySymbolId, detailedPools, id])

  const prices = detailedPrices || initialPrices || {}
  const pair = detailedPair || initialPair

  const memoizedPair = useMemo(() => {
    if (!pair) return null
    return {
      ...pair,
      token0: new Token(pair.token0),
      token1: new Token(pair.token1),
    }
  }, [pair])

  // Show loading overlay instead of early returns
  const isLoading =
    router.isFallback ||
    isLoadingPrices ||
    (isSymbolId ? isLoadingDetailedPoolBySymbolId : isLoadingDetailedPools) ||
    !initialPrices ||
    !initialPair ||
    !pair ||
    (isSymbolId ? isLoadingPoolBySymbolId : isLoadingAllPools)

  if (isLoading || !memoizedPair) {
    return (
      <Layout breadcrumbs={[]}>
        <LoadingOverlay show={true} />
      </Layout>
    )
  }

  return (
    <PoolPositionProvider pair={memoizedPair as Pair} prices={prices}>
      <>
        <Layout breadcrumbs={LINKS({ pair: memoizedPair as Pair })}>
          <div className="flex flex-col lg:grid lg:grid-cols-[568px_auto] gap-12">
            <div className="flex flex-col order-1 gap-9">
              <PoolHeader pair={memoizedPair as Pair} prices={prices} isLoading={isLoading} />
              <hr className="my-3 border-t border-stone-200/5" />
              <NewPoolChart pair={memoizedPair as Pair} />
              <AppearOnMount>
                <PoolStats pair={memoizedPair as Pair} prices={prices} />
              </AppearOnMount>

              <AppearOnMount>
                <PoolTransactionHistorySection poolKey={(memoizedPair as Pair).id} pair={memoizedPair as Pair} />
              </AppearOnMount>
            </div>

            <div className="flex flex-col order-2 gap-4">
              <AppearOnMount>
                <div className="flex flex-col gap-10">
                  <PoolComposition pair={memoizedPair as Pair} prices={prices} isLoading={isLoading} />
                  <PoolPosition pair={memoizedPair as Pair} isLoading={isLoading} />
                </div>
              </AppearOnMount>
              <div className="hidden lg:flex">
                <PoolButtons pair={memoizedPair as Pair} />
              </div>
            </div>
          </div>
          <BlockTracker client={api} />
        </Layout>
        <PoolActionBar pair={memoizedPair as Pair} />
      </>
    </PoolPositionProvider>
  )
}

export default Pool
