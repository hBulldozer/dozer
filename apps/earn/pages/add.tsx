import { PlusIcon } from '@heroicons/react/solid'
import { ChainId, chainName } from '@dozer/chain'
import { Amount, Token } from '@dozer/currency'
import { FundSource } from '@dozer/hooks'
import { AppearOnMount, BreadcrumbLink, Button, Container, Dots, Loader } from '@dozer/ui'
import { Widget } from '@dozer/ui'
import {
  AddSectionMyPosition,
  AddSectionReviewModalLegacy,
  Layout,
  SelectFeeWidget,
  SelectNetworkWidget,
} from '../components'
import React, { FC, ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { Checker, Web3Input } from '@dozer/higmi'
import { GetStaticProps, InferGetStaticPropsType, NextPage } from 'next'
import prisma from '@dozer/database'
import { dbToken, dbPool, dbTokenWithPools, dbPoolWithTokens } from '../interfaces'
import { Pair, PairState, pairFromPoolAndTokensList } from '../utils/Pair'
import { useTrade } from '@dozer/zustand'
import toToken from '../utils/toToken'
import useSWR, { SWRConfig } from 'swr'
import { useRouter } from 'next/router'

const LINKS: BreadcrumbLink[] = [
  {
    href: `/add`,
    label: `Add`,
  },
]

const Add: FC<InferGetStaticPropsType<typeof getStaticProps>> = ({ fallback }) => {
  return (
    <SWRConfig value={{ fallback }}>
      <Layout breadcrumbs={LINKS}>
        <div className="grid grid-cols-1 sm:grid-cols-[340px_auto] md:grid-cols-[auto_396px_264px] gap-10">
          <div className="hidden md:block" />
          <_Add />
        </div>
      </Layout>
    </SWRConfig>
  )
}

const _Add: FC = () => {
  const { data: pre_pools } = useSWR<{ pools: dbPoolWithTokens[] }>(`/earn/api/pools`, (url: string) =>
    fetch(url).then((response) => response.json())
  )
  const { pools } = pre_pools ? pre_pools : { pools: [] }
  // const pools: dbPoolWithTokens[] | undefined = pre_pools ? Object.values(pre_pools) : []
  const { data } = useSWR<{ tokens: dbTokenWithPools[]; prices: { [key: string]: number } }>(
    `/earn/api/prices`,
    (url: string) => fetch(url).then((response) => response.json())
  )
  const { tokens, prices } = data ? data : { tokens: [], prices: {} }
  // const _initialToken0 =
  //   query?.token9 && query?.chainId && tokens
  //     ? tokens.find((token: dbToken) => {
  //         return query.token0 == token.uuid
  //       })
  //     : undefined
  // const [initialToken0, setInitialToken0] = useState(_initialToken0 ? toToken(_initialToken0) : undefined)
  // const _initialToken1 =
  //   query?.token1 && query?.chainId && tokens
  //     ? tokens.find((token: dbToken) => {
  //         return query.token1 == token.uuid
  //       })
  //     : undefined
  // const [initialToken1, setInitialToken1] = useState(_initialToken1 ? toToken(_initialToken1) : undefined)
  const [{ input0, input1 }, setTypedAmounts] = useState<{
    input0: string
    input1: string
  }>({ input0: '', input1: '' })
  const [token0, setToken0] = useState<Token | undefined>(
    // initialToken0
    undefined
  )
  const [token1, setToken1] = useState<Token | undefined>(
    // initialToken1
    undefined
  )
  const [chainId, setChainId] = useState(
    // query?.chainId ? query.chainId :
    ChainId.HATHOR
  )

  useEffect(() => {
    setToken0(undefined)
    setToken1(undefined)
  }, [chainId])
  // const [fee, setFee] = useState(2)

  const [parsedInput0, parsedInput1] = useMemo(() => {
    return [parseInt((Number(input0) * 100).toString()), parseInt((Number(input1) * 100).toString())]
  }, [input0, input1])
  const [poolState, setPoolState] = useState<PairState>(PairState.NOT_EXISTS)
  const [selectedPool, setSelectedPool] = useState<dbPoolWithTokens>()
  const [listTokens0, setListTokens0] = useState<Token[]>([])
  const [listTokens1, setListTokens1] = useState<Token[]>([])
  const {
    outputAmount,
    setMainCurrency,
    setOtherCurrency,
    setMainCurrencyPrice,
    setOtherCurrencyPrice,
    setAmountSpecified,
    setOutputAmount,
    setPriceImpact,
    setPool,
  } = useTrade()

  const onChangeToken0TypedAmount = useCallback(
    (value: string) => {
      if (poolState === PairState.NOT_EXISTS) {
        setTypedAmounts((prev) => ({
          ...prev,
          input0: value,
        }))
      } else if (token0 && selectedPool) {
        const parsedAmount = Number(value)
        setTypedAmounts({
          input0: value,
          input1: parsedAmount
            ? ((parsedAmount * Number(selectedPool.reserve1)) / (Number(selectedPool.reserve0) + parsedAmount)).toFixed(
                2
              )
            : '',
        })
      }
    },
    [selectedPool, poolState, token0]
  )

  const onChangeToken1TypedAmount = useCallback(
    (value: string) => {
      if (poolState === PairState.NOT_EXISTS) {
        setTypedAmounts((prev) => ({
          ...prev,
          input1: value,
        }))
      } else if (token1 && selectedPool) {
        const parsedAmount = Number(value)
        setTypedAmounts({
          input0: parsedAmount
            ? ((parsedAmount * Number(selectedPool.reserve0)) / (Number(selectedPool.reserve1) + parsedAmount)).toFixed(
                2
              )
            : '',
          input1: value,
        })
      }
    },
    [selectedPool, poolState, token1]
  )

  useEffect(() => {
    if (selectedPool) {
      onChangeToken0TypedAmount(input0)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onChangeToken0TypedAmount])

  useEffect(() => {
    setSelectedPool(
      pools?.find((pool: dbPoolWithTokens) => {
        const uuid0 = pool.token0.uuid
        const uuid1 = pool.token1.uuid
        const checker = (arr: string[], target: string[]) => target.every((v) => arr.includes(v))
        const result = checker(
          [token0 ? token0.uuid : '', token1 ? token1.uuid : ''],
          [uuid0 ? uuid0 : '', uuid1 ? uuid1 : '']
        )
        return result
      })
    )
    selectedPool &&
      setPool({
        token1: token1,
        token2: token0,
        token1_balance:
          tokens.find((token: dbToken) => {
            return token.id == selectedPool.token0Id
          }) == token1?.uuid
            ? Number(selectedPool.reserve1)
            : Number(selectedPool.reserve0),
        token2_balance:
          tokens.find((token: dbToken) => {
            return token.id == selectedPool.token1Id
          }) == token0?.uuid
            ? Number(selectedPool.reserve0)
            : Number(selectedPool.reserve1),
      })
    if (!selectedPool) {
      setPoolState(PairState.NOT_EXISTS)
    } else {
      setPoolState(PairState.EXISTS)
      setMainCurrency(token0 ? token0 : undefined)
      setOtherCurrency(token1 ? token1 : undefined)
      setPriceImpact()
      setAmountSpecified(Number(input0))
      setMainCurrencyPrice(prices && token0 ? Number(prices[token0.uuid]) : 0)
      setOtherCurrencyPrice(prices && token1 ? Number(prices[token1.uuid]) : 0)
      setOutputAmount()
    }
    const list0: dbToken[] = tokens.filter((token) => {
      return token.uuid !== token1?.uuid
    })
    setListTokens0(
      list0?.map((token) => {
        return toToken(token)
      })
    )
    const list1: dbToken[] = tokens.filter((token) => {
      return token.uuid !== token0?.uuid
    })
    setListTokens1(
      list1?.map((token) => {
        return token && toToken(token)
      })
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pools, outputAmount, token0, token1, input0, input1, prices, selectedPool, tokens])
  if (!(pools || tokens || prices)) return <></>

  return (
    <>
      <div className="flex flex-col order-3 gap-3 pb-40 sm:order-2">
        <SelectNetworkWidget selectedNetwork={chainId} onSelect={setChainId} />
        {/* <SelectFeeWidget selectedNetwork={chainId} fee={fee} setFee={setFee} /> */}

        <Widget id="addLiquidity" maxWidth={400}>
          <Widget.Content>
            <Widget.Header title="2. Add Liquidity">{/* <SettingsOverlay /> */}</Widget.Header>
            <Web3Input.Currency
              className="p-3"
              value={input0}
              onChange={onChangeToken0TypedAmount}
              disabled={token0?.symbol && token1?.symbol && selectedPool ? false : true}
              currency={token0}
              onSelect={setToken0}
              chainId={chainId}
              prices={prices}
              tokens={listTokens0}
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
                onChange={onChangeToken1TypedAmount}
                disabled={token0?.symbol && token1?.symbol && selectedPool ? false : true}
                currency={token1}
                onSelect={setToken1}
                chainId={chainId}
                loading={poolState === PairState.LOADING}
                prices={prices}
                tokens={listTokens1}
              />
              <div className="p-3">
                <Checker.Connected fullWidth size="md">
                  <Checker.Pool fullWidth size="md" poolExist={selectedPool ? true : false}>
                    {/* <Checker.Network fullWidth size="md" chainId={chainId}> */}
                    <Checker.Amounts
                      fullWidth
                      size="md"
                      // chainId={chainId}
                      // fundSource={FundSource.WALLET}
                      amount={Number(input0)}
                      token={token0}
                    >
                      <Checker.Amounts
                        fullWidth
                        size="md"
                        // chainId={chainId}
                        // fundSource={FundSource.WALLET}
                        amount={Number(input1)}
                        token={token1}
                      >
                        {selectedPool && token0 && token1 && (
                          <AddSectionReviewModalLegacy
                            poolState={poolState as PairState}
                            chainId={chainId}
                            token0={token0}
                            token1={token1}
                            input0={Amount.fromFractionalAmount(token0, parsedInput0, 100)}
                            input1={Amount.fromFractionalAmount(token1, parsedInput1, 100)}
                            prices={prices}
                          >
                            {({ isWritePending, setOpen }) => (
                              <Button fullWidth onClick={() => setOpen(true)} disabled={isWritePending} size="md">
                                {isWritePending ? <Dots>Confirm transaction</Dots> : 'Add Liquidity'}
                              </Button>
                            )}
                          </AddSectionReviewModalLegacy>
                        )}
                      </Checker.Amounts>
                    </Checker.Amounts>
                    {/* </Checker.Network> */}
                  </Checker.Pool>
                </Checker.Connected>
              </div>
            </div>
          </Widget.Content>
        </Widget>
        {/* {pool && data?.pair && (
          <PoolPositionProvider pair={data.pair}>
            <PoolPositionStakedProvider pair={data.pair}>
              <Container maxWidth={400} className="mx-auto">
                <AddSectionStake
                  title="4. Stake Liquidity"
                  poolAddress={`${chainName[chainId]}:${pool.liquidityToken.address}`}
                />
              </Container>
            </PoolPositionStakedProvider>
          </PoolPositionProvider>
        )} */}
      </div>

      {selectedPool && (
        <div className="order-1 sm:order-3">
          <AppearOnMount>
            <AddSectionMyPosition pair={pairFromPoolAndTokensList(selectedPool)} />
          </AppearOnMount>
        </div>
      )}
    </>
  )
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const pre_pools = await prisma.pool.findMany({
    include: {
      token0: true,
      token1: true,
    },
  })
  const pools: Pair[] = []
  pre_pools.forEach((pool) => {
    pools?.push(pairFromPoolAndTokensList(pool))
  })
  if (!pools) {
    throw new Error(`Failed to fetch pools, received ${pools}`)
  }
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

  if (!tokens) {
    throw new Error(`Failed to fetch tokens, received ${tokens}`)
  }
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
        [`/earn/api/pools`]: { pools },
        [`/earn/api/prices`]: { tokens, prices },
      },
    },
    revalidate: 60,
  }
}

export default Add
