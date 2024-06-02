import { ChevronDownIcon } from '@heroicons/react/solid'
import { App, Button, classNames, Widget } from '@dozer/ui'
import { Layout } from '../components/Layout'
import { CurrencyInput } from '../components/CurrencyInput'
import { Token } from '@dozer/currency'
import { useState, useCallback, useMemo, useEffect, FC, ReactNode } from 'react'
import { TradeType } from '../components/utils/TradeType'
import { useNetwork, useSettings, useTrade } from '@dozer/zustand'
import { SwapStatsDisclosure, SettingsOverlay } from '../components'
import { Checker, EventType, useWebSocketGeneric } from '@dozer/higmi'
import { SwapReviewModalLegacy } from '../components/SwapReviewModal'
import { warningSeverity } from '../components/utils/functions'
import { useRouter } from 'next/router'
import { api, RouterOutputs } from 'utils/api'
import { generateSSGHelper } from '@dozer/api/src/helpers/ssgHelper'
import type { GetStaticProps } from 'next'
import type { dbPoolWithTokens, Pair } from '@dozer/api'
import { tr } from 'date-fns/locale'
import BlockTracker from '@dozer/higmi/components/BlockTracker/BlockTracker'

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
    // revalidate: 3600,
  }
}

const Home = () => {
  // const utils = api.useUtils()
  // useWebSocketGeneric((message) => {
  //   if (message.type == EventType.NEW_VERTEX_ACCEPTED || message.type == EventType.VERTEX_METADATA_CHANGED) {
  //     // console.log('new message', message)
  //     // TODO! Study how to optimize this invalidate when new block comes.
  //     // utils.getPools.all.invalidate()
  //     // utils.getTokens.all.invalidate()
  //     // utils.getTokens.all.invalidate()
  //   }
  // }, true)
  return (
    <Layout>
      <SwapWidget token0_idx={'2'} token1_idx={'0'} />
      <BlockTracker client={api} />
    </Layout>
  )
}

export default Home

export const SwapWidget: FC<{ token0_idx: string; token1_idx: string }> = ({ token0_idx, token1_idx }) => {
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

  const [initialToken0, setInitialToken0] = useState(
    toToken(
      tokens.filter((token) => {
        return token.id == token0_idx
      })[0]
    )
  )

  const [initialToken1, setInitialToken1] = useState(
    toToken(
      tokens.filter((token) => {
        return token.id == token1_idx
      })[0]
    )
  )

  useEffect(() => {
    setTokens([initialToken0, initialToken1])
  }, [network, initialToken0, initialToken1])

  const [input0, setInput0] = useState<string>('')
  const [[token0, token1], setTokens] = useState<[Token | undefined, Token | undefined]>([initialToken0, initialToken1])
  const [input1, setInput1] = useState<string>('')
  const [tradeType, setTradeType] = useState<TradeType>(TradeType.EXACT_INPUT)
  const [selectedPool, setSelectedPool] = useState<Pair>()
  const [priceImpact, setPriceImpact] = useState<number>()
  const utils = api.useUtils()
  const trade = useTrade()
  const [fetchLoading, setFetchLoading] = useState<boolean>(false)

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

  const switchCurrencies = async () => {
    setTokens(([prevSrc, prevDst]) => [prevDst, prevSrc])
    if (tradeType == TradeType.EXACT_INPUT) {
      setInput1('')
    } else {
      setInput0('')
    }
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
    const fetchData = async () => {
      setFetchLoading(true)
      if (tradeType == TradeType.EXACT_INPUT) {
        const response =
          selectedPool && token0
            ? await utils.getPools.quote_exact_tokens_for_tokens.fetch({
                id: selectedPool?.id,
                amount_in: parseFloat(input0),
                token_in: token0?.uuid,
              })
            : undefined
        // set state with the result if `isSubscribed` is true

        setInput1(response && response.amount_out != 0 ? response.amount_out.toFixed(2) : '')
        setPriceImpact(response ? response.price_impact : 0)
      } else {
        const response =
          selectedPool && token0
            ? await utils.getPools.quote_tokens_for_exact_tokens.fetch({
                id: selectedPool?.id,
                amount_out: parseFloat(input1),
                token_in: token0?.uuid,
              })
            : undefined

        setInput0(response && response.amount_in != 0 ? response.amount_in.toFixed(2) : '')
        setPriceImpact(response ? response.price_impact : 0)
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
          trade.setPriceImpact(priceImpact || 0)
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
  }, [pools, token0, token1, input0, input1, prices, network, tokens, priceImpact, selectedPool])

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
    <Widget id="swap" maxWidth={400}>
      <Widget.Content>
        <div className={classNames('p-3 mx-0.5 grid grid-cols-2 items-center pb-4 font-medium')}>
          <App.NavItemList hideOnMobile={false}>
            <App.NavItem href="/" label="Swap" />
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
          loading={tradeType == TradeType.EXACT_OUTPUT && fetchLoading}
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
            disabled={token0?.symbol && token1?.symbol && selectedPool ? false : true}
            className="p-3"
            value={selectedPool ? (token0?.symbol && token1?.symbol ? input1 : '') : ''}
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
            loading={tradeType == TradeType.EXACT_INPUT && fetchLoading}
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
                      return (
                        <SwapButton
                          setOpen={setOpen}
                          priceImpact={priceImpact || 0}
                          outputAmount={parseFloat(input1) || 0}
                        />
                      )
                    }}
                  </SwapReviewModalLegacy>
                </Checker.Amounts>
              </Checker.Pool>
            </Checker.Connected>
          </div>
        </div>
      </Widget.Content>
    </Widget>
  )
}

export const SwapButton: FC<{
  setOpen(open: boolean): void
  priceImpact: number
  outputAmount: number
}> = ({ setOpen, priceImpact, outputAmount }) => {
  const slippageTolerance = useSettings((state) => state.slippageTolerance)

  const priceImpactSeverity = useMemo(() => warningSeverity(priceImpact), [priceImpact])
  const priceImpactTooHigh = priceImpactSeverity > 3
  const { expertMode } = useSettings()

  const onClick = useCallback(() => {
    setOpen(true)
  }, [setOpen])

  return (
    <Button
      testdata-id="swap-button"
      fullWidth
      onClick={onClick}
      disabled={
        (priceImpactTooHigh && !expertMode) ||
        Number(
          (outputAmount ? outputAmount : 0 * (1 - (slippageTolerance ? slippageTolerance : 0) / 100)).toFixed(2)
        ) == 0
      }
      size="md"
      color={(priceImpactTooHigh && !expertMode) || priceImpactSeverity > 2 ? 'red' : 'blue'}
      {...(Boolean(priceImpactSeverity > 2) && {
        title: 'Enable expert mode to swap with high price impact',
      })}
    >
      {false
        ? 'Finding Best Price'
        : priceImpactTooHigh && !expertMode
        ? 'High Price Impact'
        : priceImpactSeverity > 2
        ? 'Swap Anyway'
        : 'Swap'}
    </Button>
  )
}
