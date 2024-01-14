import { AppearOnMount, BreadcrumbLink, Button, Currency, Typography } from '@dozer/ui'
import { GetStaticPaths, GetStaticProps } from 'next'
import { useRouter } from 'next/router'
import { Pair, pairFromPoolMerged, pairFromPoolMergedWithSnaps, useTokensFromPair } from '@dozer/api'

import { Layout } from 'components/Layout'
import { TokenHeader } from 'components'

import { formatPercent } from '@dozer/format'
import { generateSSGHelper } from '@dozer/api/src/helpers/ssgHelper'
import { api } from '../../../utils/api'
import { TokenChart } from '../../../components/TokenPage/TokenChart'
import { SwapWidget } from 'pages'
import { Fragment } from 'react'
import { TokenStats } from 'components/TokenPage/TokenStats'

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
  const path_id = params?.id as string
  const id = path_id == 'native' ? '0' : path_id
  const ssg = generateSSGHelper()
  const poolDB = await ssg.getPools.byId.fetch({ id })
  if (!poolDB) {
    throw new Error(`Failed to fetch pool, received ${poolDB}`)
  }
  const poolNC = await ssg.getPools.byIdFromContract.fetch({ ncid: poolDB.ncid })
  if (!poolNC) {
    throw new Error(`Failed to fetch pool, received ${poolNC}`)
  }

  const tokens = [poolDB.token0, poolDB.token1]

  await ssg.getPools.byIdWithSnaps.prefetch({ id })
  await ssg.getPools.byIdFromContract.prefetch({ ncid: poolDB.ncid })
  await ssg.getPools.all.prefetch()
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
    href: `/tokens`,
    label: 'Tokens',
  },
  {
    href: `/${pair.id}`,
    label: `${pair.id == 'native' ? 'Hathor' : pair.token0.uuid == '00' ? pair.token1.name : pair.token0.name}`,
  },
]

const Token = () => {
  const router = useRouter()
  const pool_id = (router.query.id as string) == 'native' ? '0' : (router.query.id as string)

  const { data: prices = {} } = api.getPrices.all.useQuery()
  if (!prices) return <></>

  const { data: poolDB } = api.getPools.byIdWithSnaps.useQuery({ id: pool_id })
  if (!poolDB) return <></>
  const { data: poolNC } = api.getPools.byIdFromContract.useQuery({ ncid: poolDB.ncid })
  if (!poolNC) return <></>
  const pair = poolDB && poolNC ? pairFromPoolMergedWithSnaps(poolDB, poolNC) : ({} as Pair)
  if (!pair) return <></>
  if ((router.query.id as string) == 'native') pair.id = 'native'
  const tokens = pair ? [pair.token0, pair.token1] : []
  if (!tokens) return <></>

  // eslint-disable-next-line react-hooks/rules-of-hooks
  return (
    <>
      <Layout breadcrumbs={LINKS({ pair })}>
        <div className="flex flex-col lg:grid lg:grid-cols-[568px_auto] gap-12">
          <div className="flex flex-col order-1 gap-6">
            <TokenChart pair={pair} />
            {/* About */}
            <div className="gap-4 flex flex-col">
              <Typography weight={600} variant="h1">
                Stats
              </Typography>
              <TokenStats pair={pair} prices={prices} />
              <Typography weight={500} className="flex flex-col " variant="h2">
                About
              </Typography>
              <Typography variant="lg" weight={400} className="pb-16 md:pb-0">
                Cathor is the original Hathor Network community coin. Minted in February 2021 by the CEO of Hathor for
                the community, Cathor’s mission is to support and grow awareness for the Hathor Network and projects
                building on Hathor.
              </Typography>
            </div>
          </div>
          <div className="hidden lg:flex flex-col order-2 gap-4">
            <AppearOnMount>
              <SwapWidget token0_idx={0} token1_idx={1} />
            </AppearOnMount>
          </div>
        </div>
      </Layout>
      <AppearOnMount as={Fragment}>
        <div className="lg:hidden fixed left-0 right-0 flex justify-center bottom-6">
          <div>
            <div className="divide-x rounded-xl min-w-[95vw] shadow-md shadow-black/50 bg-yellow divide-stone-800">
              <Button
                size="md"
                as="a"
                href={`../../swap?token0=${pair.token0.uuid}&token1=${pair.token1.uuid}&chainId=${pair.chainId}`}
              >
                Swap
              </Button>
            </div>
          </div>
        </div>
      </AppearOnMount>
    </>
  )
}

export default Token
