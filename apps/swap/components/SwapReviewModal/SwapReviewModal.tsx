import { Button, createErrorToast, createSuccessToast, Dialog, Dots, NotificationData } from '@dozer/ui'
import { useAccount, useNetwork, useSettings, useTrade } from '@dozer/zustand'
import { TradeType } from 'components/utils/TradeType'
import React, { FC, ReactNode, useCallback, useEffect, useState } from 'react'
import { SwapReviewModalBase } from './SwapReviewModalBase'
import { XMarkIcon } from '@heroicons/react/24/solid'
import { api } from 'utils/api'
import { TokenBalance } from '@dozer/zustand'
import { LiquidityPool } from '@dozer/nanocontracts'
import { main } from '@dozer/database/dist/seed_db'
import { useJsonRpc, useWalletConnectClient } from '@dozer/higmi'
import { get } from 'lodash'

interface SwapReviewModalLegacy {
  chainId: number | undefined
  children({ setOpen }: { setOpen(open: boolean): void }): ReactNode
  onSuccess(): void
}

export const SwapReviewModalLegacy: FC<SwapReviewModalLegacy> = ({ chainId, children, onSuccess }) => {
  const { amountSpecified, outputAmount, pool, tradeType, mainCurrency, otherCurrency } = useTrade()
  const [sentTX, setSentTX] = useState(false)
  const {
    // address,
    addNotification,
    setBalance,
    balance,
  } = useAccount()
  const { accounts } = useWalletConnectClient()
  const address = accounts.length > 0 ? accounts[0].split(':')[2] : ''
  const { network } = useNetwork()
  const [open, setOpen] = useState(false)
  const [card, setCard] = useState(false)
  const { slippageTolerance } = useSettings()

  const liquiditypool = new LiquidityPool(mainCurrency?.uuid || '', otherCurrency?.uuid || '', 5, 50, pool?.id || '')

  const { hathorRpc, rpcResult, isRpcRequestPending, reset } = useJsonRpc()

  const onCloseCard = useCallback(() => {
    onSuccess()
  }, [onSuccess])

  const editBalanceOnSwap = (amount_in: number, token_in: string, amount_out: number, token_out: string) => {
    const balance_tokens = balance.map((t) => {
      return t.token_uuid
    })
    if (balance_tokens.includes(token_out))
      setBalance(
        balance.map((token: TokenBalance) => {
          if (token.token_uuid == token_in) return { ...token, token_balance: token.token_balance - amount_in * 100 }
          else if (token.token_uuid == token_out)
            return { ...token, token_balance: token.token_balance + Number(amount_out.toFixed(2)) * 100 }
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

  const swapFunction =
    tradeType === TradeType.EXACT_INPUT
      ? liquiditypool.swap_tokens_for_exact_tokens
      : liquiditypool.swap_tokens_for_exact_tokens

  // const mutation = mutateFunction({
  //   onSuccess: (res) => {
  //     console.log(res)
  //     if (amountSpecified && outputAmount && pool && mainCurrency && otherCurrency) {
  //       if (res.hash) {
  //         const notificationData: NotificationData = {
  //           type: 'swap',
  //           chainId: network,
  //           summary: {
  //             pending: `Waiting for next block`,
  //             completed: `Success! Traded ${amountSpecified} ${mainCurrency.symbol} for ${outputAmount} ${otherCurrency.symbol}.`,
  //             failed: 'Failed summary',
  //             info: `Trading ${amountSpecified} ${mainCurrency.symbol} for ${outputAmount} ${otherCurrency.symbol}.`,
  //           },
  //           status: 'pending',
  //           txHash: res.hash,
  //           groupTimestamp: Math.floor(Date.now() / 1000),
  //           timestamp: Math.floor(Date.now() / 1000),
  //           promise: new Promise((resolve) => {
  //             setTimeout(resolve, 500)
  //           }),
  //         }
  //         editBalanceOnSwap(
  //           amountSpecified,
  //           mainCurrency.uuid,
  //           outputAmount * (1 - slippageTolerance),
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
      const response = await swapFunction(
        hathorRpc,
        address,
        pool.id,
        mainCurrency.uuid,
        amountSpecified,
        otherCurrency.uuid,
        outputAmount * (1 - slippageTolerance)
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
              pending: `Waiting for next block. Swap ${amountSpecified} ${mainCurrency.symbol} for ${outputAmount} ${otherCurrency.symbol}.`,
              completed: `Success! Traded ${amountSpecified} ${mainCurrency.symbol} for ${outputAmount} ${otherCurrency.symbol}.`,
              failed: 'Failed summary',
              info: `Trading ${amountSpecified} ${mainCurrency.symbol} for ${outputAmount} ${otherCurrency.symbol}.`,
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
          editBalanceOnSwap(
            amountSpecified,
            mainCurrency.uuid,
            outputAmount * (1 - slippageTolerance),
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
      <SwapReviewModalBase chainId={chainId} open={open} setOpen={setOpen}>
        <div className="flex flex-col justify-between gap-2">
          <Button
            size="md"
            testdata-id="swap-review-confirm-button"
            disabled={isRpcRequestPending}
            fullWidth
            onClick={() => onClick()}
          >
            {isRpcRequestPending ? <Dots>Confirm transaction in your wallet</Dots> : 'Swap'}
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
      </SwapReviewModalBase>

      <Dialog open={card} onClose={onCloseCard}>
        <div className="relative">
          <div
            role="button"
            onClick={onCloseCard}
            className=" absolute right-[-12px] top-[-12px] z-10 bg-stone-700 p-2 rounded-full flex items-center justify-center hover:bg-stone-600 cursor-pointer"
          >
            <XMarkIcon width={20} height={20} />
          </div>
        </div>
      </Dialog>
    </>
  )
}
