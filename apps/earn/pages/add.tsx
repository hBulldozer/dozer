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
import { GetServerSideProps, InferGetServerSidePropsType, NextPage } from 'next'
import prisma from '@dozer/database'
import { dbToken, dbPool } from '../interfaces'
import { Pair, PairState, pairFromPoolAndTokensList } from '../utils/Pair'
import { useTrade } from '@dozer/zustand'

const LINKS: BreadcrumbLink[] = [
  {
    href: `/add`,
    label: `Add`,
  },
]

export const getServerSideProps: GetServerSideProps = async ({ query, res }) => {
  // res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=3500')
  const pools = await prisma.pool.findMany({
    select: {
      id: true,
      reserve0: true,
      reserve1: true,
      token0: {
        select: {
          id: true,
          name: true,
          uuid: true,
          symbol: true,
        },
      },
      token1: {
        select: {
          id: true,
          name: true,
          uuid: true,
          symbol: true,
        },
      },
    },
  })
  const tokens = await prisma.token.findMany({
    select: {
      id: true,
      name: true,
      uuid: true,
      symbol: true,
      pools0: {
        select: {
          reserve0: true,
          reserve1: true,
        },
      },
      pools1: {
        select: {
          reserve0: true,
          reserve1: true,
        },
      },
    },
  })

  const resp = await fetch('https://api.kucoin.com/api/v1/prices?currencies=HTR')
  const data = await resp.json()
  const priceHTR = data.data.HTR

  const prices_arr = tokens.map((token) => {
    return token.uuid == '00'
      ? priceHTR
      : token.pools0.length > 0
      ? Number(token.pools0[0].reserve0) / Number(token.pools0[0].reserve1 + 1000)
      : token.pools1.length > 0
      ? Number(token.pools1[0].reserve1) / Number(token.pools1[0].reserve0 + 1000)
      : null
  })
  // const prices_arr: number[] = tokens.map((token) => {
  //   let uuid0, uuid1
  //   const pool = pools.find((pool: dbPool) => {
  //     uuid0 = tokens.find((token_in: dbToken) => {
  //       return token_in.id === pool.token0Id
  //     })?.uuid
  //     uuid1 = tokens.find((token_in: dbToken) => {
  //       return token_in.id === pool.token1Id
  //     })?.uuid
  //     return (uuid0 == '00' && token.uuid == uuid1) || (uuid1 == '00' && token.uuid == uuid0)
  //   })
  //   return pool && uuid0 == '00' && token.uuid == uuid1
  //     ? priceHTR * (Number(pool.reserve0) / (Number(pool.reserve1) + 1000))
  //     : pool && uuid1 == '00' && token.uuid == uuid0
  //     ? priceHTR * (Number(pool.reserve1) / (Number(pool.reserve0) + 1000))
  //     : 0
  // })

  const tokens_uuid_arr: string[] = tokens.map((token) => {
    return token.uuid
  })

  const prices: { [key: string]: number } = {}
  tokens_uuid_arr.forEach((element, index) => {
    prices[element] = prices_arr[index]
  })

  return {
    props: {
      pools: JSON.parse(JSON.stringify(pools)),
      tokens: JSON.parse(JSON.stringify(tokens)),
      prices: JSON.parse(JSON.stringify(prices)),
      query: query,
    },
  }
}

const Add: NextPage = ({ pools, tokens, prices, query }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const [chainId, setChainId] = useState(query?.chainId ? query.chainId : ChainId.HATHOR)
  // const [fee, setFee] = useState(2)

  const [initialToken0, setInitialToken0] = useState(
    query?.token0 && query?.chainId
      ? toToken(
          tokens.find((token: dbToken) => {
            return query.token0 == token.uuid
          })
        )
      : undefined
  )

  const [initialToken1, setInitialToken1] = useState(
    query?.token1 && query?.chainId
      ? toToken(
          tokens.find((token: dbToken) => {
            return query.token1 == token.uuid
          })
        )
      : undefined
  )

  console.log(initialToken0, initialToken1)

  const [token0, setToken0] = useState<Token | undefined>(initialToken0)
  const [token1, setToken1] = useState<Token | undefined>(initialToken1)

  useEffect(() => {
    setToken0(initialToken0)
    setToken1(initialToken1)
  }, [chainId, initialToken0, initialToken1])

  // Reset default fee if switching networks and not on a trident enabled network
  useEffect(() => {
    // if (!TRIDENT_ENABLED_NETWORKS.includes(chainId)) {
    //   setFee(2)
    //   setPoolType(PoolFinderType.Classic)
    // }
  }, [chainId])

  return (
    <Layout breadcrumbs={LINKS}>
      <div className="grid grid-cols-1 sm:grid-cols-[340px_auto] md:grid-cols-[auto_396px_264px] gap-10">
        <div className="hidden md:block" />
        <_Add
          chainId={chainId}
          setChainId={setChainId}
          pools={pools}
          title={'teste'}
          token0={token0}
          token1={token1}
          setToken0={setToken0}
          setToken1={setToken1}
          prices={prices}
          tokens={tokens.filter((token: dbToken) => {
            return token.chainId == chainId
          })}
        />
      </div>
    </Layout>
  )
}

function toToken(dbToken: dbToken): Token {
  return new Token({
    chainId: dbToken.chainId,
    uuid: dbToken.uuid,
    decimals: dbToken.decimals,
    name: dbToken.name,
    symbol: dbToken.symbol,
  })
}

interface AddProps {
  chainId: ChainId
  setChainId(chainId: ChainId): void
  pools: dbPool[]
  title: ReactNode
  token0: Token | undefined
  token1: Token | undefined
  setToken0(token: Token): void
  setToken1(token: Token): void
  tokens: dbToken[]
  prices: { [key: string]: number }
}

const _Add: FC<AddProps> = ({
  chainId,
  setChainId,
  pools,
  title,
  token0,
  token1,
  setToken0,
  setToken1,
  prices,
  tokens,
}) => {
  const [{ input0, input1 }, setTypedAmounts] = useState<{
    input0: string
    input1: string
  }>({ input0: '', input1: '' })

  const [parsedInput0, parsedInput1] = useMemo(() => {
    return [parseInt((Number(input0) * 100).toString()), parseInt((Number(input1) * 100).toString())]
  }, [input0, input1])
  const [poolState, setPoolState] = useState<PairState>(PairState.NOT_EXISTS)
  const [selectedPool, setSelectedPool] = useState<dbPool>()
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
      pools.find((pool: dbPool) => {
        const uuid0 = tokens.find((token: dbToken) => {
          return token.id === pool.token0Id
        })?.uuid
        const uuid1 = tokens.find((token: dbToken) => {
          return token.id === pool.token1Id
        })?.uuid
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
      setMainCurrency(token0 ? token0 : toToken(tokens[0]))
      setOtherCurrency(token1 ? token1 : toToken(tokens[0]))
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
      list0.map((token) => {
        return toToken(token)
      })
    )
    const list1: dbToken[] = tokens.filter((token) => {
      return token.uuid !== token0?.uuid
    })
    setListTokens1(
      list1.map((token) => {
        return toToken(token)
      })
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pools, outputAmount, token0, token1, input0, input1, prices, selectedPool, tokens])

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
                          >
                            {({ isWritePending, setOpen }) => (
                              <Button fullWidth onClick={() => setOpen(true)} disabled={isWritePending} size="md">
                                {isWritePending ? <Dots>Confirm transaction</Dots> : title}
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
            <AddSectionMyPosition pair={pairFromPoolAndTokensList(selectedPool, tokens)} />
          </AppearOnMount>
        </div>
      )}
    </>
  )
}

export default Add
