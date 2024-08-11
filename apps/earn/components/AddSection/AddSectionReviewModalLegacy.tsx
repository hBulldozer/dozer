import { ChainId } from '@dozer/chain'
import { Amount, Type } from '@dozer/currency'
import { Button, createErrorToast, createSuccessToast, Dots, NotificationData } from '@dozer/ui'
import { FC, ReactNode, useEffect, useState } from 'react'
import { useAccount, useNetwork, useTrade, TokenBalance, useSettings } from '@dozer/zustand'
import { AddSectionReviewModal } from './AddSectionReviewModal'
import { LiquidityPool } from '@dozer/nanocontracts'
import { api } from '../../utils/api'
import { useJsonRpc, useWalletConnectClient } from '@dozer/higmi'
import { get } from 'lodash'

interface AddSectionReviewModalLegacyProps {
  poolState: number
  chainId: ChainId
  token0: Type | undefined
  token1: Type | undefined
  input0: Amount<Type> | undefined
  input1: Amount<Type> | undefined
  children({ setOpen }: { setOpen(open: boolean): void }): ReactNode
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
  const slippageTolerance = useSettings((state) => state.slippageTolerance)
  const [open, setOpen] = useState(false)
  const { amountSpecified, outputAmount, pool, mainCurrency, otherCurrency } = useTrade()
  const [sentTX, setSentTX] = useState(false)
  const {
    //  address,
    addNotification,
    setBalance,
    balance,
  } = useAccount()
  const { network } = useNetwork()

  const { accounts } = useWalletConnectClient()
  const address = accounts.length > 0 ? accounts[0].split(':')[2] : ''

  const liquiditypool = new LiquidityPool(mainCurrency?.uuid || '', otherCurrency?.uuid || '', 5, 50, pool?.id || '')

  const { hathorRpc, rpcResult, isRpcRequestPending, reset } = useJsonRpc()

  const editBalanceOnAddLiquidity = (amount_in: number, token_in: string, amount_out: number, token_out: string) => {
    const balance_tokens = balance.map((t) => {
      return t.token_uuid
    })
    if (balance_tokens.includes(token_out))
      setBalance(
        balance.map((token: TokenBalance) => {
          if (token.token_uuid == token_in) return { ...token, token_balance: token.token_balance - amount_in * 100 }
          else if (token.token_uuid == token_out)
            return { ...token, token_balance: token.token_balance - amount_out * 100 }
          else return token
        })
      )
    else {
      const token_out_balance: TokenBalance = {
        token_balance: amount_out * 100,
        token_symbol: otherCurrency?.symbol || 'DZR',
        token_uuid: token_out,
      }
      const new_balance: TokenBalance[] = balance.map((token: TokenBalance) => {
        if (token.token_uuid == token_in) return { ...token, token_balance: token.token_balance - amount_in * 100 }
        else return token
      })
      new_balance.push(token_out_balance)
      setBalance(new_balance)
    }
  }

  // const mutation = api.getPools.add_liquidity.useMutation({
  //   onSuccess: (res) => {
  //     console.log(res)
  //     if (amountSpecified && outputAmount && pool && mainCurrency && otherCurrency) {
  //       if (res.hash) {
  //         const notificationData: NotificationData = {
  //           type: 'swap',
  //           chainId: network,
  //           summary: {
  //             pending: `Waiting for next block`,
  //             completed: `Success! Added ${amountSpecified} ${mainCurrency.symbol} and ${outputAmount} ${otherCurrency.symbol} in ${pool.name} pool.`,
  //             failed: 'Failed summary',
  //             info: `Adding Liquidity in ${pool.name} pool: ${amountSpecified} ${mainCurrency.symbol} and ${outputAmount} ${otherCurrency.symbol}.`,
  //           },
  //           status: 'pending',
  //           txHash: res.hash,
  //           groupTimestamp: Math.floor(Date.now() / 1000),
  //           timestamp: Math.floor(Date.now() / 1000),
  //           promise: new Promise((resolve) => {
  //             setTimeout(resolve, 500)
  //           }),
  //         }
  //         editBalanceOnAddLiquidity(
  //           amountSpecified,
  //           mainCurrency.uuid,
  //           outputAmount * (1 + slippageTolerance),
  //           otherCurrency.uuid
  //         )
  //         const notificationGroup: string[] = []
  //         notificationGroup.push(JSON.stringify(notificationData))
  //         addNotification(notificationGroup)
  //         createSuccessToast(notificationData)
  //         setOpen(false)
  //         setIsWritePending(false)
  //       } else {
  //         createErrorToast(`${res.error}`, true)
  //         setIsWritePending(false)
  //         setOpen(false)
  //       }
  //     }
  //   },
  //   onError: (error) => {
  //     createErrorToast(`Error sending TX. \n${error}`, true)
  //     setIsWritePending(false)
  //     setOpen(false)
  //   },
  // })

