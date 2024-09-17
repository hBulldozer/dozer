import { PlusIcon } from '@heroicons/react/24/solid'
import { ChainId } from '@dozer/chain'
import { Amount, Token } from '@dozer/currency'
import { AppearOnMount, BreadcrumbLink, Button, Dots, Widget } from '@dozer/ui'
import { Layout, SettingsOverlay } from '../components'
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { Checker, Web3Input } from '@dozer/higmi'
import { GetStaticProps } from 'next'
import { useNetwork, useTrade } from '@dozer/zustand'
import { generateSSGHelper } from '@dozer/api/src/helpers/ssgHelper'
import { RouterOutputs, api } from '../utils/api'
import { useRouter } from 'next/router'
import { PoolSizeCalculator } from '../components'
import { CreatePoolReviewModal } from '../components/CreatePoolReviewModal'

const LINKS: BreadcrumbLink[] = [
  {
    href: `/pool/create`,
    label: `Create Pool`,
  },
]

export const getStaticProps: GetStaticProps = async () => {
  const ssg = generateSSGHelper()
  await ssg.getTokens.all.prefetch()
  await ssg.getPrices.all.prefetch()
  return {
    props: {
      trpcState: ssg.dehydrate(),
    },
    revalidate: 3600,
  }
}

const CreatePool: FC = () => {
  const router = useRouter()

  const { data: tokens = [] } = api.getTokens.all.useQuery()
  const { data: prices = {} } = api.getPrices.all.useQuery()
  const { token } = router.query
  const { data: tokenData } = api.getTokens.byUuid.useQuery(
    { uuid: token as string },
    {
      enabled: !!token,
    }
  )

  const [input0, setInput0] = useState<string>('20000')
  const [input1, setInput1] = useState<string>('2000000')
  const [token0] = useState<Token>(
    new Token({ chainId: ChainId.HATHOR, uuid: '00', decimals: 2, name: 'Hathor', symbol: 'HTR' })
  )
  const [token1, setToken1] = useState<Token | undefined>(undefined) // TODO: Add token1 to the URL
  const [recommendedLiquiditySize, setRecommendedLiquiditySize] = useState<number>(0)
  const { network } = useNetwork()

  useEffect(() => {
    if (token && tokenData) setToken1(new Token(tokenData))
  }, [token, tokenData])

  const customTokens = useMemo(() => {
    return tokens.filter((token) => token.custom === true).map((token) => new Token(token))
  }, [tokens])

  const onInput0 = (val: string) => {
    setInput0(val)
  }

  const onInput1 = (val: string) => {
    setInput1(val)
  }

  const handleLiquiditySizeChange = (size: number) => {
    setRecommendedLiquiditySize(size)
    // Optionally, you can update input0 here if you want to automatically set the HTR amount
    // setInput0(size.toString())
  }

  return (
    <Layout breadcrumbs={LINKS}>
      <div className="grid grid-cols-1 sm:grid-cols-[340px_auto] md:grid-cols-[auto_396px_264px] gap-10">
        <div className="hidden md:block" />
        <div className="flex flex-col order-3 gap-3 pb-40 sm:order-2">
          <PoolSizeCalculator onLiquiditySizeChange={handleLiquiditySizeChange} />
          <Widget id="createPool" maxWidth={400}>
            <Widget.Content>
              <Widget.Header title="Create Pool">
                <SettingsOverlay chainId={network} />
              </Widget.Header>
              <Web3Input.Currency
                className="p-3"
                value={input0}
                disabled
                onChange={onInput0}
                currency={token0}
                chainId={ChainId.HATHOR}
                prices={prices}
                tokens={[token0]}
              />
              <div className="flex items-center justify-center -mt-[12px] -mb-[12px] z-10">
                <div className="group bg-stone-700 p-0.5 border-2 border-stone-800 transition-all rounded-full">
                  <PlusIcon width={16} height={16} />
                </div>
              </div>
              <div className="bg-stone-800">
                <Web3Input.Currency
                  className="p-3 !pb-1"
                  value={input1}
                  disabled
                  onChange={onInput1}
                  currency={token1}
                  onSelect={setToken1}
                  chainId={ChainId.HATHOR}
                  prices={prices}
                  tokens={customTokens}
                />
                <div className="p-3">
                  <Checker.Connected fullWidth size="md">
                    <Checker.Amounts fullWidth size="md" amount={Number(input0)} token={token0}>
                      <Checker.Amounts fullWidth size="md" amount={Number(input1)} token={token1}>
                        <CreatePoolReviewModal
                          chainId={network}
                          token0={token0}
                          token1={token1}
                          input0={input0}
                          input1={input1}
                          prices={prices}
                        >
                          {({ setOpen }) => (
                            <Button
                              fullWidth
                              onClick={() => setOpen(true)}
                              disabled={!token0 || !token1 || !input0 || !input1}
                              size="md"
                            >
                              Review Pool Creation
                            </Button>
                          )}
                        </CreatePoolReviewModal>
                      </Checker.Amounts>
                    </Checker.Amounts>
                  </Checker.Connected>
                </div>
              </div>
            </Widget.Content>
          </Widget>
        </div>
      </div>
    </Layout>
  )
}

export default CreatePool
