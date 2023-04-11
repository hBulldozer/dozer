import { ChevronDownIcon } from '@heroicons/react/solid'
import { App, Button, classNames, Container, Link, Typography, Widget } from '@dozer/ui'
import { Layout } from '../components/Layout'
import { CurrencyInput } from '../components/CurrencyInput'
import { Token } from '@dozer/currency'
import { useState, useCallback, useMemo, useEffect, FC } from 'react'
import { useIsMounted } from '@dozer/hooks'
import { TradeType } from '../components/utils/TradeType'
import { useNetwork, useSettings, useTrade } from '@dozer/zustand'
import { usePrices } from '@dozer/react-query'
import { SwapStatsDisclosure, SettingsOverlay } from '../components'
import { Checker } from '@dozer/higmi'
import { SwapReviewModalLegacy } from '../components/SwapReviewModal'
import { warningSeverity } from '../components/utils/functions'
import { GetServerSideProps, InferGetServerSidePropsType, NextPage } from 'next'
import { prisma } from '@dozer/database'
import { dbToken, dbPool } from '../interfaces'
import { ChainId } from '@dozer/chain'
// import { Token as dbToken, Pool } from '@dozer/database/types'

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  // TODO: build request to receive ChainId and filter
  const pools = await prisma.pool.findMany()
  const tokens = await prisma.token.findMany()
  const res = await fetch('https://api.kucoin.com/api/v1/prices?currencies=HTR')
  const data = await res.json()
  const priceHTR = data.data.HTR
  const prices_arr: number[] = tokens.map((token) => {
    let uuid0, uuid1
    const pool = pools.find((pool: dbPool) => {
      uuid0 = tokens.find((token_in: dbToken) => {
        return token_in.id === pool.token0Id
      })?.uuid
      uuid1 = tokens.find((token_in: dbToken) => {
        return token_in.id === pool.token1Id
      })?.uuid
      return (uuid0 == '00' && token.uuid == uuid1) || (uuid1 == '00' && token.uuid == uuid0)
    })
    return pool && uuid0 == '00' && token.uuid == uuid1
      ? priceHTR * (Number(pool.reserve0) / (Number(pool.reserve1) + 1000))
      : pool && uuid1 == '00' && token.uuid == uuid0
      ? priceHTR * (Number(pool.reserve1) / (Number(pool.reserve0) + 1000))
      : 0
  })

  const tokens_uuid_arr: string[] = tokens.map((token: dbToken) => {
    return token.uuid
  })

  const prices: { [key: string]: number } = {}
  tokens_uuid_arr.forEach((element, index) => {
    element == '00' ? (prices[element] = priceHTR) : (prices[element] = prices_arr[index])
  })

  return {
    props: {
      pools: JSON.parse(JSON.stringify(pools)),
      tokens: JSON.parse(JSON.stringify(tokens)),
      prices: JSON.parse(JSON.stringify(prices)),
    },
  }
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

