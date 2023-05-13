import { ChainId } from '@dozer/chain'
import { Amount, Type } from '@dozer/currency'
import { Percent } from '@dozer/math'
import { Button, Dots } from '@dozer/ui'
import { Approve } from '@dozer/higmi'
import { FC, ReactNode, useMemo, useState } from 'react'
import { useSettings, useAccount, useNetwork } from '@dozer/zustand'
import { AddSectionReviewModal } from './AddSectionReviewModal'

interface AddSectionReviewModalLegacyProps {
  poolState: number
  chainId: ChainId
  token0: Type | undefined
  token1: Type | undefined
  input0: Amount<Type> | undefined
  input1: Amount<Type> | undefined
  children({ isWritePending, setOpen }: { isWritePending: boolean; setOpen(open: boolean): void }): ReactNode
  prices: { [key: string]: number }
}

export const AddSectionReviewModalLegacy: FC<AddSectionReviewModalLegacyProps> = ({
  poolState,
  chainId,
  input0,
  input1,
  children,
  prices,
}) => {
  // const deadline = useTransactionDeadline(chainId)
  const [open, setOpen] = useState(false)
  const { address } = useAccount()

  // const [, { createNotification }] = useNotifications(address)
  const { slippageTolerance } = useSettings()

  // const onSettled = useCallback(
  //   (data: SendTransactionResult | undefined) => {
  //     if (!data || !token0 || !token1) return

  //     const ts = new Date().getTime()
  //     createNotification({
  //       type: 'mint',
  //       chainId,
  //       txHash: data.hash,
  //       promise: data.wait(),
  //       summary: {
  //         pending: `Adding liquidity to the ${token0.symbol}/${token1.symbol} pair`,
  //         completed: `Successfully added liquidity to the ${token0.symbol}/${token1.symbol} pair`,
  //         failed: 'Something went wrong when adding liquidity',
  //       },
  //       timestamp: ts,
  //       groupTimestamp: ts,
  //     })
  //   },
  //   [chainId, createNotification, token0, token1]
  // )

  // const slippagePercent = useMemo(() => {
  //   return new Percent(Math.floor(slippageTolerance * 100), 10_000)
  // }, [slippageTolerance])

  // const [minAmount0, minAmount1] = useMemo(() => {
  //   return [
  //     input0 ? (poolState === 0 ? input0 : undefined) : undefined,
  //     input1 ? (poolState === 0 ? input1 : undefined) : undefined,
  //   ]
  // }, [
  //   poolState,
  //   input0,
  //   input1,
  //   // slippagePercent
  // ])

  // const prepare = useCallback(
  //   async (setRequest: Dispatch<SetStateAction<(TransactionRequest & { to: string }) | undefined>>) => {
  //     try {
  //       if (
  //         !token0 ||
  //         !token1 ||
  //         !chain?.id ||
  //         !contract ||
  //         !input0 ||
  //         !input1 ||
  //         !address ||
  //         !minAmount0 ||
  //         !minAmount1 ||
  //         !deadline
  //       )
  //         return
  //       const withNative = token0.isNative || token1.isNative

  //       if (withNative) {
  //         const value = BigNumber.from((token1.isNative ? input1 : input0).quotient.toString())
  //         const args = [
  //           (token1.isNative ? token0 : token1).wrapped.address as Address,
  //           BigNumber.from((token1.isNative ? input0 : input1).quotient.toString()),
  //           BigNumber.from((token1.isNative ? minAmount0 : minAmount1).quotient.toString()),
  //           BigNumber.from((token1.isNative ? minAmount1 : minAmount0).quotient.toString()),
  //           address,
  //           BigNumber.from(deadline.toHexString()),
  //         ] as const

  //         const gasLimit = await contract.estimateGas.addLiquidityETH(...args, {
  //           value,
  //         })
  //         setRequest({
  //           from: address,
  //           to: contract.address,
  //           data: contract.interface.encodeFunctionData('addLiquidityETH', args),
  //           value,
  //           gasLimit: calculateGasMargin(gasLimit),
  //         })
  //       } else {
  //         const args = [
  //           token0.wrapped.address as Address,
  //           token1.wrapped.address as Address,
  //           BigNumber.from(input0.quotient.toString()),
  //           BigNumber.from(input1.quotient.toString()),
  //           BigNumber.from(minAmount0.quotient.toString()),
  //           BigNumber.from(minAmount1.quotient.toString()),
  //           address,
  //           BigNumber.from(deadline.toHexString()),
  //         ] as const

  //         const gasLimit = await contract.estimateGas.addLiquidity(...args, {})
  //         setRequest({
  //           from: address,
  //           to: contract.address,
  //           data: contract.interface.encodeFunctionData('addLiquidity', args),
  //           gasLimit: calculateGasMargin(gasLimit),
  //         })
  //       }
  //     } catch (e: unknown) {
  //       //
  //     }
  //   },
  //   [token0, token1, chain?.id, contract, input0, input1, address, minAmount0, minAmount1, deadline]
  // )

  // const { sendTransaction, isLoading: isWritePending } = useSendTransaction({
  //   chainId,
  //   prepare,
  //   onSettled,
  //   onSuccess: () => setOpen(false),
  // })
  const isWritePending = false

  return useMemo(
    () => (
      <>
        {children({ isWritePending, setOpen })}
        <AddSectionReviewModal
          chainId={chainId}
          input0={input0}
          input1={input1}
          open={open}
          setOpen={setOpen}
          prices={prices}
        >
          <Approve
            onSuccess={() => {
              console.log('success')
            }}
            className="flex-grow !justify-end"
            components={
              <Approve.Components>
                <Approve.Token size="md" className="whitespace-nowrap" fullWidth amount={input0} address={address} />
                <Approve.Token size="md" className="whitespace-nowrap" fullWidth amount={input1} address={address} />
              </Approve.Components>
            }
            render={({ approved }) => {
              // console.log({ approved, isWritePending })
              return (
                <Button
                  size="md"
                  disabled={!approved}
                  fullWidth
                  onClick={() => {
                    console.log('click')
                  }}
                >
                  {<Dots>Confirm transaction</Dots>}
                </Button>
              )
            }}
          />
        </AddSectionReviewModal>
      </>
    ),
    [chainId, children, input0, input1, open, address, isWritePending, prices]
  )
}
