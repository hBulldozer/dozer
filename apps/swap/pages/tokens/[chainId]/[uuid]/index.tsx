import { AppearOnMount, BreadcrumbLink, Button, Dialog, LoadingOverlay, Typography } from '@dozer/ui'
import { GetStaticPaths, GetStaticProps } from 'next'
import { useRouter } from 'next/router'
import { AllTokensDBOutput, Pair } from '@dozer/api'

import { Layout } from 'components/Layout'

import { generateSSGHelper } from '@dozer/api/src/helpers/ssgHelper'
import { api } from '../../../../utils/api'
import { TokenChart } from '../../../../components/TokenPage/TokenChart'
import { SwapWidget } from 'pages'
import { Fragment, useState } from 'react'
import { TokenStats } from 'components/TokenPage/TokenStats'
import ReadMore from '@dozer/ui/readmore/ReadMore'
import { dbToken } from 'interfaces'
import { daySnapshot, hourSnapshot } from '@dozer/database'
import { ChainId } from '@dozer/chain'
import BlockTracker from '@dozer/higmi/components/BlockTracker/BlockTracker'

export const config = {
  maxDuration: 60,
}
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

  const ssg = generateSSGHelper()
  const pools = await ssg.getPools.all.fetch()

  const USDT_token = await ssg.getTokens.bySymbol.fetch({ symbol: 'USDT' })
  if (!USDT_token) {
    throw new Error(`Failed to fetch USDT Token`)
  }
  const UUID_USDT = USDT_token.uuid
  const HTR_USDT_pool = pools.find(
    (pool) =>
      (pool.token0.uuid == '00' && pool.token1.uuid == UUID_USDT) ||
      (pool.token1.uuid == '00' && pool.token0.uuid == UUID_USDT)
  )

  if (!HTR_USDT_pool) {
    throw new Error(`Failed to fetch HTR/USDT pool.`)
  }

  const pool =
    uuid == '00' || uuid == UUID_USDT
      ? HTR_USDT_pool
      : pools.find(
          (pool) =>
            (pool.token0.uuid == '00' && pool.token1.uuid == uuid) ||
            (pool.token1.uuid == '00' && pool.token0.uuid == uuid)
        )
  if (!pool) {
    throw new Error(`Failed to fetch pool, received ${pool}`)
  }

  await ssg.getTokens.bySymbol.prefetch({ symbol: 'USDT' })

  await ssg.getPools.snapsById.prefetch({ id: pool.id })
  await ssg.getPools.snapsById.prefetch({ id: HTR_USDT_pool.id })

  await ssg.getPools.allDay.prefetch()
  await ssg.getPools.all.prefetch()
  await ssg.getTokens.all.prefetch()
  await ssg.getPrices.all.prefetch()
  await ssg.getNetwork.getBestBlock.prefetch()
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
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const router = useRouter()
  const uuid = router.query.uuid as string
  const chainId = Number(router.query.chainId)
  const { data: USDT_uuid } = api.getTokens.bySymbol.useQuery({ symbol: 'USDT' })
  if (!USDT_uuid) return <></>

  const { data: prices = {} } = api.getPrices.all.useQuery()
  if (!prices) return <></>

  const { data: pools } = api.getPools.all.useQuery()
  let pair: Pair | undefined
  let pair_day: Pair | undefined
  if (!pools) return <></>
  const { data: poolsDay } = api.getPools.allDay.useQuery()
  if (!poolsDay) return <></>
  const pair_usdt_htr = pools.find((pool) => {
    return (
      (pool.token0.uuid == '00' && pool.token1.symbol == 'USDT') ||
      (pool.token1.uuid == '00' && pool.token0.symbol == 'USDT')
    )
  })
  if (!pair_usdt_htr) return <Typography>Did not found the USDT/HTR pool</Typography>

  const pair_usdt_htr_day = poolsDay.find((pool) => {
    return (
      (pool.token0.uuid == '00' && pool.token1.symbol == 'USDT') ||
      (pool.token1.uuid == '00' && pool.token0.symbol == 'USDT')
    )
  })
  if (!pair_usdt_htr_day) return <Typography>Did not found the USDT/HTR pool</Typography>

  if (uuid == USDT_uuid?.uuid) {
    const pairs_usdt: Pair[] = pools
      .filter((pool) => pool.chainId == chainId)
      .filter((pool) => pool.token0.symbol == 'USDT' || pool.token1.symbol == 'USDT')
      .map((pool) => {
        const pair = pool ? pool : ({} as Pair)
        return pair
      })
    const { data: snaps_usdt_htr } = api.getPools.snapsById.useQuery({ id: pair_usdt_htr.id })
    if (!snaps_usdt_htr) return <></>

    const pairs_usdt_day: Pair[] = poolsDay
      .filter((pool) => pool.chainId == chainId)
      .filter((pool) => pool.token0.symbol == 'USDT' || pool.token1.symbol == 'USDT')
      .map((pool) => {
        const pair = pool ? pool : ({} as Pair)
        return pair
      })

    pair = {
      id: chainId == ChainId.HATHOR ? 'usdt' : 'usdt-testnet',
      name: chainId == ChainId.HATHOR ? 'USDT' : 'USDT testnet',
      liquidityUSD: pairs_usdt ? pairs_usdt.map((pair) => pair.liquidityUSD).reduce((a, b) => a + b) / 2 : 0,
      volumeUSD: pairs_usdt ? pairs_usdt.map((pair) => pair.volumeUSD).reduce((a, b) => a + b) : 0,
      feeUSD: pairs_usdt ? pairs_usdt.map((pair) => pair.feeUSD).reduce((a, b) => a + b) : 0,
      swapFee: pairs_usdt[0].swapFee,
      apr: 0,
      token0: pair_usdt_htr.token0.uuid == '00' ? pair_usdt_htr.token0 : pair_usdt_htr.token1,
      token1: pair_usdt_htr.token0.uuid == '00' ? pair_usdt_htr.token1 : pair_usdt_htr.token0,
      chainId: chainId,
      reserve0: pair_usdt_htr.reserve0,
      reserve1: pair_usdt_htr.reserve1,
      liquidity: pairs_usdt ? pairs_usdt.map((pair) => pair.liquidity).reduce((a, b) => a + b) / 2 : 0,
      volume1d: pairs_usdt ? pairs_usdt.map((pair) => pair.volume1d).reduce((a, b) => a + b) : 0,
      fees1d: pairs_usdt ? pairs_usdt.map((pair) => pair.fees1d).reduce((a, b) => a + b) : 0,
      hourSnapshots: snaps_usdt_htr ? snaps_usdt_htr.hourSnapshots : ([] as Array<hourSnapshot>),
      daySnapshots: snaps_usdt_htr ? snaps_usdt_htr.daySnapshots : ([] as Array<daySnapshot>),
    }

    pair_day = {
      id: chainId == ChainId.HATHOR ? 'usdt' : 'usdt-testnet',
      name: chainId == ChainId.HATHOR ? 'USDT' : 'USDT testnet',
      liquidityUSD: pairs_usdt_day ? pairs_usdt_day.map((pair) => pair.liquidityUSD).reduce((a, b) => a + b) / 2 : 0,
      volumeUSD: pairs_usdt_day ? pairs_usdt_day.map((pair) => pair.volumeUSD).reduce((a, b) => a + b) : 0,
      feeUSD: pairs_usdt_day ? pairs_usdt_day.map((pair) => pair.feeUSD).reduce((a, b) => a + b) : 0,
      swapFee: pairs_usdt_day[0].swapFee,
      apr: 0,
      token0: pairs_usdt_day[0].token0.symbol == 'USDT' ? pairs_usdt_day[0].token0 : pairs_usdt_day[0].token1,
      token1: pairs_usdt_day[0].token0.symbol == 'USDT' ? pairs_usdt_day[0].token1 : pairs_usdt_day[0].token0,
      chainId: chainId,
      reserve0: 0,
      reserve1: 0,
      liquidity: pairs_usdt_day ? pairs_usdt_day.map((pair) => pair.liquidity).reduce((a, b) => a + b) / 2 : 0,
      volume1d: pairs_usdt_day ? pairs_usdt_day.map((pair) => pair.volume1d).reduce((a, b) => a + b) : 0,
      fees1d: pairs_usdt_day ? pairs_usdt_day.map((pair) => pair.fees1d).reduce((a, b) => a + b) : 0,
      hourSnapshots: snaps_usdt_htr ? snaps_usdt_htr.hourSnapshots : ([] as Array<hourSnapshot>),
      daySnapshots: snaps_usdt_htr ? snaps_usdt_htr.daySnapshots : ([] as Array<daySnapshot>),
    }
  } else if (uuid == '00') {
    const pairs_htr: Pair[] = pools
      .filter((pool) => pool.chainId == chainId)
      .filter((pool) => pool.token0.uuid == '00' || pool.token1.uuid == '00')
      .map((pool) => {
        const pair = pool ? pool : ({} as Pair)
        return pair
      })
    const { data: snaps_usdt_htr } = api.getPools.snapsById.useQuery({ id: pair_usdt_htr.id })
    if (!snaps_usdt_htr) return <></>

    const pairs_htr_day: Pair[] = poolsDay
      .filter((pool) => pool.chainId == chainId)
      .filter((pool) => pool.token0.uuid == '00' || pool.token1.uuid == '00')
      .map((pool) => {
        const pair = pool ? pool : ({} as Pair)
        return pair
      })

    pair = {
      id: chainId == ChainId.HATHOR ? 'native' : 'native-testnet',
      name: chainId == ChainId.HATHOR ? 'HTR' : 'HTR testnet',
      liquidityUSD: pairs_htr ? pairs_htr.map((pair) => pair.liquidityUSD).reduce((a, b) => a + b) / 2 : 0,
      volumeUSD: pairs_htr ? pairs_htr.map((pair) => pair.volumeUSD).reduce((a, b) => a + b) : 0,
      feeUSD: pairs_htr ? pairs_htr.map((pair) => pair.feeUSD).reduce((a, b) => a + b) : 0,
      swapFee: pairs_htr[0].swapFee,
      apr: 0,
      token0: pair_usdt_htr.token0.uuid == '00' ? pair_usdt_htr.token0 : pair_usdt_htr.token1,
      token1: pair_usdt_htr.token0.uuid == '00' ? pair_usdt_htr.token1 : pair_usdt_htr.token0,
      chainId: chainId,
      reserve0: pair_usdt_htr.reserve0,
      reserve1: pair_usdt_htr.reserve1,
      liquidity: pairs_htr ? pairs_htr.map((pair) => pair.liquidity).reduce((a, b) => a + b) / 2 : 0,
      volume1d: pairs_htr ? pairs_htr.map((pair) => pair.volume1d).reduce((a, b) => a + b) : 0,
      fees1d: pairs_htr ? pairs_htr.map((pair) => pair.fees1d).reduce((a, b) => a + b) : 0,
      hourSnapshots: snaps_usdt_htr ? snaps_usdt_htr.hourSnapshots : ([] as Array<hourSnapshot>),
      daySnapshots: snaps_usdt_htr ? snaps_usdt_htr.daySnapshots : ([] as Array<daySnapshot>),
    }

    pair_day = {
      id: chainId == ChainId.HATHOR ? 'native' : 'native-testnet',
      name: chainId == ChainId.HATHOR ? 'HTR' : 'HTR testnet',
      liquidityUSD: pairs_htr_day ? pairs_htr_day.map((pair) => pair.liquidityUSD).reduce((a, b) => a + b) / 2 : 0,
      volumeUSD: pairs_htr_day ? pairs_htr_day.map((pair) => pair.volumeUSD).reduce((a, b) => a + b) : 0,
      feeUSD: pairs_htr_day ? pairs_htr_day.map((pair) => pair.feeUSD).reduce((a, b) => a + b) : 0,
      swapFee: pairs_htr_day[0].swapFee,
      apr: 0,
      token0: pairs_htr_day[0].token0.uuid == '00' ? pairs_htr_day[0].token0 : pairs_htr_day[0].token1,
      token1: pairs_htr_day[0].token0.uuid == '00' ? pairs_htr_day[0].token1 : pairs_htr_day[0].token0,
      chainId: chainId,
      reserve0: 0,
      reserve1: 0,
      liquidity: pairs_htr_day ? pairs_htr_day.map((pair) => pair.liquidity).reduce((a, b) => a + b) / 2 : 0,
      volume1d: pairs_htr_day ? pairs_htr_day.map((pair) => pair.volume1d).reduce((a, b) => a + b) : 0,
      fees1d: pairs_htr_day ? pairs_htr_day.map((pair) => pair.fees1d).reduce((a, b) => a + b) : 0,
      hourSnapshots: snaps_usdt_htr ? snaps_usdt_htr.hourSnapshots : ([] as Array<hourSnapshot>),
      daySnapshots: snaps_usdt_htr ? snaps_usdt_htr.daySnapshots : ([] as Array<daySnapshot>),
    }
  } else {
    pair = pools.find(
      (pool) =>
        (pool.token0.uuid == '00' && pool.token1.uuid == uuid) || (pool.token1.uuid == '00' && pool.token0.uuid == uuid)
    )
    if (!pair) return <></>

    pair_day = poolsDay.find(
      (pool) =>
        (pool.token0.uuid == '00' && pool.token1.uuid == uuid) || (pool.token1.uuid == '00' && pool.token0.uuid == uuid)
    )
    if (!pair_day) return <></>
    const { data: snaps } = api.getPools.snapsById.useQuery({ id: pair.id })
    if (!snaps) return <></>

    pair.daySnapshots = snaps ? snaps.daySnapshots : ([] as Array<daySnapshot>)
    pair.hourSnapshots = snaps ? snaps.hourSnapshots : ([] as Array<hourSnapshot>)
  }
  if (!pair) return <></>

  const tokens = pair ? ([pair.token0, pair.token1] as dbToken[]) : []
  if (!tokens) return <></>

  // eslint-disable-next-line react-hooks/rules-of-hooks
  return (
    <>
      <Layout breadcrumbs={LINKS({ pair })}>
        <LoadingOverlay show={!prices || !pools || !poolsDay || !tokens || !pair || !pair_day} />
        <BlockTracker client={api} />
        <div className="flex flex-col lg:grid lg:grid-cols-[568px_auto] gap-12">
          <div className="flex flex-col order-1 gap-6">
            <TokenChart pair={pair} setIsDialogOpen={setIsDialogOpen} />
            {/* About */}
            <div className="flex flex-col gap-4">
              <Typography weight={500} variant="h1">
                Stats
              </Typography>
              <TokenStats pair={pair_day} prices={prices} />
              <Typography weight={500} className="flex flex-col " variant="h2">
                About
              </Typography>
              <ReadMore
                text={
                  uuid == '00' && tokens[0].uuid == '00'
                    ? tokens[0].about
                    : tokens[0].uuid == '00'
                    ? tokens[1].about
                    : tokens[0].about
                }
              />
            </div>
          </div>
          <div className="flex-col order-2 hidden gap-4 lg:flex">
            <AppearOnMount>
              <SwapWidget token0_idx={tokens[0].id} token1_idx={tokens[1].id} />
            </AppearOnMount>
          </div>
        </div>
        <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
          <Dialog.Content>
            <Dialog.Header title="Community Token Image" onClose={() => setIsDialogOpen(false)} />
            {pair.token1.imageUrl && (
              <div className="w-full max-h-[80vh] flex items-center justify-center overflow-hidden">
                <img
                  src={pair.token1.imageUrl}
                  alt="Community Token Image"
                  className="object-contain max-w-full max-h-full"
                />
              </div>
            )}
          </Dialog.Content>
        </Dialog>
      </Layout>
      <AppearOnMount as={Fragment}>
        <div className="fixed left-0 right-0 flex justify-center lg:hidden bottom-6">
          <div>
            <div className="divide-x rounded-xl min-w-[95vw] shadow-md shadow-black/50 bg-yellow divide-stone-800">
              <Button
                size="md"
                as="a"
                href={`../../?token0=${pair.token0.uuid}&token1=${pair.token1.uuid}&chainId=${pair.chainId}`}
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
