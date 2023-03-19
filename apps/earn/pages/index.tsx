import { PlusIcon } from '@heroicons/react/solid'
import { Button, Link, OnsenIcon, Typography } from '@dozer/ui'
import type { InferGetServerSidePropsType, NextPage } from 'next'
// import { SUPPORTED_CHAIN_IDS } from '../config'
// import { GetStaticProps, InferGetStaticPropsType } from 'next'
import { GetServerSideProps } from 'next'
import {
  FC,
  JSXElementConstructor,
  Key,
  ReactElement,
  ReactFragment,
  ReactPortal,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { api, type RouterOutputs } from '../utils/api'

import { Layout, PoolsSection } from '../components'
import { Pool, prisma } from '@dozer/database'
import { Pair } from '../utils/Pair'
import { getTokens } from '@dozer/currency'

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const pre_pools = await prisma.pool.findMany()
  const pools: Pair[] = []
  pre_pools.forEach((pool) => {
    pools?.push(
      JSON.parse(
        JSON.stringify({
          id: pool.id,
          name: pool.name,
          liquidityUSD: pool.liquidityUSD,
          volumeUSD: pool.liquidityUSD,
          feeUSD: pool.swapFee,
          apr: pool.swapFee,
          token0: getTokens(pool.chainId)[Number(pool.token0Id)],
          token1: getTokens(pool.chainId)[Number(pool.token1Id)],
          reserve0: Number(pool.reserve0),
          reserve1: Number(pool.reserve1),
          chainId: pool.chainId,
          liquidity: pool.liquidityUSD,
          volume1d: pool.liquidityUSD,
          fees1d: pool.swapFee,
        })
      )
    )
  })
  return { props: { pools } }
}

// import { getBundles, getPoolCount, getPools, getSushiBar } from '../lib/api'
// import { AVAILABLE_POOL_TYPE_MAP } from '../lib/constants'

// const Pools: FC<InferGetStaticPropsType<typeof getStaticProps>> = ({ fallback }) => {
//   return (
//     <SWRConfig value={{ fallback }}>
//       <_Pools />
//     </SWRConfig>
//   )
// }

// const poolQuery = api.pool.all.useQuery()

// async function readAllPools() {
//   const pools = await pool.findMany()

//   return pools
// }

// export function List(props: { pools: Pool[] }) {
//   return (
//     <div>
//       {props.pools.map((pool: Pool) => (
//         <p key={pool.id}>
//           {pool.name}: {pool.token0Id}
//         </p>
//       ))}
//     </div>
//   )
// }

const Pools: NextPage = ({ pools }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  return (
    <Layout>
      <div className="flex flex-col gap-10 md:gap-16">
        <section className="flex flex-col gap-6 lg:flex-row">
          <div className="max-w-md space-y-4">
            <Typography variant="hero" weight={600} className="text-stone-50">
              Earn
            </Typography>
            <p className="text-stone-300">Earn fees by providing liquidity.</p>
          </div>
          <div className="flex justify-end flex-grow not-prose">
            <div className="flex flex-col gap-3 w-full lg:w-[200px]">
              {/* <Link.Internal href="/add" passHref={true}> */}
              <Button as="a" href="/earn/add" fullWidth color="yellow" startIcon={<PlusIcon width={16} height={16} />}>
                New Position
              </Button>
              {/* </Link.Internal> */}
              {/* <Link.External href="https://rbieu62gj0f.typeform.com/to/KkrPkOFe">
                <Button fullWidth color="gray" startIcon={<OnsenIcon width={16} height={16} />}>
                  Join Onsen
                </Button>
              </Link.External> */}
            </div>
          </div>
        </section>
        {/* <SushiBarSection /> */}
        {/* <PoolsFiltersProvider selectedNetworks={selectedNetworks}> */}
        <PoolsSection {...pools} />
        {/* </PoolsFiltersProvider> */}
      </div>
    </Layout>
  )
}

export default Pools