  const onClick = async () => {
    setSentTX(true)
    if (amountSpecified && outputAmount && pool && mainCurrency && otherCurrency) {
      const response = await liquiditypool.add_liquidity(
        hathorRpc,
        pool.id,
        mainCurrency.uuid,
        amountSpecified,
        otherCurrency.uuid,
        outputAmount * (1 - slippageTolerance),
        address
      )
      // console.log(response)
    }
  }

  useEffect(() => {
    if (rpcResult?.valid && rpcResult?.result && sentTX) {
      console.log(rpcResult)
      if (amountSpecified && outputAmount && pool && mainCurrency && otherCurrency) {
        const hash = get(rpcResult, 'result.response.hash') as string
        if (hash) {
          const notificationData: NotificationData = {
            type: 'swap',
            chainId: network,
            summary: {
              pending: `Waiting for next block`,
              completed: `Success! Added ${amountSpecified} ${mainCurrency.symbol} and ${outputAmount} ${otherCurrency.symbol} in ${pool.name} pool.`,
              failed: 'Failed summary',
              info: `Adding Liquidity in ${pool.name} pool: ${amountSpecified} ${mainCurrency.symbol} and ${outputAmount} ${otherCurrency.symbol}.`,
            },
            status: 'pending',
            txHash: hash,
            groupTimestamp: Math.floor(Date.now() / 1000),
            timestamp: Math.floor(Date.now() / 1000),
            promise: new Promise((resolve) => {
              setTimeout(resolve, 500)
            }),
            account: address,
          }
          editBalanceOnAddLiquidity(
            amountSpecified,
            mainCurrency.uuid,
            outputAmount * (1 + slippageTolerance),
            otherCurrency.uuid
          )
          const notificationGroup: string[] = []
          notificationGroup.push(JSON.stringify(notificationData))
          addNotification(notificationGroup)
          createSuccessToast(notificationData)
          setOpen(false)
          setSentTX(false)
        } else {
          createErrorToast(`Error`, true)
          setOpen(false)
          setSentTX(false)
        }
      }
    }
  }, [rpcResult])

  return (
    <>
      {children({ setOpen })}
      <AddSectionReviewModal
        chainId={chainId}
        input0={input0}
        input1={input1}
        open={open}
        setOpen={setOpen}
        prices={prices}
      >
        <div className="flex flex-col justify-between gap-2">
          <Button
            size="md"
            disabled={isRpcRequestPending}
            fullWidth
            onClick={() => {
              onClick()
            }}
          >
            {isRpcRequestPending ? <Dots>Confirm transactionin your wallet</Dots> : <>Add Liquidity</>}
          </Button>
          {isRpcRequestPending && (
            <Button
              size="md"
              testdata-id="swap-review-reset-button"
              fullWidth
              variant="outlined"
              color="red"
              onClick={() => reset()}
            >
              Cancel Transaction
            </Button>
          )}
        </div>
      </AddSectionReviewModal>
    </>
  )
}
