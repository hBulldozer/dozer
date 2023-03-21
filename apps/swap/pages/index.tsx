import { ChevronDownIcon } from '@heroicons/react/solid'
import { App, Button, classNames, Container, Link, Typography, Widget } from '@dozer/ui'
import { Layout } from '../components/Layout'
import { CurrencyInput } from '../components/CurrencyInput'
import { getTokens, Token } from '@dozer/currency'
import { useState, useCallback, useMemo, useEffect, FC } from 'react'
import { useIsMounted } from '@dozer/hooks'
import { TradeType } from '../components/utils/TradeType'
import { useNetwork, useSettings, useTrade } from '@dozer/zustand'
import { ChainId } from '@dozer/chain'
import { usePrices } from '@dozer/react-query'
import { SwapStatsDisclosure, SettingsOverlay } from '../components'
import { Checker } from '@dozer/higmi'
import { SwapReviewModalLegacy } from '../components/SwapReviewModal'
import { warningSeverity } from '../components/utils/functions'

const Home = () => {
  const isMounted = useIsMounted()
  const network = useNetwork((state) => state.network)

  const inputToken = useMemo(() => {
    return getTokens(network).find((obj) => {
      return obj.symbol == 'DZR'
    })
  }, [])

  const outputToken = useMemo(() => {
    return getTokens(network).find((obj) => {
      return obj.symbol == 'HTR'
    })
  }, [])

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
    setPool,
    setPriceImpact,
  } = useTrade()
  const [poolExist, setPoolExist] = useState(true)

  const { data: prices } = usePrices(network)

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
    const fetchPool = async () => {
      if (await setPool()) {
        setPoolExist(true)
      } else {
        setPoolExist(false)
      }
    }
    setMainCurrency(token0 ? token0 : getTokens(network)[0])
    setOtherCurrency(token1 ? token1 : getTokens(network)[1])
    fetchPool()
    setPriceImpact()
    if (!poolExist) {
      setInput0('')
      setAmountSpecified(0)
      setOutputAmount()
      // setInput1('')
    } else {
      setAmountSpecified(Number(input0))
      setMainCurrencyPrice(prices && token0 ? prices[token0.uuid] : 0)
      setOtherCurrencyPrice(prices && token1 ? prices[token1.uuid] : 0)
      setOutputAmount()
      // setInput1(outputAmount ? outputAmount.toString() : '')
    }
  }, [outputAmount, token0, token1, input0, input1, prices, network, poolExist])

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
            disabled={token0?.symbol && token1?.symbol && poolExist ? false : true}
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
              value={poolExist ? (outputAmount ? outputAmount.toString() : '') : ''}
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
              // isWrap={isWrap}
            />
            <SwapStatsDisclosure />
            <div className="p-3 pt-0">
              <Checker.Connected fullWidth size="md">
                <Checker.Pool fullWidth size="md" poolExist={poolExist}>
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
