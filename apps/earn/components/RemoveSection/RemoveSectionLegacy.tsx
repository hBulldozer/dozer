import { Amount } from '@dozer/currency'
import { FundSource, useIsMounted } from '@dozer/hooks'
import { Percent } from '@dozer/math'
import { Button, Dots } from '@dozer/ui'
import { Approve, Checker } from '@dozer/higmi'
import { Dispatch, FC, SetStateAction, useCallback, useMemo, useState } from 'react'

import { useAccount, useNetwork, useSettings } from '@dozer/zustand'
import { RemoveSectionWidget } from './RemoveSectionWidget'
import { Pair } from '../../utils/Pair'
import { useTokensFromPair } from '../../utils/useTokensFromPair'
import toToken from '../../utils/toToken'
import { dbPoolWithTokens } from '../../interfaces'

interface RemoveSectionLegacyProps {
  pool: dbPoolWithTokens
  prices: { [key: string]: number }
}

const DEFAULT_REMOVE_LIQUIDITY_SLIPPAGE_TOLERANCE = new Percent(5, 100)

export const RemoveSectionLegacy: FC<RemoveSectionLegacyProps> = ({ pool, prices }) => {
  const token0 = toToken(pool.token0)
  const token1 = toToken(pool.token1)
  // const liquidityToken = pool.liquidityToken
  const { network } = useNetwork()
  const isMounted = useIsMounted()
  const { address, balance } = useAccount()
  // const deadline = useTransactionDeadline(pair.chainId)
  // const contract = useSushiSwapRouterContract(pair.chainId)
  const { slippageTolerance } = useSettings()
  // const [, { createNotification }] = useNotifications(address)

  const slippagePercent = useMemo(
    () =>
      slippageTolerance ? new Percent(slippageTolerance * 100, 10_000) : DEFAULT_REMOVE_LIQUIDITY_SLIPPAGE_TOLERANCE,
    [slippageTolerance]
  )

  const [percentage, setPercentage] = useState<string>('')
  const percentToRemove = useMemo(() => new Percent(percentage, 100), [percentage])

  const poolState = 1
  const totalSupply = 100
  // useTotalSupply(liquidityToken)

  const [reserve0, reserve1] = useMemo(() => {
    return [pool?.reserve0, pool?.reserve1]
  }, [pool?.reserve0, pool?.reserve1])

  const underlying = [Amount.fromRawAmount(toToken(pool.token0), 10), Amount.fromRawAmount(toToken(pool.token1), 10)]
  // useUnderlyingTokenBalanceFromPair({
  //   reserve0,
  //   reserve1,
  //   totalSupply,
  //   balance: balance?.[FundSource.WALLET],
  // })

  const [underlying0, underlying1] = underlying

  const currencyAToRemove = useMemo(
    () =>
      token0
        ? percentToRemove && percentToRemove.greaterThan('0') && underlying0
          ? Amount.fromRawAmount(token0, percentToRemove.multiply(underlying0.quotient).quotient || '0')
          : Amount.fromRawAmount(token0, '0')
        : undefined,
    [percentToRemove, token0, underlying0]
  )

  const currencyBToRemove = useMemo(
    () =>
      token1
        ? percentToRemove && percentToRemove.greaterThan('0') && underlying1
          ? Amount.fromRawAmount(token1, percentToRemove.multiply(underlying1.quotient).quotient || '0')
          : Amount.fromRawAmount(token1, '0')
        : undefined,
    [percentToRemove, token1, underlying1]
  )

  const [minAmount0, minAmount1] = useMemo(() => {
    return [
      currencyAToRemove
        ? Amount.fromRawAmount(
            currencyAToRemove.currency,
            Number(currencyAToRemove.toFixed(2)) * (1 - slippageTolerance)
            // calculateSlippageAmount(currencyAToRemove, slippagePercent)[0]
          )
        : undefined,
      currencyBToRemove
        ? Amount.fromRawAmount(
            currencyBToRemove.currency,
            Number(currencyBToRemove.toFixed(2)) * (1 - slippageTolerance)
          )
        : undefined,
    ]
  }, [currencyAToRemove, slippageTolerance, currencyBToRemove])

  const amountToRemove = Amount.fromRawAmount(toToken(pool.token0), 10)
  // useMemo(
  //   () => balance?.[FundSource.WALLET].multiply(percentToRemove),
  //   [balance, percentToRemove]
  // )

  // const onSettled = useCallback(
  //   (data: SendTransactionResult | undefined) => {
  //     if (!data || !chain?.id) return
  //     const ts = new Date().getTime()
  //     createNotification({
  //       type: 'burn',
  //       chainId: chain.id,
  //       txHash: data.hash,
  //       promise: data.wait(),
  //       summary: {
  //         pending: `Removing liquidity from the ${token0.symbol}/${token1.symbol} pair`,
  //         completed: `Successfully removed liquidity from the ${token0.symbol}/${token1.symbol} pair`,
  //         failed: 'Something went wrong when removing liquidity',
  //       },
  //       timestamp: ts,
  //       groupTimestamp: ts,
  //     })
  //   },
  //   [chain?.id, createNotification, token0.symbol, token1.symbol]
  // )

  // const prepare = useCallback(
  //   async (setRequest: Dispatch<SetStateAction<(TransactionRequest & { to: string }) | undefined>>) => {
  //     try {
  //       if (
  //         !token0 ||
  //         !token1 ||
  //         !chain?.id ||
  //         !contract ||
  //         !underlying0 ||
  //         !underlying1 ||
  //         !address ||
  //         !pool ||
  //         !balance?.[FundSource.WALLET] ||
  //         !minAmount0 ||
  //         !minAmount1 ||
  //         !deadline
  //       ) {
  //         return
  //       }

  //       const withNative =
  //         Native.onChain(pair.chainId).wrapped.address === pool.token0.address ||
  //         Native.onChain(pair.chainId).wrapped.address === pool.token1.address

  //       let methodNames
  //       let args: any

  //       if (withNative) {
  //         const token1IsNative = Native.onChain(pair.chainId).wrapped.address === pool.token1.wrapped.address
  //         methodNames = ['removeLiquidityETH', 'removeLiquidityETHSupportingFeeOnTransferTokens']
  //         args = [
  //           token1IsNative ? pool.token0.wrapped.address : pool.token1.wrapped.address,
  //           balance[FundSource.WALLET].multiply(percentToRemove).quotient.toString(),
  //           token1IsNative ? minAmount0.quotient.toString() : minAmount1.quotient.toString(),
  //           token1IsNative ? minAmount1.quotient.toString() : minAmount0.quotient.toString(),
  //           address,
  //           deadline.toHexString(),
  //         ]
  //       } else {
  //         methodNames = ['removeLiquidity']
  //         args = [
  //           pool.token0.wrapped.address,
  //           pool.token1.wrapped.address,
  //           balance[FundSource.WALLET].multiply(percentToRemove).quotient.toString(),
  //           minAmount0.quotient.toString(),
  //           minAmount1.quotient.toString(),
  //           address,
  //           deadline.toHexString(),
  //         ]
  //       }

  //       const safeGasEstimates = await Promise.all(
  //         methodNames.map((methodName) =>
  //           contract.estimateGas[methodName](...args)
  //             .then(calculateGasMargin)
  //             .catch()
  //         )
  //       )

  //       const indexOfSuccessfulEstimation = safeGasEstimates.findIndex((safeGasEstimate) =>
  //         BigNumber.isBigNumber(safeGasEstimate)
  //       )

  //       if (indexOfSuccessfulEstimation !== -1) {
  //         const methodName = methodNames[indexOfSuccessfulEstimation]
  //         const safeGasEstimate = safeGasEstimates[indexOfSuccessfulEstimation]

  //         setRequest({
  //           from: address,
  //           to: contract.address,
  //           data: contract.interface.encodeFunctionData(methodName, args),
  //           gasLimit: safeGasEstimate,
  //         })
  //       }
  //     } catch (e: unknown) {
  //       //
  //     }
  //   },
  //   [
  //     token0,
  //     token1,
  //     chain?.id,
  //     contract,
  //     underlying0,
  //     underlying1,
  //     address,
  //     pool,
  //     balance,
  //     minAmount0,
  //     minAmount1,
  //     pair.chainId,
  //     percentToRemove,
  //     deadline,
  //   ]
  // )

  // const { sendTransaction, isLoading: isWritePending } = useSendTransaction({
  //   chainId: pair.chainId,
  //   prepare,
  //   onSettled,
  // })

  return (
    <div>
      <RemoveSectionWidget
        // isFarm={!!pair.farm}
        chainId={pool.chainId}
        percentage={percentage}
        token0={token0}
        token1={token1}
        token0Minimum={minAmount0}
        token1Minimum={minAmount1}
        setPercentage={setPercentage}
        prices={prices}
      >
        <Checker.Connected fullWidth size="md">
          {/* <Checker.Custom
            showGuardIfTrue={isMounted && [PairState.NOT_EXISTS, PairState.INVALID].includes(poolState)}
            guard={
              <Button size="md" fullWidth disabled={true}>
                Pool Not Found
              </Button>
            }
          >
            <Checker.Network fullWidth size="md" chainId={pair.chainId}>
              <Checker.Custom
                showGuardIfTrue={+percentage <= 0}
                guard={
                  <Button size="md" fullWidth disabled={true}>
                    Enter Amount
                  </Button>
                }
              > */}
          <Approve
            onSuccess={() => {}}
            className="flex-grow !justify-end"
            components={
              <Approve.Components>
                <Approve.Token
                  size="md"
                  className="whitespace-nowrap"
                  fullWidth
                  amount={amountToRemove}
                  // address={getSushiSwapRouterContractConfig(pair.chainId).address as Address}
                />
              </Approve.Components>
            }
            render={({ approved }) => {
              return (
                <Button onClick={() => {}} fullWidth size="md" variant="filled" disabled={!approved}>
                  {'Remove Liquidity'}
                </Button>
              )
            }}
          />
          {/* </Checker.Custom>
            </Checker.Network>
          </Checker.Custom> */}
        </Checker.Connected>
      </RemoveSectionWidget>
    </div>
  )
}
