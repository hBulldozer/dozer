import { ExternalLinkIcon } from '@heroicons/react/solid'
import { formatPercent } from '@dozer/format'
import { Pair, pairFromPool } from '../../utils/Pair'
import { AppearOnMount, BreadcrumbLink, Container, Link, Typography } from '@dozer/ui'

import { AddSectionMyPosition, Layout, RemoveSectionLegacy } from '../../components'

import { prisma } from '@dozer/database'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'

export const getServerSideProps: GetServerSideProps = async ({ res, query }) => {
  res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=3500')
  const pre_pool = await prisma.pool.findUnique({
    where: { id: query.id?.toString() },
    include: {
      token0: true,
      token1: true,
    },
  })
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

  const pair: Pair = pairFromPool(pre_pool)
  return { props: { pair, prices } }
}

const LINKS = ({ pair }: { pair: Pair }): BreadcrumbLink[] => [
  {
    href: `/${pair.id}`,
    label: `${pair.name} - ${formatPercent(pair.swapFee / 10000)}`,
  },
  {
    href: `/${pair.id}/remove`,
    label: `Remove Liquidity`,
  },
]

const Remove = ({ pair, prices }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  if (!pair) return <></>

  return (
    <Layout breadcrumbs={LINKS({ pair })}>
      <div className="grid grid-cols-1 sm:grid-cols-[340px_auto] md:grid-cols-[auto_396px_264px] gap-10">
        <div className="hidden md:block" />
        <div className="flex flex-col order-3 gap-3 pb-40 sm:order-2">
          <RemoveSectionLegacy pair={pair} prices={prices} />
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
            <AddSectionMyPosition pair={pair} />
          </AppearOnMount>
        </div>
      </div>
      <div className="z-[-1] bg-gradient-radial fixed inset-0 bg-scroll bg-clip-border transform pointer-events-none" />
    </Layout>
  )
}

export default Remove
