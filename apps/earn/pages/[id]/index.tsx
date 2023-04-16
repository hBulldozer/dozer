import { ChainId, chainName } from '@dozer/chain'
import { formatPercent } from '@dozer/format'
// import { getBuiltGraphSDK, Pair } from '@dozer/graph-client'
import { AppearOnMount, BreadcrumbLink } from '@dozer/ui'
// import { SUPPORTED_CHAIN_IDS } from '../../config'
import {
  GetServerSideProps,
  GetStaticPaths,
  GetStaticProps,
  InferGetServerSidePropsType,
  InferGetStaticPropsType,
} from 'next'
import { useRouter } from 'next/router'
import { FC } from 'react'
// import useSWR, { SWRConfig } from 'swr'
import { Pair, pairFromPoolAndTokens } from '../../utils/Pair'
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

import { prisma } from '@dozer/database'
import { dbPool, dbToken } from '../../interfaces'

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const pre_pool = await prisma.pool.findUnique({
    where: { id: query.id?.toString() },
    include: { hourSnapshots: { orderBy: { date: 'desc' } }, daySnapshots: { orderBy: { date: 'desc' } } },
  })
  const pools = await prisma.pool.findMany()
  const tokens = await prisma.token.findMany()
  const pair: Pair = pairFromPoolAndTokens(pre_pool, tokens)
  const res = await fetch('https://api.kucoin.com/api/v1/prices?currencies=HTR')
  const data = await res.json()
  const priceHTR = Number(data.data.HTR)
  const prices_arr: number[] = tokens.map((token) => {
    let uuid0, uuid1
    const pool = pools.find((pool: dbPool) => {
      uuid0 = tokens.find((token_in: dbToken) => {
        return token_in.id === pool.token0Id
      })?.uuid
      uuid1 = tokens.find((token_in: dbToken) => {
        return token_in.id === pool.token1Id
      })?.uuid
      return (uuid0 == '00' && token.uuid == uuid1) || (uuid1 == '00' && token.uuid == uuid0)
    })
    return pool && uuid0 == '00' && token.uuid == uuid1
      ? priceHTR * (Number(pool.reserve0) / (Number(pool.reserve1) + 1000))
      : pool && uuid1 == '00' && token.uuid == uuid0
      ? priceHTR * (Number(pool.reserve1) / (Number(pool.reserve0) + 1000))
      : 0
  })

  const tokens_uuid_arr: string[] = tokens.map((token: dbToken) => {
    return token.uuid
  })

  const prices: { [key: string]: number } = {}
  tokens_uuid_arr.forEach((element, index) => {
    element == '00' ? (prices[element] = priceHTR) : (prices[element] = prices_arr[index])
  })

  return { props: { pair, prices } }
}

const LINKS = ({ pair }: { pair: Pair }): BreadcrumbLink[] => [
  {
    href: `/${pair.id}`,
    label: `${pair.name}`,
  },
]

// const Pool: FC<InferGetStaticPropsType<typeof getStaticProps>> = ({ fallback }) => {
//   return (
//     <SWRConfig value={{ fallback }}>
//       <_Pool />
//     </SWRConfig>
//   )
// }

const Pool = ({ pair, prices }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter()
  //console.log(pair.hourSnapshots, pair.daySnapshots)
  // const { data } = useSWR<{ pair: Pair }>(`/earn/api/pool/${router.query.id}`, (url) =>
  //   fetch(url).then((response) => response.json())
  // )
  // if (!data) return <></>
  // const { pair } = data

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
              <PoolStats pair={pair} />
            </AppearOnMount>
            <PoolComposition pair={pair} />
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
