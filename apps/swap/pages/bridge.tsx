import { Layout } from '../components/Layout'
import { Bridge } from '../components/Bridge'
import { useBridge } from '@dozer/higmi'
import { generateSSGHelper } from '@dozer/api/src/helpers/ssgHelper'
import type { GetStaticProps } from 'next'
import { api } from 'utils/api'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { Token } from '@dozer/currency'

export const getStaticProps: GetStaticProps = async () => {
  const ssg = generateSSGHelper()
  await ssg.getTokens.all.prefetch()
  await ssg.getPrices.all.prefetch()
  return {
    props: {
      trpcState: ssg.dehydrate(),
    },
  }
}

const BridgePage = () => {
  const router = useRouter();
  const { data: tokens } = api.getTokens.all.useQuery();
  const [preselectedToken, setPreselectedToken] = useState<Token | undefined>();
  
  useEffect(() => {
    // Check for token in URL
    if (router.query.token && typeof router.query.token === 'string' && tokens) {
      const selectedToken = tokens.find(token => token.uuid === router.query.token);
      if (selectedToken) {
        setPreselectedToken(new Token(selectedToken));
      }
    }
  }, [router.query, tokens]);
  
  return (
    <Layout>
      <div className="flex flex-col gap-6 max-w-[400px] mx-auto">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-white mb-2">Token Bridge</h1>
          <p className="text-gray-400">Bridge tokens between Hathor and Arbitrum networks</p>
        </div>
        <Bridge initialToken={preselectedToken} />
      </div>
    </Layout>
  )
}

export default BridgePage
