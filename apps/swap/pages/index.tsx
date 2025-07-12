import { ArrowTopRightOnSquareIcon, ChevronDownIcon } from '@heroicons/react/24/solid'
import { App, Button, classNames, Widget } from '@dozer/ui'
import { Layout } from '../components/Layout'
import { CurrencyInput } from '../components/CurrencyInput'
import { Token } from '@dozer/currency'
import { useState, useCallback, useMemo, useEffect, FC, ReactNode } from 'react'
import { TradeType } from '../components/utils/TradeType'
import { useAccount, useNetwork, useSettings, useTrade } from '@dozer/zustand'
import { useDebounce } from '@dozer/hooks'
import { SwapStatsDisclosure, SettingsOverlay, SwapLowBalanceBridge, SwapSideBridgeSuggestion } from '../components'
import { BridgeProvider, Checker, EventType, useWebSocketGeneric } from '@dozer/higmi'
import { SwapReviewModalLegacy } from '../components/SwapReviewModal'
import { warningSeverity } from '../components/utils/functions'
import { useRouter } from 'next/router'
import { api, RouterOutputs } from 'utils/api'
import { generateSSGHelper } from '@dozer/api/src/helpers/ssgHelper'
import type { GetStaticProps } from 'next'
import type { dbPoolWithTokens, Pair } from '@dozer/api'
import { tr } from 'date-fns/locale'
import BlockTracker from '@dozer/higmi/components/BlockTracker/BlockTracker'
import Image from 'next/legacy/image'
import bridgeIcon from '../public/bridge-icon.jpeg'

type TokenOutputArray = RouterOutputs['getTokens']['all']

type ElementType<T> = T extends (infer U)[] ? U : never
type TokenOutput = ElementType<TokenOutputArray>

const toToken = (token: any): Token | undefined => {
  if (!token) {
    return undefined
  }
  return new Token({
    ...token,
    imageUrl: token.imageUrl || undefined,
  })
}

const toPair = (pool: any): Pair => {
  return {
    ...pool,
    token0: toToken(pool.token0),
    token1: toToken(pool.token1),
  }
}

export const getStaticProps: GetStaticProps = async () => {
  const ssg = generateSSGHelper()
  await ssg.getPools.all.prefetch()
  await ssg.getTokens.all.prefetch()
  await ssg.getPrices.all.prefetch()
  await ssg.getNetwork.getBestBlock.prefetch()
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
  const trade = useTrade()
  const balances = useAccount((state) => state.balance)

  return (
    <BridgeProvider>
      <Layout>
        <div className="flex flex-col md:flex-row justify-center gap-4 max-w-[800px] mx-auto">
          <div className="flex flex-col gap-4" style={{ maxWidth: '400px' }}>
            <SwapWidget token0_idx={'2'} token1_idx={'0'} />
            <div
              className="flex gap-3 justify-between items-center p-4 rounded-lg border transition-colors cursor-pointer bg-stone-800/50 border-stone-700 hover:bg-stone-800"
              onClick={() => (window.location.href = '/bridge')}
            >
              <div className="flex gap-4 items-center">
                <div className="flex justify-center items-center w-12 h-12 rounded-full bg-blue-900/20">
                  <Image src={bridgeIcon} width={44} height={44} alt="Bridge" className="object-cover rounded-full" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">Hathor-Arbitrum Bridge</span>
                  <span className="text-xs text-gray-400">Transfer tokens between networks</span>
                </div>
              </div>
              <ArrowTopRightOnSquareIcon width={20} height={20} className="text-gray-400" />
            </div>
          </div>
        </div>
        <BlockTracker client={api} />
      </Layout>
    </BridgeProvider>
  )
}

export default Home

