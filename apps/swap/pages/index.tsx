import { ChevronDownIcon } from '@heroicons/react/solid'
import { App, Button, classNames, Container, Link, Typography, Widget } from '@dozer/ui'
import { Layout } from '../components/Layout'
import { CurrencyInput } from '../components/CurrencyInput'
import { Token } from '@dozer/currency'
import { useState, useCallback, useMemo, useEffect } from 'react'
import { useIsMounted } from '@dozer/hooks'
import { TradeType } from '../components/utils/TradeType'
import { useNetwork, useTrade } from '@dozer/zustand'
import { ChainId } from '@dozer/chain'
import { usePrices } from '@dozer/react-query'

const Home = () => {
  const isMounted = useIsMounted()

  const inputToken = useMemo(() => {
    return new Token({ chainId: ChainId.HATHOR, uuid: '00', decimals: 2 })
  }, [])

  const outputToken = useMemo(() => {
    return new Token({ chainId: ChainId.HATHOR, uuid: '00', decimals: 2 })
  }, [])

  const [input0, setInput0] = useState<string>('')
  const [[token0, token1], setTokens] = useState<[Token | undefined, Token | undefined]>([inputToken, outputToken])
  const [input1, setInput1] = useState<string>('')
  const [tradeType, setTradeType] = useState<TradeType>(TradeType.EXACT_INPUT)
  const { outputAmount, setMainCurrencyPrice, setOtherCurrencyPrice, setAmountSpecified, setOutputAmount } = useTrade()

  const { data: prices } = usePrices()

  const network = useNetwork((state) => state.network)

  const onInput0 = (val: string) => {
    setTradeType(TradeType.EXACT_INPUT)
    setInput0(val)
    setAmountSpecified(Number(val))
    setMainCurrencyPrice(prices && token0 ? prices[token0.uuid] : 0)
    setOtherCurrencyPrice(prices && token1 ? prices[token1.uuid] : 0)
    setOutputAmount()
    setInput1(outputAmount ? outputAmount.toString() : '')
  }

  const onInput1 = useCallback((val: string) => {
    // setTradeType(TradeType.EXACT_OUTPUT)
    setInput1(val)
  }, [])

  const switchCurrencies = () => {
    setTokens(([prevSrc, prevDst]) => [prevDst, prevSrc])
    setAmountSpecified(Number(input0))
    setMainCurrencyPrice(prices && token0 ? prices[token0.uuid] : 0)
    setOtherCurrencyPrice(prices && token1 ? prices[token1.uuid] : 0)
    setOutputAmount()
    setInput1(outputAmount ? outputAmount.toString() : '')
  }

  const amounts = useMemo(() => [input0], [input0])

  useEffect(() => {
    setTokens([inputToken, outputToken])
    // setInput0(initialState.input0)
    setInput1('')
  }, [inputToken, outputToken])

  useEffect(() => {
    setAmountSpecified(Number(input0))
    setMainCurrencyPrice(prices && token0 ? prices[token0.uuid] : 0)
    setOtherCurrencyPrice(prices && token1 ? prices[token1.uuid] : 0)
    setOutputAmount()
    setInput1(outputAmount ? outputAmount.toString() : '')
  }, [outputAmount, token0, token1])

  const onSuccess = useCallback(() => {
    setInput0('')
    setInput1('')
  }, [])

  const _setToken0 = useCallback((currency: Token) => {
    setTokens(([prevSrc, prevDst]) => {
      return prevDst && currency.equals(prevDst) ? [prevDst, prevSrc] : [currency, prevDst]
    })
    // setTokens([currency, currency])
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
          </div>
          <CurrencyInput
            id={'swap-input-currency0'}
            className="p-3"
            disabled={token0?.symbol && token1?.symbol ? false : true}
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
              className="group bg-slate-700 p-0.5 border-2 border-slate-800 transition-all rounded-full hover:ring-2 hover:ring-slate-500 cursor-pointer"
            >
              <div className="transition-all rotate-0 group-hover:rotate-180 group-hover:delay-200">
                <ChevronDownIcon width={16} height={16} />
              </div>
            </button>
          </div>
          <div className="bg-slate-800">
            <CurrencyInput
              id={'swap-output-currency1'}
              disabled={true}
              className="p-3"
              value={input1}
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
          </div>
        </Widget.Content>
      </Widget>
    </Layout>
  )
}

export default Home
