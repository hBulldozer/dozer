import { generateSSGHelper } from '@dozer/api/src/helpers/ssgHelper'
import { api } from 'utils/api'
import type { GetStaticProps, NextPage } from 'next'

const Test: NextPage = () => {
  // const { data, isLoading } = api.getPools.all.useQuery()
  // const tokens = api.getTokens.all.useQuery().data
  const { data: htr, isLoading } = api.getTokens.bySymbol.useQuery({ symbol: 'HTR' })
  if (isLoading) {
    return <div>Loading...</div>
    console.log('Loading...')
  }
  return (
    <div>
      {/* {data?.map((index) => {
        return <p key={index.id}>{index.name}</p>
      })} */}
      {/* {tokens?.map((index) => {
        return <p key={index.id}>{index.symbol}</p>
      })} */}
      <p>{htr?.name}</p>
    </div>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const ssg = generateSSGHelper()

  await ssg.getTokens.bySymbol.prefetch({ symbol: 'HTR' })
  // await ssg.getPools.bySymbol.prefetch({ symbol: 'HTR' })
  // await ssg.getPools.bySymbol.prefetch({ symbol: 'BTC' }) prefetch()
  // await ssg.getPools.all.prefetch()
  // profile.getUserByUsername.prefetch({ username });
  console.log(ssg.dehydrate())
  return {
    props: {
      trpcState: ssg.dehydrate(),
    },
    revalidate: 60,
  }
}

// export const getStaticPaths = () => {
//   return { paths: [], fallback: 'blocking' }
// }

export default Test
