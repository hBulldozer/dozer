import { AppearOnMount, BreadcrumbLink } from '@dozer/ui'
import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next'
import { useRouter } from 'next/router'
import { Pair, pairFromPoolAndTokens, pairFromPoolAndTokensList } from '../../utils/Pair'
import { PoolChart } from '../../components/PoolSection/PoolChart'

import {
  Layout,
  PoolActionBar,
  PoolButtons,
  // PoolChart,
  PoolComposition,
  PoolHeader,
  PoolMyRewards,
  PoolPosition,
  // PoolPositionProvider,
  // PoolPositionRewardsProvider,
  // PoolPositionStakedProvider,
  PoolRewards,
  PoolStats,
} from '../../components'
// import { GET_POOL_TYPE_MAP } from '../../lib/constants'
import useSWR, { SWRConfig } from 'swr'

import { prisma } from '@dozer/database'
import { chainName } from '@dozer/chain'
import { formatPercent } from '@dozer/format'
import { FC } from 'react'

export const getStaticPaths: GetStaticPaths = async () => {
  // When this is true (in preview environments) don't
  // prerender any static pages
  // (faster builds, but slower initial page load)
  // if (process.env.SKIP_BUILD_STATIC_GENERATION === 'true') {
  //   return {
  //     paths: [],
  //     fallback: 'blocking',
  //   }
  // }
  const pre_pools = await prisma.pool.findMany({
    include: {
      token0: true,
      token1: true,
      tokenLP: true,
    },
  })
  const pairs: Pair[] = []
  pre_pools.forEach((pool) => {
    pairs?.push(pairFromPoolAndTokensList(pool))
  })

  // Get the paths we want to pre-render based on pairs
  const paths = pairs.map((pair, i) => ({
    params: { id: `${pair.id}` },
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
      tokenLP: true,
      hourSnapshots: { orderBy: { date: 'desc' } },
      daySnapshots: { orderBy: { date: 'desc' } },
    },
  })
  const pair: Pair = pairFromPoolAndTokens(pre_pool)

  if (!pair) {
    // If there is a server error, you might want to
    // throw an error instead of returning so that the cache is not updated
    // until the next successful request.
    throw new Error(`Failed to fetch pair, received ${pair}`)
  }
  const tokens = await prisma.token.findMany({
    select: {
      id: true,
      name: true,
      uuid: true,
      symbol: true,
      chainId: true,
      decimals: true,
      pools0: {
        select: {
          id: true,
          reserve0: true,
          reserve1: true,
          token1: {
            select: {
              uuid: true,
            },
          },
        },
      },
      pools1: {
        select: {
          id: true,
          reserve0: true,
          reserve1: true,
          token0: {
            select: {
              uuid: true,
            },
          },
        },
      },
    },
  })

  const resp = await fetch('https://api.kucoin.com/api/v1/prices?currencies=HTR')
  const data = await resp.json()
  const priceHTR = data.data.HTR
  const prices: { [key: string]: number | undefined } = {}

  tokens.forEach((token) => {
    if (token.uuid == '00') prices[token.uuid] = Number(priceHTR)
    else if (token.pools0.length > 0) {
      const poolHTR = token.pools0.find((pool) => {
        return pool.token1.uuid == '00'
      })
      if (!prices[token.uuid]) prices[token.uuid] = (Number(poolHTR?.reserve1) / Number(poolHTR?.reserve0)) * priceHTR
    } else if (token.pools1.length > 0) {
      const poolHTR = token.pools1.find((pool) => {
        return pool.token0.uuid == '00'
      })
      if (!prices[token.uuid]) prices[token.uuid] = (Number(poolHTR?.reserve0) / Number(poolHTR?.reserve1)) * priceHTR
    }
  })

  if (!prices) {
    // If there is a server error, you might want to
    // throw an error instead of returning so that the cache is not updated
    // until the next successful request.
    throw new Error(`Failed to fetch prices, received ${prices}`)
  }
  return {
    props: {
      fallback: {
        [`/earn/api/pair/${id}`]: { pair, prices },
      },
    },
    revalidate: 60,
  }
}

const LINKS = ({ pair }: { pair: Pair }): BreadcrumbLink[] => [
  {
    href: `/${pair.id}`,
    label: `${pair.name} - ${formatPercent(pair.swapFee / 10000)}`,
  },
]

const Pool: FC<InferGetStaticPropsType<typeof getStaticProps>> = ({ fallback }) => {
  return (
    <SWRConfig value={{ fallback }}>
      <_Pool />
    </SWRConfig>
  )
}

const _Pool = () => {
  const router = useRouter()
  const { data } = useSWR<{ pair: Pair; prices: { [key: string]: number } }>(
    `/earn/api/pair/${router.query.id}`,
    (url: string) => fetch(url).then((response) => response.json())
  )
  if (!data) return <></>
  const { pair, prices } = data

  return (
    // <PoolPositionProvider pair={pair}>
    //   <PoolPositionStakedProvider pair={pair}>
    //     <PoolPositionRewardsProvider pair={pair}>
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
    //  </PoolPositionRewardsProvider>
    //   </PoolPositionStakedProvider>
    // </PoolPositionProvider>
  )
}

// export const getStaticPaths: GetStaticPaths = async () => {
//   // When this is true (in preview environments) don't
//   // prerender any static pages
//   // (faster builds, but slower initial page load)
//   if (process.env.SKIP_BUILD_STATIC_GENERATION === 'true') {
//     return {
//       paths: [],
//       fallback: 'blocking',
//     }
//   }

//   const sdk = getBuiltGraphSDK()
//   const { pairs } = await sdk.PairsByChainIds({
//     first: 250,
//     orderBy: 'liquidityUSD',
//     orderDirection: 'desc',
//     chainIds: SUPPORTED_CHAIN_IDS,
//   })

//   // Get the paths we want to pre-render based on pairs
//   const paths = pairs
//     .sort(({ liquidityUSD: a }, { liquidityUSD: b }) => {
//       return Number(b) - Number(a)
//     })
//     .slice(0, 250)
//     .map((pair, i) => ({
//       params: { id: `${chainName[pair.chainId]}:${pair.address}` },
//     }))

//   // We'll pre-render only these paths at build time.
// { fallback: blocking } will server-render pages
//   // on-demand if the path doesn't exist.
//   return { paths, fallback: 'blocking' }
// }
//
// export const getStaticProps: GetStaticProps = async ({ params }) => {
//   const sdk = getBuiltGraphSDK()
//   const id = params?.id as string
//   const { pair } = await sdk.PairById({ id })

//   if (!pair) {
//     // If there is a server error, you might want to
//     // throw an error instead of returning so that the cache is not updated
//     // until the next successful request.
//     throw new Error(`Failed to fetch pair, received ${pair}`)
//   }

//   return {
//     props: {
//       fallback: {
//         [`/earn/api/pool/${id}`]: { pair },
//       },
//     },
//     revalidate: 60,
//   }
// }

export default Pool
