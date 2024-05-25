import { Button, createErrorToast, createSuccessToast, Dialog, Dots, NotificationData } from '@dozer/ui'
import { useAccount, useNetwork, useSettings, useTrade } from '@dozer/zustand'
import { TradeType } from 'components/utils/TradeType'
import React, { FC, ReactNode, useCallback, useState } from 'react'
import { SwapReviewModalBase } from './SwapReviewModalBase'
import { XIcon } from '@heroicons/react/solid'
import { api } from 'utils/api'
import { TokenBalance } from '@dozer/zustand'

interface SwapReviewModalLegacy {
  chainId: number | undefined
  children({ setOpen }: { setOpen(open: boolean): void }): ReactNode
  onSuccess(): void
}

export const SwapReviewModalLegacy: FC<SwapReviewModalLegacy> = ({ chainId, children, onSuccess }) => {
  const { amountSpecified, outputAmount, pool, tradeType, mainCurrency, otherCurrency } = useTrade()
  const { address, addNotification, setBalance, balance } = useAccount()
  const { network } = useNetwork()
  const [open, setOpen] = useState(false)
  const [card, setCard] = useState(false)
  const { slippageTolerance } = useSettings()
  const [isWritePending, setIsWritePending] = useState<boolean>(false)

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
            return { ...token, token_balance: token.token_balance + amount_out * 100 }
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

  const mutateFunction =
    tradeType === TradeType.EXACT_INPUT
      ? api.getPools.swap_exact_tokens_for_tokens
      : api.getPools.swap_tokens_for_exact_tokens

  const mutation = mutateFunction.useMutation({
    onSuccess: (res) => {
      console.log(res)
      if (amountSpecified && outputAmount && pool && mainCurrency && otherCurrency) {
        if (res.hash) {
          const notificationData: NotificationData = {
            type: 'swap',
            chainId: network,
            summary: {
              pending: `Trading ${amountSpecified} ${mainCurrency.symbol} for ${outputAmount} ${otherCurrency.symbol}. Waiting for next block`,
              completed: `Success! Traded ${amountSpecified} ${mainCurrency.symbol} for ${outputAmount} ${otherCurrency.symbol}.`,
              failed: 'Failed summary',
              info: `Trading ${amountSpecified} ${mainCurrency.symbol} for ${outputAmount} ${otherCurrency.symbol}.`,
            },
            status: 'pending',
            txHash: res.hash,
            groupTimestamp: Math.floor(Date.now() / 1000),
            timestamp: Math.floor(Date.now() / 1000),
            promise: new Promise((resolve) => {
              setTimeout(resolve, 500)
            }),
          }
          editBalanceOnSwap(amountSpecified, mainCurrency.uuid, outputAmount, otherCurrency.uuid)
          const notificationGroup: string[] = []
          notificationGroup.push(JSON.stringify(notificationData))
          addNotification(notificationGroup)
          createSuccessToast(notificationData)
          setIsWritePending(false)
          setOpen(false)
        } else {
          createErrorToast(`${res.error}`, true)
          setIsWritePending(false)
          setOpen(false)
        }
      }
    },
    onError: (error) => {
      createErrorToast(`Error sending TX. \n${error}`, true)
      setIsWritePending(false)
      setOpen(false)
    },
  })
  const onClick = async () => {
    if (amountSpecified && outputAmount && pool && mainCurrency && otherCurrency) {
      setIsWritePending(true)
      mutation.mutate({
        amount_in: amountSpecified,
        token_in: mainCurrency.uuid,
        amount_out: outputAmount * (1 - slippageTolerance),
        ncid: pool.id,
        token_out: otherCurrency.uuid,
        address,
      })
    }
  }

  return (
    <>
      {children({ setOpen })}
      <SwapReviewModalBase chainId={chainId} open={open} setOpen={setOpen}>
        <Button
          size="md"
          testdata-id="swap-review-confirm-button"
          disabled={isWritePending}
          fullWidth
          onClick={() => onClick()}
        >
          {isWritePending ? <Dots>Confirm Swap</Dots> : 'Swap'}
        </Button>
      </SwapReviewModalBase>

      <Dialog open={card} onClose={onCloseCard}>
        <div className="relative">
          <div
            role="button"
            onClick={onCloseCard}
            className=" absolute right-[-12px] top-[-12px] z-10 bg-stone-700 p-2 rounded-full flex items-center justify-center hover:bg-stone-600 cursor-pointer"
          >
            <XIcon width={20} height={20} />
          </div>
        </div>
      </Dialog>
    </>
  )
}
