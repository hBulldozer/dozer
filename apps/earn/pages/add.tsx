import { PlusIcon } from '@heroicons/react/24/solid'
import { ChainId } from '@dozer/chain'
import { Amount, Token } from '@dozer/currency'
import { AppearOnMount, BreadcrumbLink, Button, Dots } from '@dozer/ui'
import { Widget } from '@dozer/ui'
import {
  AddSectionMyPosition,
  AddSectionReviewModalLegacy,
  Layout,
  SelectNetworkWidget,
  SettingsOverlay,
} from '../components'
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { Checker, Web3Input } from '@dozer/higmi'
import { GetStaticProps } from 'next'
import { PairState, Pair } from '@dozer/api'
import { TradeType, useNetwork, useTrade } from '@dozer/zustand'
import { generateSSGHelper } from '@dozer/api/src/helpers/ssgHelper'
import { RouterOutputs, api } from '../utils/api'

type TokenOutputArray = RouterOutputs['getTokens']['all']

type ElementType<T> = T extends (infer U)[] ? U : never
type TokenOutput = ElementType<TokenOutputArray>

function toToken(dbToken: TokenOutput): Token {
  return new Token({
    chainId: dbToken.chainId,
    uuid: dbToken.uuid,
    decimals: dbToken.decimals,
    name: dbToken.name,
    symbol: dbToken.symbol,
  })
}

const LINKS: BreadcrumbLink[] = [
  {
    href: `/add`,
    label: `Add`,
  },
]

export const getStaticProps: GetStaticProps = async () => {
  const ssg = generateSSGHelper()
  await ssg.getPools.all.prefetch()
  await ssg.getTokens.all.prefetch()
  await ssg.getPrices.allUSD.prefetch()
  return {
    props: {
      trpcState: ssg.dehydrate(),
    },
    revalidate: 3600,
  }
}

