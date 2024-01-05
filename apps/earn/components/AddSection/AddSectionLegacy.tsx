import { Amount } from '@dozer/currency'
import { useIsMounted } from '@dozer/hooks'
import { Button, Dots } from '@dozer/ui'
import { Checker } from '@dozer/higmi'
import { FC, useCallback, useEffect, useMemo, useState } from 'react'

import { AddSectionReviewModalLegacy } from './AddSectionReviewModalLegacy'
import { AddSectionWidget } from './AddSectionWidget'
import { dbPoolWithTokens } from '@dozer/api'
import { toToken } from '@dozer/api'
import { useTrade } from '@dozer/zustand'

export const AddSectionLegacy: FC<{ pool: dbPoolWithTokens; prices: { [key: string]: number } }> = ({
  pool,
  prices,
}) => {
  const isMounted = useIsMounted()
  const token0 = toToken(pool.token0)
  const token1 = toToken(pool.token1)
  const [{ input0, input1 }, setTypedAmounts] = useState<{
    input0: string
    input1: string
  }>({ input0: '', input1: '' })
  const {
    setMainCurrency,
    setOtherCurrency,
    setMainCurrencyPrice,
    setOtherCurrencyPrice,
    setAmountSpecified,
    setOutputAmount,
    setPriceImpact,
    setPool,
  } = useTrade()
  // const {
  //   data: [poolState, pool],
  // } = usePair(pair.chainId, token0, token1)

  const [parsedInput0, parsedInput1] = useMemo(() => {
    return [parseInt((Number(input0) * 100).toString()), parseInt((Number(input1) * 100).toString())]
  }, [input0, input1])

  const onChangeToken0TypedAmount = useCallback(
    (value: string) => {
      const parsedAmount = Number(value)
      setTypedAmounts({
        input0: value,
        input1: parsedAmount
          ? ((parsedAmount * Number(pool.reserve1)) / (Number(pool.reserve0) + parsedAmount)).toFixed(2)
          : '',
      })
    },
    [pool]
  )

  const onChangeToken1TypedAmount = useCallback(
    (value: string) => {
      const parsedAmount = Number(value)
      setTypedAmounts({
        input0: parsedAmount
          ? ((parsedAmount * Number(pool.reserve0)) / (Number(pool.reserve1) + parsedAmount)).toFixed(2)
          : '',
        input1: value,
      })
    },
    [pool]
  )

  useEffect(() => {
    pool &&
      setPool({
        token1: token1,
        token2: token0,
        token1_balance: pool.token0.uuid == token1?.uuid ? Number(pool.reserve1) : Number(pool.reserve0),
        token2_balance: pool.token1.uuid == token0?.uuid ? Number(pool.reserve0) : Number(pool.reserve1),
      })
    setMainCurrency(token0 ? token0 : undefined)
    setOtherCurrency(token1 ? token1 : undefined)
    setPriceImpact()
    setAmountSpecified(Number(input0))
    setMainCurrencyPrice(prices && token0 ? Number(prices[token0.uuid]) : 0)
    setOtherCurrencyPrice(prices && token1 ? Number(prices[token1.uuid]) : 0)
    setOutputAmount()
  }, [input0, input1])

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
        {({ isWritePending, setOpen }) => (
          <AddSectionWidget
            isFarm={false}
            chainId={pool.chainId}
            input0={input0}
            input1={input1}
            token0={token0}
            token1={token1}
            prices={prices}
            onInput0={onChangeToken0TypedAmount}
            onInput1={onChangeToken1TypedAmount}
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
                <Button fullWidth onClick={() => setOpen(true)} disabled={isWritePending} size="md">
                  {isWritePending ? <Dots>Confirm transaction</Dots> : 'Add Liquidity'}
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
    onChangeToken0TypedAmount,
    onChangeToken1TypedAmount,
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