export const SwapWidget: FC<{ token0_idx: string; token1_idx: string }> = ({ token0_idx, token1_idx }) => {
  const { data: pools } = api.getPools.all.useQuery()
  const { data: tokens } = api.getTokens.all.useQuery()
  const { data: prices } = api.getPrices.all.useQuery()
  const balances = useAccount((state) => state.balance)
  const router = useRouter()

  // Find HTR and hUSDC tokens for defaults
  const htrToken = tokens?.find(token => token.uuid === '00') // HTR token
  const usdcToken = tokens?.find(token => token.symbol === 'hUSDC') // hUSDC token

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
    tokens
      ? toToken(htrToken || tokens.filter((token) => token.id == token0_idx)[0])
      : undefined
  )

  const [initialToken1, setInitialToken1] = useState(
    tokens
      ? toToken(usdcToken || tokens.filter((token) => token.id == token1_idx)[0])
      : undefined
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

  // Debounce input values to reduce API calls
  const debouncedInput0 = useDebounce(input0, 300)
  const debouncedInput1 = useDebounce(input1, 300)

  // Show loading state when user is typing but before debounced value updates
  const isTyping = useMemo(() => {
    if (tradeType === TradeType.EXACT_INPUT) {
      return input0 !== debouncedInput0 && input0 !== ''
    } else {
      return input1 !== debouncedInput1 && input1 !== ''
    }
  }, [input0, debouncedInput0, input1, debouncedInput1, tradeType])

  const onInput0 = async (val: string) => {
    setInput0(val)
    if (!val) {
      setInput1('')
      trade.setRouteInfo(undefined) // Clear route info immediately
    } else {
      // Clear the output immediately when user starts typing to prevent showing stale data
      if (tradeType === TradeType.EXACT_INPUT) {
        setInput1('')
        trade.setRouteInfo(undefined)
      }
    }
    setTradeType(TradeType.EXACT_INPUT)
  }

  const onInput1 = async (val: string) => {
    setInput1(val)
    if (!val) {
      setInput0('')
      trade.setRouteInfo(undefined) // Clear route info immediately
    } else {
      // Clear the input immediately when user starts typing to prevent showing stale data
      if (tradeType === TradeType.EXACT_OUTPUT) {
        setInput0('')
        trade.setRouteInfo(undefined)
      }
    }
    setTradeType(TradeType.EXACT_OUTPUT)
  }

  const switchCurrencies = async () => {
    setTokens(([prevSrc, prevDst]) => [prevDst, prevSrc])
    
    // Swap the input values and trade type
    const tempInput0 = input0
    const tempInput1 = input1
    
    setInput0(tempInput1)
    setInput1(tempInput0)
    
    // Invert the trade type
    setTradeType(tradeType === TradeType.EXACT_INPUT ? TradeType.EXACT_OUTPUT : TradeType.EXACT_INPUT)
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
          token0 && token1 && parseFloat(debouncedInput0) > 0
            ? await utils.getPools.quote.fetch({
                amountIn: parseFloat(debouncedInput0),
                tokenIn: token0?.uuid,
                tokenOut: token1?.uuid,
                maxHops: 3,
              })
            : undefined

        const quoteData = response // Handle both nested and direct response
        setInput1(quoteData && quoteData.amountOut != 0 ? quoteData.amountOut.toFixed(2) : '')
        setPriceImpact(quoteData ? quoteData.priceImpact : 0)

        // Update route info for RouteDisplay component
        if (quoteData) {
          trade.setRouteInfo({
            path: quoteData.path || [],
            amounts: quoteData.amounts || [],
            amountOut: quoteData.amountOut,
            priceImpact: quoteData.priceImpact,
            poolPath: quoteData.poolPath, // Add pool path for contract execution
          })
        } else {
          trade.setRouteInfo(undefined)
        }
      } else {
        // For exact output, use the new exact output quote endpoint
        const response =
          token0 && token1 && parseFloat(debouncedInput1) > 0
            ? await utils.getPools.quoteExactOutput.fetch({
                amountOut: parseFloat(debouncedInput1),
                tokenIn: token0?.uuid,
                tokenOut: token1?.uuid,
                maxHops: 3,
              })
            : undefined

        const quoteData = response // Handle both nested and direct response
        setInput0(quoteData && quoteData.amountIn != 0 ? quoteData.amountIn.toFixed(2) : '')
        setPriceImpact(quoteData ? quoteData.priceImpact : 0)

        // Update route info for RouteDisplay component
        if (quoteData) {
          trade.setRouteInfo({
            path: quoteData.path || [],
            amounts: quoteData.amounts || [],
            amountOut: parseFloat(debouncedInput1),
            priceImpact: quoteData.priceImpact,
            poolPath: quoteData.poolPath, // Add pool path for contract execution
          })
        } else {
          trade.setRouteInfo(undefined)
        }
      }
    }
    const selected = pools?.find((pool) => {
      const uuid0 = pool.token0?.uuid
      const uuid1 = pool.token1?.uuid
      const checker = (arr: (string | undefined)[], target: (string | undefined)[]) =>
        target.every((v) => arr.includes(v))
      const result = checker([token0?.uuid, token1?.uuid], [uuid0, uuid1])
      return result
    })
    if (selected) {
      setSelectedPool(toPair(selected))
    }

    // call the function - now we only need both tokens selected and an input amount
    if (
      token0 &&
      token1 &&
      ((tradeType === TradeType.EXACT_INPUT && debouncedInput0) || (tradeType === TradeType.EXACT_OUTPUT && debouncedInput1))
    ) {
      fetchData()
        .then(() => {
          setFetchLoading(false)
          trade.setMainCurrency(token0)
          trade.setOtherCurrency(token1)
          trade.setMainCurrencyPrice(token0 && prices ? prices[token0?.uuid] : 0)
          trade.setOtherCurrencyPrice(token1 && prices ? prices[token1?.uuid] : 0)
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
  }, [pools, token0, token1, debouncedInput0, debouncedInput1, prices, network, tokens])

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
          disabled={!token0 || !token1}
          value={input0}
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
          loading={tradeType == TradeType.EXACT_OUTPUT && (fetchLoading || isTyping)}
          prices={prices || {}}
          tokens={
            tokens
              ? tokens
                  .filter((token) => !token.custom)
                  .map((token) => {
                    // Handle all possible null values by converting to undefined
                    return new Token({
                      chainId: token.chainId,
                      uuid: token.uuid,
                      decimals: token.decimals,
                      name: token.name,
                      symbol: token.symbol,
                      imageUrl: token.imageUrl || undefined,
                      bridged: !!token.bridged,
                      originalAddress: token.originalAddress || undefined,
                      sourceChain: token.sourceChain || undefined,
                      targetChain: token.targetChain || undefined,
                    })
                  })
              : []
          }
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
            disabled={!token0 || !token1}
            className="p-3"
            value={input1}
            onChange={onInput1}
            currency={token1}
            onSelect={_setToken1}
            hidePercentageButtons={true}
            // customTokenMap={customTokensMap}
            // onAddToken={addCustomToken}
            // onRemoveToken={removeCustomToken}
            chainId={network}
            // tokenMap={tokenMap}
            inputType={TradeType.EXACT_OUTPUT}
            tradeType={tradeType}
            loading={tradeType == TradeType.EXACT_INPUT && (fetchLoading || isTyping)}
            prices={prices || {}}
            tokens={
              tokens
                ? tokens
                    .filter((token) => !token.custom)
                    .map((token) => {
                      // Handle all possible null values by converting to undefined
                      return new Token({
                        chainId: token.chainId,
                        uuid: token.uuid,
                        decimals: token.decimals,
                        name: token.name,
                        symbol: token.symbol,
                        imageUrl: token.imageUrl || undefined,
                        bridged: !!token.bridged,
                        originalAddress: token.originalAddress || undefined,
                        sourceChain: token.sourceChain || undefined,
                        targetChain: token.targetChain || undefined,
                      })
                    })
                : []
            }
            // isWrap={isWrap}
          />
          {/* Hide route/price impact details when tokens not chosen or no input values */}
          {token0 && token1 && (input0 || input1) && <SwapStatsDisclosure prices={prices || {}} loading={fetchLoading || isTyping} />}

          {/* Show bridge suggestion when balance is low */}
          {/* <SwapLowBalanceBridge
            token={token0}
            hasLowBalance={
              !!(
                token0?.bridged &&
                Number(input0) > 0 &&
                (balances.find((bal) => bal.token_uuid === token0.uuid)?.token_balance || 0) < Number(input0) * 100
              )
            }
          /> */}

          <div className="p-3 pt-0">
            <Checker.Connected fullWidth size="md">
              <Checker.Pool fullWidth size="md" poolExist={token0 && token1 ? true : false}>
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