const Add: FC = () => {
  const { data: pools_db } = api.getPools.all.useQuery()
  const { data: tokens } = api.getTokens.all.useQuery()
  const { data: prices } = api.getPrices.allUSD.useQuery()
  const pools = useMemo(() => {
    if (!pools_db) return []
    return pools_db.map((pool) => {
      return {
        ...pool,
        token0: new Token(pool.token0),
        token1: new Token(pool.token1),
      }
    })
  }, [pools_db])

  const [poolState, setPoolState] = useState<PairState>(PairState.NOT_EXISTS)
  const [selectedPool, setSelectedPool] = useState<Pair>()
  const [input0, setInput0] = useState<string>('')
  const [[token0, token1], setTokens] = useState<[Token | undefined, Token | undefined]>([undefined, undefined])
  const [input1, setInput1] = useState<string>('')
  const [parsedInput0, parsedInput1] = useMemo(() => {
    return [
      parseInt((Number(input0) * 100).toString()) || 0,
      parseInt((Number(input1) * 100).toString()) || 0
    ]
  }, [input0, input1])
  const { network } = useNetwork()
  const trade = useTrade()
  const utils = api.useUtils()
  const [fetchLoading, setFetchLoading] = useState<boolean>(false)

  const [chainId, setChainId] = useState(
    // query?.chainId ? query.chainId :
    ChainId.HATHOR
  )

  useEffect(() => {
    setTokens([undefined, undefined])
  }, [chainId])
  // const [fee, setFee] = useState(2)

  const onInput0 = useCallback(async (val: string) => {
    setInput0(val)
    if (!val) {
      setInput1('')
    }
    trade.setTradeType(TradeType.EXACT_INPUT)
  }, [trade])

  const onInput1 = useCallback(async (val: string) => {
    setInput1(val)
    if (!val) {
      setInput0('')
    }
    trade.setTradeType(TradeType.EXACT_OUTPUT)
  }, [trade])

  // Pool finding effect - runs when tokens change
  useEffect(() => {
    if (pools && token0 && token1) {
      const foundPool = pools.find((pool: Pair) => {
        const uuid0 = pool.token0.uuid
        const uuid1 = pool.token1.uuid
        const checker = (arr: string[], target: string[]) => target.every((v) => arr.includes(v))
        return checker([token0.uuid, token1.uuid], [uuid0, uuid1])
      })
      
      setSelectedPool(foundPool)
      
      // Update pool state based on what we found
      if (foundPool) {
        setPoolState(PairState.EXISTS)
      } else if (token0 && token1) {
        setPoolState(PairState.NOT_EXISTS)
        // Reset inputs when no pool exists
        setInput0('')
        setInput1('')
      } else {
        setPoolState(PairState.INVALID)
      }
    } else {
      setSelectedPool(undefined)
      setPoolState(PairState.INVALID)
    }
  }, [pools, token0, token1])

  // Quote fetching effect - runs when inputs change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const fetchQuote = async () => {
        if (!selectedPool || !token0 || !token1) return
        
        setFetchLoading(true)
        
        try {
          if (trade.tradeType === TradeType.EXACT_INPUT) {
            // User entered amount for token0, calculate required token1
            if (parseFloat(input0) > 0) {
              const response = await utils.getPools.front_quote_add_liquidity_in.fetch({
                id: selectedPool.id,
                amount_in: parseFloat(input0),
                token_in: token0.uuid,
              })
              setInput1(response != null && !isNaN(response) ? Number(response).toFixed(2) : '')
            }
          } else {
            // User entered amount for token1, calculate required token0
            if (parseFloat(input1) > 0) {
              const response = await utils.getPools.front_quote_add_liquidity_out.fetch({
                id: selectedPool.id,
                amount_out: parseFloat(input1),
                token_in: token0.uuid,
              })
              setInput0(response != null && !isNaN(response) ? Number(response).toFixed(2) : '')
            }
          }

          // Update trade state after successful quote
          trade.setMainCurrency(token0)
          trade.setOtherCurrency(token1)
          trade.setMainCurrencyPrice(token0 && prices ? prices[token0.uuid] : 0)
          trade.setOtherCurrencyPrice(token1 && prices ? prices[token1.uuid] : 0)
          trade.setAmountSpecified(Number(input0) || 0)
          trade.setOutputAmount(Number(input1) || 0)
          trade.setTradeType(trade.tradeType)
          trade.setPool(selectedPool)
        } catch (error) {
          console.error('Error fetching liquidity quote:', error)
        } finally {
          setFetchLoading(false)
        }
      }

      // Call the function only if there are inputs and a valid pool
      if ((input0 || input1) && selectedPool && token0 && token1) {
        fetchQuote()
      } else {
        // Reset trade state when no inputs or pool
        trade.setMainCurrencyPrice(0)
        trade.setOtherCurrencyPrice(0)
        trade.setAmountSpecified(0)
        trade.setOutputAmount(0)
        trade.setPriceImpact(0)
        trade.setTradeType(trade.tradeType)
        setFetchLoading(false)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [input0, input1, trade.tradeType, selectedPool, token0, token1, prices, trade, utils.getPools])

  const _setToken0 = useCallback((currency: Token) => {
    setTokens(([prevSrc, prevDst]) => {
      return prevDst && currency.equals(prevDst) ? [prevDst, prevSrc] : [currency, prevDst]
    })
  }, [])

  const _setToken1 = useCallback((currency: Token) => {
    setTokens(([prevSrc, prevDst]) => {
      return prevSrc && currency.equals(prevSrc) ? [prevDst, prevSrc] : [prevSrc, currency]
    })
  }, [])

  return (
    <>
      <Layout breadcrumbs={LINKS}>
        <div className="grid grid-cols-1 sm:grid-cols-[340px_auto] md:grid-cols-[auto_396px_264px] gap-10">
          <div className="hidden md:block" />
          <div className="flex flex-col order-3 gap-3 pb-40 sm:order-2">
            {/* <SelectNetworkWidget selectedNetwork={chainId} onSelect={setChainId} /> */}
            {/* <SelectFeeWidget selectedNetwork={chainId} fee={fee} setFee={setFee} /> */}

            <Widget id="addLiquidity" maxWidth={400}>
              <Widget.Content>
                <Widget.Header title="Add Liquidity">
                  <SettingsOverlay chainId={network} />
                </Widget.Header>
                <Web3Input.Currency
                  className="p-3"
                  value={input0}
                  onChange={onInput0}
                  disabled={!(token0 && token1 && selectedPool)}
                  currency={token0}
                  onSelect={_setToken0}
                  chainId={chainId}
                  prices={prices}
                  loading={trade.tradeType == TradeType.EXACT_OUTPUT && fetchLoading}
                  tokens={
                    tokens
                      ? tokens.map((token) => {
                          return new Token({
                            ...token,
                            imageUrl: token.imageUrl ?? undefined,
                            originalAddress: token.originalAddress ?? undefined,
                            sourceChain: token.sourceChain ?? undefined,
                            targetChain: token.targetChain ?? undefined,
                          })
                        })
                      : []
                  }
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
                    onChange={onInput1}
                    disabled={!(token0 && token1 && selectedPool)}
                    currency={token1}
                    onSelect={_setToken1}
                    chainId={chainId}
                    loading={trade.tradeType == TradeType.EXACT_INPUT && fetchLoading}
                    prices={prices}
                    tokens={
                      tokens
                        ? tokens.map((token) => {
                            return new Token({
                              ...token,
                              imageUrl: token.imageUrl ?? undefined,
                              originalAddress: token.originalAddress ?? undefined,
                              sourceChain: token.sourceChain ?? undefined,
                              targetChain: token.targetChain ?? undefined,
                            })
                          })
                        : []
                    }
                  />
                  <div className="p-3">
                    <Checker.Connected fullWidth size="md">
                      <Checker.Pool
                        fullWidth
                        size="md"
                        poolExist={selectedPool ? true : false}
                        token0={token0}
                        token1={token1}
                      >
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
                                prices={prices || {}}
                              >
                                {({ setOpen }) => (
                                  <Button
                                    fullWidth
                                    onClick={() => setOpen(true)}
                                    disabled={!token0 || !token1 || !input0 || !input1}
                                    size="md"
                                  >
                                    {fetchLoading ? <Dots>Confirm transaction</Dots> : 'Add Liquidity'}
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
                <AddSectionMyPosition pair={selectedPool} />
              </AppearOnMount>
            </div>
          )}
        </div>
      </Layout>
    </>
  )
}

export default Add
