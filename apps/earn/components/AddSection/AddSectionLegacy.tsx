// import { tryParseAmount } from '@dozer/currency'
import { Amount } from '@dozer/currency'
// import { Pair } from '@dozer/graph-client'
import { FundSource, useIsMounted } from '@dozer/hooks'
import { Button, Dots } from '@dozer/ui'
import {
  Checker,
  // , PairState, usePair
} from '@dozer/higmi'
import { FC, useCallback, useMemo, useState } from 'react'

import { useTokensFromPair } from '../../utils/useTokensFromPair'
import { Pair } from '../../utils/Pair'
import { AddSectionReviewModalLegacy } from './AddSectionReviewModalLegacy'
import { AddSectionWidget } from './AddSectionWidget'

export const AddSectionLegacy: FC<{ pair: Pair; prices: { [key: string]: number } }> = ({ pair, prices }) => {
  const isMounted = useIsMounted()
  const { token0, token1 } = useTokensFromPair(pair)
  const [{ input0, input1 }, setTypedAmounts] = useState<{
    input0: string
    input1: string
  }>({ input0: '', input1: '' })
  // const {
  //   data: [poolState, pool],
  // } = usePair(pair.chainId, token0, token1)

  const [parsedInput0, parsedInput1] = useMemo(() => {
    return [Amount.fromRawAmount(token0, Number(input0)), Amount.fromRawAmount(token1, Number(input1))]
  }, [input0, input1, token0, token1])

  const onChangeToken0TypedAmount = useCallback(
    (value: string) => {
      // if (poolState === PairState.NOT_EXISTS) {
      //   setTypedAmounts((prev) => ({
      //     ...prev,
      //     input0: value,
      //   }))
      // } else if (token0 && pool) {
      const parsedAmount = Amount.fromRawAmount(token0, Number(value))
      setTypedAmounts({
        input0: value,
        input1: parsedAmount
          ? // pool.priceOf(token0.wrapped).quote(parsedAmount.wrapped).toExact()
            '12345'
          : '',
      })
      // }
    },
    [
      // pool,
      // poolState,
      token0,
    ]
  )

  const onChangeToken1TypedAmount = useCallback(
    (value: string) => {
      // if (poolState === PairState.NOT_EXISTS) {
      //   setTypedAmounts((prev) => ({
      //     ...prev,
      //     input1: value,
      //   }))
      // } else if (token1 && pool) {
      const parsedAmount = Amount.fromRawAmount(token1, Number(value))
      setTypedAmounts({
        input0: parsedAmount
          ? // pool.priceOf(token1.wrapped).quote(parsedAmount.wrapped).toExact()
            '56789'
          : '',
        input1: value,
      })
      // }
    },
    [
      // pool,
      // poolState,
      token1,
    ]
  )

  return useMemo(() => {
    return (
      <AddSectionReviewModalLegacy
        poolState={3}
        chainId={pair.chainId}
        token0={token0}
        token1={token1}
        input0={parsedInput0}
        input1={parsedInput1}
        prices={prices}
      >
        {({ isWritePending, setOpen }) => (
          <AddSectionWidget
            isFarm={false}
            chainId={pair.chainId}
            input0={input0}
            input1={input1}
            token0={token0}
            token1={token1}
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
    pair.chainId,
    // pair.farm,
    parsedInput0,
    parsedInput1,
    // poolState,
    token0,
    token1,
  ])
}
