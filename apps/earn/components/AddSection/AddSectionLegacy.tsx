import { Amount } from '@dozer/currency'
import { useIsMounted } from '@dozer/hooks'
import { Button } from '@dozer/ui'
import { Checker } from '@dozer/higmi'
import { FC, useEffect, useMemo, useState } from 'react'

import { AddSectionReviewModalLegacy } from './AddSectionReviewModalLegacy'
import { AddSectionWidget } from './AddSectionWidget'
import { Pair, toToken } from '@dozer/api'
import { TradeType, useTrade } from '@dozer/zustand'
import { api } from '../../utils/api'

export const AddSectionLegacy: FC<{ pool: Pair; prices: { [key: string]: number } }> = ({ pool, prices }) => {
  const isMounted = useIsMounted()
  const token0 = toToken(pool.token0)
  const token1 = toToken(pool.token1)
  const [input0, setInput0] = useState<string>('')
  const [input1, setInput1] = useState<string>('')
  const [tradeType, setTradeType] = useState<TradeType>(TradeType.EXACT_INPUT)
  const trade = useTrade()
  const utils = api.useUtils()
  const [fetchLoading, setFetchLoading] = useState<boolean>(false)

  // const {
  //   data: [poolState, pool],
  // } = usePair(pair.chainId, token0, token1)

  const [parsedInput0, parsedInput1] = useMemo(() => {
    return [parseInt((Number(input0) * 100).toString()), parseInt((Number(input1) * 100).toString())]
  }, [input0, input1])

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
        const response = token0
          ? await utils.getPools.front_quote_add_liquidity_in.fetch({
              id: pool.id,
              amount_in: parseFloat(input0),
              token_in: token0?.uuid,
            })
          : undefined
        // set state with the result if `isSubscribed` is true

        setInput1(response && response != 0 ? response.toFixed(2) : '')
      } else {
        const response = token0
          ? await utils.getPools.front_quote_add_liquidity_out.fetch({
              id: pool?.id,
              amount_out: parseFloat(input1),
              token_in: token0?.uuid,
            })
          : undefined

        setInput0(response && response != 0 ? response.toFixed(2) : '')
      }
    }

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
          trade.setPool(pool)
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
  }, [input0, input1, prices])

  return useMemo(() => {
    return (
      <AddSectionReviewModalLegacy
        poolState={3}
        chainId={pool.chainId}
        token0={token0}
        token1={token1}
        input0={Amount.fromFractionalAmount(token0, parsedInput0, 100)}
        input1={Amount.fromFractionalAmount(token1, parsedInput1, 100)}
        prices={prices}
      >
        {({ setOpen }) => (
          <AddSectionWidget
            isLoading={fetchLoading}
            tradeType={tradeType}
            isFarm={false}
            chainId={pool.chainId}
            input0={input0}
            input1={input1}
            token0={token0}
            token1={token1}
            prices={prices}
            onInput0={onInput0}
            onInput1={onInput1}
          >
            <Checker.Connected fullWidth size="md">
              {/* <Checker.Custom
                showGuardIfTrue={
                  isMounted
                  // && [PairState.NOT_EXISTS, PairState.INVALID].includes(poolState)
                }
                guard={
                  <Button size="md" fullWidth disabled={true}>
                    Pool Not Found
                  </Button>
                }
              > */}
              {/* <Checker.Network fullWidth size="md" chainId={pair.chainId}> */}
              <Checker.Amounts
                fullWidth
                size="md"
                // chainId={pair.chainId}
                // fundSource={FundSource.WALLET}
                // amounts={[parsedInput0, parsedInput1]}
                amount={Number(input0)}
                token={token0}
              >
                <Button fullWidth onClick={() => setOpen(true)} disabled={!input0 || !input1} size="md">
                  {input0 && input1 ? 'Add Liquidity' : 'Enter an amount'}
                </Button>
              </Checker.Amounts>
              {/* </Checker.Network> */}
              {/* </Checker.Custom> */}
            </Checker.Connected>
          </AddSectionWidget>
        )}
      </AddSectionReviewModalLegacy>
    )
  }, [
    input0,
    input1,
    isMounted,
    onInput0,
    onInput1,
    pool.chainId,
    // pair.farm,
    parsedInput0,
    parsedInput1,
    // poolState,
    token0,
    token1,
    prices,
  ])
}
