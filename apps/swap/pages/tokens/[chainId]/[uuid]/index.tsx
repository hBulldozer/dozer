import { AppearOnMount, BreadcrumbLink, Button, Typography } from '@dozer/ui'
import { GetStaticPaths, GetStaticProps } from 'next'
import { useRouter } from 'next/router'
import { AllTokensWithoutLPDBOutput, Pair, pairFromPoolMergedWithSnaps } from '@dozer/api'

import { Layout } from 'components/Layout'

import { generateSSGHelper } from '@dozer/api/src/helpers/ssgHelper'
import { api } from '../../../../utils/api'
import { TokenChart } from '../../../../components/TokenPage/TokenChart'
import { SwapWidget } from 'pages'
import { Fragment } from 'react'
import { TokenStats } from 'components/TokenPage/TokenStats'
import TokenDetails from 'components/TokenPage/TokenDetails'

const about =
  'Cathor is the original Hathor Network community coin. Minted in February 2021 by the CEO of Hathor for the community, Cathor’s mission is to support and grow awareness for the Hathor Network and projects building on Hathor'
const tokenLinks = [
  { name: 'Explorer', href: 'https://explorer.example.com' },
  { name: 'Website', href: 'https://www.example.com' },
  { name: 'Twitter', href: 'https://twitter.com/example' },
]
export const getStaticPaths: GetStaticPaths = async () => {
  const ssg = generateSSGHelper()
  const tokens = await ssg.getTokens.allWithoutLP.fetch()

  if (!tokens) {
    throw new Error(`Failed to fetch pool, received ${tokens}`)
  }
  // Get the paths we want to pre-render based on pairs
  const paths = tokens?.map((token: AllTokensWithoutLPDBOutput) => ({
    params: { chainId: `${token.chainId}`, uuid: `${token.uuid}` },
  }))

  // We'll pre-render only these paths at build time.
  // { fallback: blocking } will server-render pages
  // on-demand if the path doesn't exist.
  return { paths, fallback: 'blocking' }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const uuid = params?.uuid as string
  const chainId = Number(params?.chainId)
  const ssg = generateSSGHelper()
  const poolDB = await ssg.getPools.byTokenUuid.fetch({ uuid, chainId })
  if (!poolDB) {
    throw new Error(`Failed to fetch pool, received ${poolDB}`)
  }
  const poolNC = await ssg.getPools.byIdFromContract.fetch({ id: poolDB.id })
  if (!poolNC) {
    throw new Error(`Failed to fetch pool, received ${poolNC}`)
  }

  await ssg.getPools.byTokenUuidWithSnaps.prefetch({ uuid, chainId })
  await ssg.getPools.byIdFromContract.prefetch({ id: poolDB.id })
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
    label: `${pair.id.includes('native') ? 'Hathor' : pair.token0.uuid == '00' ? pair.token1.name : pair.token0.name}`,
  },
]

const Token = () => {
  const router = useRouter()
  const uuid = router.query.uuid as string
  const chainId = Number(router.query.chainId)

  const { data: prices = {} } = api.getPrices.all.useQuery()
  if (!prices) return <></>

  const { data: poolDB } = api.getPools.byTokenUuidWithSnaps.useQuery({ uuid, chainId })

  if (!poolDB) return <></>
  const { data: poolNC } = api.getPools.byIdFromContract.useQuery({ id: poolDB.id })

  if (!poolNC) return <></>
  const pair = poolDB && poolNC ? pairFromPoolMergedWithSnaps(poolDB, poolNC) : ({} as Pair)
  if (!pair) return <></>
  if (uuid == '00') pair.id = 'native'
  const tokens = pair ? [pair.token0, pair.token1] : []
  if (!tokens) return <></>

  // eslint-disable-next-line react-hooks/rules-of-hooks
  return (
    <>
      <Layout maxWidth="6xl" breadcrumbs={LINKS({ pair })}>
        <div className="flex flex-col lg:grid lg:grid-cols-[700px_auto] gap-12">
          <div className="flex flex-col order-1 gap-4">
            <TokenChart pair={pair} />
            {/* About */}
            <Typography weight={500} variant="h2">
              Stats
            </Typography>
            <TokenStats pair={pair} prices={prices} />
            <TokenDetails about={about} tokenLinks={tokenLinks} />
          </div>
          <div className="flex-col order-2 hidden gap-4 lg:flex">
            <AppearOnMount>
              <SwapWidget token0_idx={0} token1_idx={1} />
            </AppearOnMount>
          </div>
        </div>
      </Layout>
      <AppearOnMount as={Fragment}>
        <div className="fixed left-0 right-0 flex justify-center lg:hidden bottom-6">
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
