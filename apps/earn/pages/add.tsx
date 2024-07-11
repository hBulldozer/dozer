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
  await ssg.getPrices.all.prefetch()
  return {
    props: {
      trpcState: ssg.dehydrate(),
    },
    revalidate: 3600,
  }
}

const Add: FC = () => {
  const { data: pools = [] } = api.getPools.all.useQuery()
  const { data: tokens = [] } = api.getTokens.all.useQuery()
  const { data: prices = {} } = api.getPrices.all.useQuery()

  const [poolState, setPoolState] = useState<PairState>(PairState.NOT_EXISTS)
  const [selectedPool, setSelectedPool] = useState<Pair>()
  const [input0, setInput0] = useState<string>('')
  const [[token0, token1], setTokens] = useState<[Token | undefined, Token | undefined]>([undefined, undefined])
  const [input1, setInput1] = useState<string>('')
  const [parsedInput0, parsedInput1] = useMemo(() => {
    return [parseInt((Number(input0) * 100).toString()), parseInt((Number(input1) * 100).toString())]
  }, [input0, input1])
  const [tradeType, setTradeType] = useState<TradeType>(TradeType.EXACT_INPUT)
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

  const onInput0 = async (val: string) => {
    setInput0(val)
    if (!val) {
      setInput1('')
    }
    setTradeType(TradeType.EXACT_INPUT)
  }

  const onInput1 = async (val: string) => {
    setInput1(val)
    if (!val) {
      setInput0('')
    }
    setTradeType(TradeType.EXACT_OUTPUT)
  }

  useEffect(() => {
    const fetchData = async () => {
      setFetchLoading(true)
      if (tradeType == TradeType.EXACT_INPUT) {
        const response =
          selectedPool && token0
            ? await utils.getPools.front_quote_add_liquidity_in.fetch({
                id: selectedPool?.id,
                amount_in: parseFloat(input0),
                token_in: token0?.uuid,
              })
            : undefined
        // set state with the result if `isSubscribed` is true

        setInput1(response && response != 0 ? response.toFixed(2) : '')
      } else {
        const response =
          selectedPool && token0
            ? await utils.getPools.front_quote_add_liquidity_out.fetch({
                id: selectedPool?.id,
                amount_out: parseFloat(input1),
                token_in: token0?.uuid,
              })
            : undefined

        setInput0(response && response != 0 ? response.toFixed(2) : '')
      }
    }
    setSelectedPool(
      pools.find((pool: Pair) => {
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

    // call the function
    if (input1 || input0) {
      fetchData()
        .then(() => {
          setFetchLoading(false)
          trade.setMainCurrency(token0)
          trade.setOtherCurrency(token1)
          trade.setMainCurrencyPrice(token0 ? prices[token0?.uuid] : 0)
          trade.setOtherCurrencyPrice(token1 ? prices[token1?.uuid] : 0)
          trade.setAmountSpecified(Number(input0) || 0)
          trade.setOutputAmount(Number(input1) || 0)
          trade.setTradeType(tradeType)
          if (selectedPool) trade.setPool(selectedPool)
        })
        // make sure to catch any error
        .catch((err) => {
          console.error(err)
          setFetchLoading(false)
        })
    } else {
      trade.setMainCurrencyPrice(0)
      trade.setOtherCurrencyPrice(0)
      trade.setAmountSpecified(0)
      trade.setOutputAmount(0)
      trade.setPriceImpact(0)
      trade.setTradeType(tradeType)
    }
  }, [pools, token0, token1, input0, input1, prices, network, tokens, selectedPool])

  const onSuccess = useCallback(() => {
    setInput0('')
    setInput1('')
  }, [])

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
                <Widget.Header title="1. Add Liquidity">
                  <SettingsOverlay chainId={network} />
                </Widget.Header>
                <Web3Input.Currency
                  className="p-3"
                  value={input0}
                  onChange={onInput0}
                  disabled={token0?.symbol && token1?.symbol && selectedPool ? false : true}
                  currency={token0}
                  onSelect={_setToken0}
                  chainId={chainId}
                  prices={prices}
                  loading={tradeType == TradeType.EXACT_OUTPUT && fetchLoading}
                  tokens={tokens.map((token) => {
                    return new Token(token)
                  })}
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
                    disabled={token0?.symbol && token1?.symbol && selectedPool ? false : true}
                    currency={token1}
                    onSelect={_setToken1}
                    chainId={chainId}
                    loading={tradeType == TradeType.EXACT_INPUT && fetchLoading}
                    prices={prices}
                    tokens={tokens.map((token) => {
                      return new Token(token)
                    })}
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
                                prices={prices}
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
        </div>
      </Layout>

      {selectedPool && (
        <div className="order-1 sm:order-3">
          <AppearOnMount>
            <AddSectionMyPosition pair={selectedPool} />
          </AppearOnMount>
        </div>
      )}
    </>
  )
}

export default Add
