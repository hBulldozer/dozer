import { AppearOnMount, BreadcrumbLink, Button, Typography } from '@dozer/ui'
import { GetStaticPaths, GetStaticProps } from 'next'
import { useRouter } from 'next/router'
import { AllTokensDBOutput, Pair } from '@dozer/api'

import { Layout } from 'components/Layout'

import { generateSSGHelper } from '@dozer/api/src/helpers/ssgHelper'
import { api } from '../../../../utils/api'
import { TokenChart } from '../../../../components/TokenPage/TokenChart'
import { SwapWidget } from 'pages'
import { Fragment } from 'react'
import { TokenStats } from 'components/TokenPage/TokenStats'

export const getStaticPaths: GetStaticPaths = async () => {
  const ssg = generateSSGHelper()
  const tokens = await ssg.getTokens.all.fetch()

  if (!tokens) {
    throw new Error(`Failed to fetch pool, received ${tokens}`)
  }
  // Get the paths we want to pre-render based on pairs
  const paths = tokens?.map((token: AllTokensDBOutput) => ({
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
  const pools = await ssg.getPools.all.fetch()
  const pool =
    uuid == '00'
      ? pools.find((pool) => pool.token0.uuid == '00')
      : pools.find(
          (pool) =>
            (pool.token0.uuid == '00' && pool.token1.uuid == uuid) ||
            (pool.token1.uuid == '00' && pool.token0.uuid == uuid)
        )
  if (!pool) {
    throw new Error(`Failed to fetch pool, received ${pool}`)
  }

  await ssg.getPrices.htrKline.prefetch({
    size: pool.hourSnapshots.length,
    period: 0,
  })
  await ssg.getPrices.htrKline.prefetch({
    size: pool.hourSnapshots.length,
    period: 1,
  })
  await ssg.getPrices.htrKline.prefetch({
    size: pool.hourSnapshots.length,
    period: 2,
  })

  await ssg.getPrices.htrKline.prefetch({
    size: pool.daySnapshots.length,
    period: 0,
  })
  await ssg.getPrices.htrKline.prefetch({
    size: pool.daySnapshots.length,
    period: 1,
  })
  await ssg.getPrices.htrKline.prefetch({
    size: pool.daySnapshots.length,
    period: 2,
  })

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

  const { data: pools } = api.getPools.all.useQuery()
  if (!pools) return <></>
  const pair = pools.find(
    (pool) =>
      (pool.token0.uuid == '00' && pool.token1.uuid == uuid) || (pool.token1.uuid == '00' && pool.token0.uuid == uuid)
  )
  if (!pair) return <></>
  if (uuid == '00') pair.id = 'native'
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
            <div className="flex flex-col gap-4">
              <Typography weight={500} variant="h1">
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
