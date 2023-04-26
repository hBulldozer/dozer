import { AppearOnMount, BreadcrumbLink } from '@dozer/ui'
import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next'
import { useRouter } from 'next/router'
import { Pair, pairFromPoolAndTokens } from '../../utils/Pair'
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
import useSWR, { SWRConfig } from 'swr'

import { formatPercent } from '@dozer/format'
import { FC } from 'react'
import { getPairs, getPoolWithTokensAndSnaps, getPrices } from '../../utils/api'

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
  const pairs: Pair[] = await getPairs()

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
  const pool = await getPoolWithTokensAndSnaps(id)
  const tokens = [pool.token0, pool.token1]
  const prices = await getPrices(tokens)

  const pair: Pair = pairFromPoolAndTokens(pool)

  if (!pair) {
    throw new Error(`Failed to fetch pair, received ${pair}`)
  }

  if (!tokens) {
    throw new Error(`Failed to fetch tokens, received ${tokens}`)
  }

  if (!prices) {
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
