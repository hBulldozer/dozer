import { BreadcrumbLink } from '@dozer/ui'
import { GetStaticPaths, GetStaticProps } from 'next'
import { useRouter } from 'next/router'
import { Pair, pairFromPoolMerged, pairFromPoolMergedWithSnaps } from '@dozer/api'

import { Layout } from 'components/Layout'
import { TokenHeader } from 'components'

import { formatPercent } from '@dozer/format'
import { generateSSGHelper } from '@dozer/api/src/helpers/ssgHelper'
import { api } from '../../../utils/api'
import { TokenChart } from '../../../components/TokenPage/TokenChart'
import { SwapWidget } from 'pages/swap'

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

  return (
    <>
      <Layout breadcrumbs={LINKS({ pair })}>
        <div className="flex flex-col lg:grid lg:grid-cols-[568px_auto] gap-12">
          <div className="flex flex-col order-1 gap-9">
            <TokenChart pair={pair} />
          </div>
          <div className="flex flex-col order-2 gap-4">
            <SwapWidget token0_idx={tokens[0]} token1_idx={tokens[1]} />
          </div>
        </div>
      </Layout>
    </>
  )
}

export default Token