const Home: NextPage = ({ pools, tokens, prices }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const isMounted = useIsMounted()
  const network = useNetwork((state) => state.network)

  const inputToken = useMemo(() => {
    return toToken(
      tokens.find((obj: dbToken) => {
        return obj.symbol == 'DZR' && obj.chainId == (network ? network : ChainId.HATHOR)
      })
    )
  }, [network, tokens])

  const outputToken = useMemo(() => {
    return toToken(
      tokens.find((obj: dbToken) => {
        return obj.symbol == 'HTR' && obj.chainId == (network ? network : ChainId.HATHOR)
      })
    )
  }, [network, tokens])

  useEffect(() => {
    setTokens([inputToken, outputToken])
  }, [inputToken, network, outputToken])

  const [input0, setInput0] = useState<string>('')
  const [[token0, token1], setTokens] = useState<[Token | undefined, Token | undefined]>([inputToken, outputToken])
  const [input1, setInput1] = useState<string>('')
  const [tradeType, setTradeType] = useState<TradeType>(TradeType.EXACT_INPUT)
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
    pool,
  } = useTrade()
  const [selectedPool, setSelectedPool] = useState<dbPool>()

  // const { data: prices } = usePrices(network)

  const onInput0 = async (val: string) => {
    setTradeType(TradeType.EXACT_INPUT)
    setInput0(val)
  }

  const onInput1 = (val: string) => {
    // setTradeType(TradeType.EXACT_OUTPUT)
    setInput1(val)
  }

  const switchCurrencies = async () => {
    setTokens(([prevSrc, prevDst]) => [prevDst, prevSrc])
  }

  const amounts = useMemo(() => [input0], [input0])

  const onSuccess = () => {
    console.log('sucesso')
  }

  // useEffect(() => {
  //   setTokens([inputToken, outputToken])
  //   // setInput0(initialState.input0)
  //   setInput1('')
  // }, [inputToken, outputToken])

  useEffect(() => {
    setSelectedPool(
      pools.find((pool: dbPool) => {
        const uuid0 = tokens.find((token: dbToken) => {
          return token.id === pool.token0Id
        }).uuid
        const uuid1 = tokens.find((token: dbToken) => {
          return token.id === pool.token1Id
        }).uuid
        const checker = (arr: string[], target: string[]) => target.every((v) => arr.includes(v))
        const result = checker([token0 ? token0.uuid : '', token1 ? token1.uuid : ''], [uuid0, uuid1])
        return result
      })
    )
    setMainCurrency(token0 ? token0 : toToken(tokens[0]))
    setOtherCurrency(token1 ? token1 : toToken(tokens[0]))
    setPriceImpact()
    if (!selectedPool) {
      setInput0('')
      setAmountSpecified(0)
      setOutputAmount()
      // setInput1('')
    } else {
      setPool({
        token1: token0,
        token2: token1,
        token1_balance:
          tokens.find((token: dbToken) => {
            return token.id == selectedPool.token0Id
          }) == token0?.uuid
            ? Number(selectedPool.reserve0)
            : Number(selectedPool.reserve1),
        token2_balance:
          tokens.find((token: dbToken) => {
            return token.id == selectedPool.token1Id
          }) == token1?.uuid
            ? Number(selectedPool.reserve1)
            : Number(selectedPool.reserve0),
      })
      setAmountSpecified(Number(input0))
      setMainCurrencyPrice(prices && token0 ? Number(prices[token0.uuid]) : 0)
      setOtherCurrencyPrice(prices && token1 ? Number(prices[token1.uuid]) : 0)
      setOutputAmount()
      // setInput1(outputAmount ? outputAmount.toString() : '')
    }
  }, [pools, outputAmount, token0, token1, input0, input1, prices, network, selectedPool, tokens])

  // const onSuccess = useCallback(() => {
  //   setInput0('')
  //   setInput1('')
  // }, [])

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
    <Layout>
      <Widget id="swap" maxWidth={400}>
        <Widget.Content>
          <div className={classNames('p-3 mx-0.5 grid grid-cols-2 items-center pb-4 font-medium')}>
            <App.NavItemList hideOnMobile={false}>
              <App.NavItem href="https://dozer.finance/swap" label="Swap" />
            </App.NavItemList>
            <div className="flex justify-end">
              <SettingsOverlay chainId={network} />
            </div>
          </div>
          <CurrencyInput
            id={'swap-input-currency0'}
            className="p-3"
            disabled={token0?.symbol && token1?.symbol && selectedPool ? false : true}
            value={token0?.symbol && token1?.symbol ? input0 : ''}
            onChange={onInput0}
            currency={token0}
            onSelect={_setToken0}
            // customTokenMap={customTokensMap}
            // onAddToken={addCustomToken}
            // onRemoveToken={removeCustomToken}
            chainId={network}
            // tokenMap={tokenMap}
            inputType={TradeType.EXACT_INPUT}
            tradeType={tradeType}
            loading={!token0}
            prices={prices}
            tokens={tokens.map((token: Token) => {
              return new Token(token)
            })}
          />
          <div className="flex items-center justify-center -mt-[12px] -mb-[12px] z-10">
            <button
              type="button"
              onClick={switchCurrencies}
              className="group bg-stone-700 p-0.5 border-2 border-stone-800 transition-all rounded-full hover:ring-2 hover:ring-stone-500 cursor-pointer"
            >
              <div className="transition-all rotate-0 group-hover:rotate-180 group-hover:delay-200">
                <ChevronDownIcon width={16} height={16} />
              </div>
            </button>
          </div>
          <div className="bg-stone-800">
            <CurrencyInput
              id={'swap-output-currency1'}
              disabled={true}
              className="p-3"
              value={selectedPool ? (outputAmount ? outputAmount.toString() : '') : ''}
              onChange={onInput1}
              currency={token1}
              onSelect={_setToken1}
              // customTokenMap={customTokensMap}
              // onAddToken={addCustomToken}
              // onRemoveToken={removeCustomToken}
              chainId={network}
              // tokenMap={tokenMap}
              inputType={TradeType.EXACT_OUTPUT}
              tradeType={tradeType}
              loading={!token1}
              prices={prices}
              tokens={tokens.map((token: Token) => {
                return new Token(token)
              })}
              // isWrap={isWrap}
            />
            <SwapStatsDisclosure prices={prices} />
            <div className="p-3 pt-0">
              <Checker.Connected fullWidth size="md">
                <Checker.Pool fullWidth size="md" poolExist={selectedPool ? true : false}>
                  <Checker.Amounts fullWidth size="md" amount={Number(input0)} token={token0}>
                    <SwapReviewModalLegacy chainId={network} onSuccess={onSuccess}>
                      {({ setOpen }) => {
                        return <SwapButton setOpen={setOpen} />
                      }}
                    </SwapReviewModalLegacy>
                  </Checker.Amounts>
                </Checker.Pool>
              </Checker.Connected>
            </div>
          </div>
        </Widget.Content>
      </Widget>
    </Layout>
  )
}

export default Home

const SwapButton: FC<{
  setOpen(open: boolean): void
}> = ({ setOpen }) => {
  const trade = useTrade()
  const slippageTolerance = useSettings((state) => state.slippageTolerance)

  const priceImpactSeverity = useMemo(() => warningSeverity(trade?.priceImpact), [trade])
  const priceImpactTooHigh = priceImpactSeverity > 3

  const onClick = useCallback(() => {
    setOpen(true)
  }, [setOpen])

  return (
    <Button
      testdata-id="swap-button"
      fullWidth
      onClick={onClick}
      disabled={
        priceImpactTooHigh ||
        Number(
          (trade?.outputAmount
            ? trade.outputAmount
            : 0 * (1 - (slippageTolerance ? slippageTolerance : 0) / 100)
          ).toFixed(2)
        ) == 0 ||
        Boolean(!trade && priceImpactSeverity > 2)
      }
      size="md"
      color={priceImpactTooHigh || priceImpactSeverity > 2 ? 'red' : 'blue'}
      {...(Boolean(!trade && priceImpactSeverity > 2) && {
        title: 'Enable expert mode to swap with high price impact',
      })}
    >
      {false
        ? 'Finding Best Price'
        : priceImpactTooHigh
        ? 'High Price Impact'
        : trade && priceImpactSeverity > 2
        ? 'Swap Anyway'
        : 'Swap'}
    </Button>
  )
}
