import { ExternalLinkIcon } from '@heroicons/react/solid'
import { formatPercent } from '@dozer/format'
import { Pair, pairFromPool } from '../../utils/Pair'
import { AppearOnMount, BreadcrumbLink, Container, Link, Typography } from '@dozer/ui'

import { AddSectionMyPosition, Layout, RemoveSectionLegacy } from '../../components'

import { prisma } from '@dozer/database'
import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType, NextPage } from 'next'
import useSWR, { SWRConfig } from 'swr'
import { useRouter } from 'next/router'
import { dbPoolWithTokens } from '../../interfaces'
import { FC } from 'react'

const LINKS = ({ pool }: { pool: dbPoolWithTokens }): BreadcrumbLink[] => [
  {
    href: `/${pool.id}`,
    label: `${pool.name} - ${formatPercent(pool.swapFee / 10000)}`,
  },
  {
    href: `/${pool.id}/remove`,
    label: `Remove Liquidity`,
  },
]

const Remove: FC<InferGetStaticPropsType<typeof getStaticProps>> = ({ fallback }) => {
  return (
    <SWRConfig value={{ fallback }}>
      <_Remove />
    </SWRConfig>
  )
}

const _Remove: NextPage = () => {
  const router = useRouter()
  const { data: pre_pool } = useSWR<{ pool: dbPoolWithTokens }>(`/earn/api/pool/${router.query.id}`, (url) =>
    fetch(url).then((response) => response.json())
  )

  const { data: pre_prices } = useSWR<{ prices: { [key: string]: number } }>(`/earn/api/prices`, (url) =>
    fetch(url).then((response) => response.json())
  )
  if (!pre_pool) return <></>
  if (!pre_prices) return <></>
  const { pool } = pre_pool
  const { prices } = pre_prices

  return (
    <Layout breadcrumbs={LINKS({ pool })}>
      <div className="grid grid-cols-1 sm:grid-cols-[340px_auto] md:grid-cols-[auto_396px_264px] gap-10">
        <div className="hidden md:block" />
        <div className="flex flex-col order-3 gap-3 pb-40 sm:order-2">
          <RemoveSectionLegacy pool={pool} prices={prices} />
          <Container className="flex justify-center">
            <Link.External
              href="https://docs.dozer.finance/docs/Products/Dozer/Liquidity%20Pools"
              className="flex justify-center px-6 py-4 decoration-stone-500 hover:bg-opacity-[0.06] cursor-pointer rounded-2xl"
            >
              <Typography variant="xs" weight={500} className="flex items-center gap-1 text-stone-500">
                Learn more about liquidity and yield farming
                <ExternalLinkIcon width={16} height={16} className="text-stone-500" />
              </Typography>
            </Link.External>
          </Container>
        </div>
        <div className="order-1 sm:order-3">
          <AppearOnMount>
            <AddSectionMyPosition pair={pairFromPool(pool)} />
          </AppearOnMount>
        </div>
      </div>
      <div className="z-[-1] bg-gradient-radial fixed inset-0 bg-scroll bg-clip-border transform pointer-events-none" />
    </Layout>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const pools = await prisma.pool.findMany({
    include: {
      token0: true,
      token1: true,
    },
  })

  // Get the paths we want to pre-render based on pairs
  const paths = pools.map((pool, i) => ({
    params: { id: `${pool.id}` },
  }))

  // We'll pre-render only these paths at build time.
  // { fallback: blocking } will server-render pages
  // on-demand if the path doesn't exist.
  return { paths, fallback: 'blocking' }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const id = params?.id as string
  const pool = await prisma.pool.findUnique({
    where: { id: id },
    include: {
      token0: {
        include: {
          pools0: { include: { token0: true, token1: true } },
          pools1: { include: { token0: true, token1: true } },
        },
      },
      token1: {
        include: {
          pools0: { include: { token0: true, token1: true } },
          pools1: { include: { token0: true, token1: true } },
        },
      },
      // hourSnapshots: { orderBy: { date: 'desc' } },
      // daySnapshots: { orderBy: { date: 'desc' } },
    },
  })
  if (!pool) {
    throw new Error(`Failed to fetch pool, received ${pool}`)
  }
  const tokens = [pool.token0, pool.token1]
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
    throw new Error(`Failed to fetch prices, received ${prices}`)
  }
  return {
    props: {
      fallback: {
        [`/earn/api/pool/${id}`]: { pool },
        [`/earn/api/prices`]: { prices },
      },
    },
    revalidate: 60,
  }
}

export default Remove
