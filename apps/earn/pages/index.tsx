import { PlusIcon } from '@heroicons/react/solid'
import { Button, Link, OnsenIcon, Typography } from '@dozer/ui'
import type { NextPage } from 'next'
// import { SUPPORTED_CHAIN_IDS } from '../config'
import { GetStaticProps, InferGetStaticPropsType } from 'next'
import { FC, useMemo } from 'react'
import { api, type RouterOutputs } from '../utils/api'

import { Layout, PoolsSection } from '../components'
// import { getBundles, getPoolCount, getPools, getSushiBar } from '../lib/api'
// import { AVAILABLE_POOL_TYPE_MAP } from '../lib/constants'

// const Pools: FC<InferGetStaticPropsType<typeof getStaticProps>> = ({ fallback }) => {
//   return (
//     <SWRConfig value={{ fallback }}>
//       <_Pools />
//     </SWRConfig>
//   )
// }

const Pools: NextPage = () => {
  const poolQuery = api.pool.all.useQuery()

  return (
    <Layout>
      <div className="flex flex-col gap-10 md:gap-16">
        <section className="flex flex-col gap-6 lg:flex-row">
          <div className="max-w-md space-y-4">
            {poolQuery.data ? (
              <div className="w-full max-w-2xl">
                {poolQuery.data?.length === 0 ? (
                  <span>There are no pools!</span>
                ) : (
                  <div className="flex h-[40vh] justify-center overflow-y-scroll px-4 text-2xl">
                    <div className="flex flex-col w-full gap-4">
                      {poolQuery.data?.map((p) => {
                        return <Typography key={p.id}>{p.name}</Typography>
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p>Loading...</p>
            )}

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
        <PoolsSection />
        {/* </PoolsFiltersProvider> */}
      </div>
    </Layout>
  )
}

export default Pools
