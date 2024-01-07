import { ChevronDownIcon } from '@heroicons/react/solid'
import { App, Button, classNames, Widget } from '@dozer/ui'
import { Layout } from '../components/Layout'
import { CurrencyInput } from '../components/CurrencyInput'
import { Token } from '@dozer/currency'
import { useState, useCallback, useMemo, useEffect, FC } from 'react'
import { TradeType } from '../components/utils/TradeType'
import { useNetwork, useSettings, useTrade } from '@dozer/zustand'
import { SwapStatsDisclosure, SettingsOverlay } from '../components'
import { Checker } from '@dozer/higmi'
import { SwapReviewModalLegacy } from '../components/SwapReviewModal'
import { warningSeverity } from '../components/utils/functions'
import { useRouter } from 'next/router'
import { api, RouterOutputs } from 'utils/api'
import { generateSSGHelper } from '@dozer/api/src/helpers/ssgHelper'
import type { GetStaticProps } from 'next'
import type { dbPoolWithTokens } from '@dozer/api'

type TokenOutputArray = RouterOutputs['getTokens']['all']

type ElementType<T> = T extends (infer U)[] ? U : never
type TokenOutput = ElementType<TokenOutputArray>

function toToken(dbToken: TokenOutput): Token {
  if (!dbToken) return new Token({ chainId: 1, uuid: '', decimals: 18, name: '', symbol: 'HTR' })
  return new Token({
    chainId: dbToken.chainId,
    uuid: dbToken.uuid,
    decimals: dbToken.decimals,
    name: dbToken.name,
    symbol: dbToken.symbol,
  })
}

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

const Home = () => {
  const { data: pools = [] } = api.getPools.all.useQuery()
  const { data: tokens = [] } = api.getTokens.all.useQuery()
  const { data: prices = { '00': 0 } } = api.getPrices.all.useQuery()
  const router = useRouter()

  useEffect(() => {
    const params = router.query
    const _initialToken0 =
      params?.token0 && params?.chainId && tokens
        ? tokens.find((token) => {
            return params.token0 == token.uuid
          })
        : undefined
    const _initialToken1 =
      params?.token1 && params?.chainId && tokens
        ? tokens.find((token) => {
            return params.token1 == token.uuid
          })
        : undefined
    if (_initialToken0) setInitialToken0(toToken(_initialToken0))
    if (_initialToken1) setInitialToken1(toToken(_initialToken1))
  }, [router.query, router.query.isReady, tokens])

  const network = useNetwork((state) => state.network)

  const [initialToken0, setInitialToken0] = useState(toToken(tokens[0]))

  const [initialToken1, setInitialToken1] = useState(toToken(tokens[1]))

  useEffect(() => {
    setTokens([initialToken0, initialToken1])
  }, [network, initialToken0, initialToken1])

  const [input0, setInput0] = useState<string>('')
  const [[token0, token1], setTokens] = useState<[Token | undefined, Token | undefined]>([initialToken0, initialToken1])
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
  } = useTrade()
  const [selectedPool, setSelectedPool] = useState<dbPoolWithTokens>()

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

  // const onSuccess = () => {
  //   console.log('sucesso')
  // }

  // useEffect(() => {
  //   setTokens([inputToken, outputToken])
  //   // setInput0(initialState.input0)
  //   setInput1('')
  // }, [inputToken, outputToken])

  useEffect(() => {
    setSelectedPool(
      pools.find((pool: dbPoolWithTokens) => {
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
    setMainCurrency(token0 ? token0 : toToken(tokens[0]))
    setOtherCurrency(token1 ? token1 : toToken(tokens[1]))
    setPriceImpact()
    if (!selectedPool) {
      setInput0('')
      setAmountSpecified(0)
      setOutputAmount()
      // setInput1('')
    } else {
      token0 &&
        token1 &&
        setPool({
          token1: token0,
          token2: token1,
          token1_balance:
            selectedPool.token0.uuid == token0.uuid ? Number(selectedPool.reserve0) : Number(selectedPool.reserve1),
          token2_balance:
            selectedPool.token1.uuid == token1.uuid ? Number(selectedPool.reserve1) : Number(selectedPool.reserve0),
        })
      setAmountSpecified(Number(input0))
      setMainCurrencyPrice(prices && token0 ? Number(prices[token0.uuid]) : 0)
      setOtherCurrencyPrice(prices && token1 ? Number(prices[token1.uuid]) : 0)
      setOutputAmount()
      // setInput1(outputAmount ? outputAmount.toString() : '')
    }
  }, [
    pools,
    outputAmount,
    token0,
    token1,
    input0,
    input1,
    prices,
    network,
    selectedPool,
    tokens,
    setMainCurrency,
    setOtherCurrency,
    setPriceImpact,
    setAmountSpecified,
    setOutputAmount,
    setPool,
    setMainCurrencyPrice,
    setOtherCurrencyPrice,
  ])

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

  if (!(pools || tokens || prices)) return <></>
  return (
    <Layout>
      <Widget id="swap" maxWidth={400} className="mt-40">
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
            tokens={tokens.map((token) => {
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
              tokens={tokens.map((token) => {
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
