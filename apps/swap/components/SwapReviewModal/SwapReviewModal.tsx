import { Button, createErrorToast, createSuccessToast, Dialog, NotificationData } from '@dozer/ui'
import { useAccount, useTrade } from '@dozer/zustand'
import { TradeType } from 'components/utils/TradeType'
import React, { FC, ReactNode, useCallback, useMemo, useState } from 'react'
import { SwapReviewModalBase } from './SwapReviewModalBase'
import { XIcon } from '@heroicons/react/solid'
import { api } from 'utils/api'

interface SwapReviewModalLegacy {
  chainId: number | undefined
  children({ setOpen }: { setOpen(open: boolean): void }): ReactNode
  onSuccess(): void
}

export const SwapReviewModalLegacy: FC<SwapReviewModalLegacy> = ({ chainId, children, onSuccess }) => {
  const { amountSpecified, outputAmount, pool, tradeType, mainCurrency, otherCurrency } = useTrade()
  const { address } = useAccount()
  const [open, setOpen] = useState(false)
  const [card, setCard] = useState(false)
  const utils = api.useUtils()

  const onCloseCard = useCallback(() => {
    onSuccess()
  }, [onSuccess])

  const onClick = async () => {
    if (amountSpecified && outputAmount && pool && mainCurrency && otherCurrency) {
      const fetchFunction =
        tradeType === TradeType.EXACT_INPUT
          ? utils.getPools.swap_exact_tokens_for_tokens
          : utils.getPools.swap_tokens_for_exact_tokens
      const response = await fetchFunction
        .fetch({
          ncid: pool.id,
          amount_in: amountSpecified,
          token_in: mainCurrency.uuid,
          amount_out: outputAmount,
          token_out: otherCurrency.uuid,
          address,
        })
        .then((res) => {
          console.log(res)
          if (res['hash']) {
            const notificationData: Omit<NotificationData, 'promise'> = {
              type: 'swap',
              summary: {
                pending: 'Pending swap',
                completed: 'Completed swap',
                failed: 'Failed swap',
                info: 'Info swap',
              },
              txHash: res.hash,
              groupTimestamp: Math.floor(Date.now() / 1000),
              timestamp: Math.floor(Date.now() / 1000),
            }
            createSuccessToast(notificationData)
          } else {
            createErrorToast(`Swap failed.${res.hash.error[0].msg}`, true)
          }
          setOpen(false)
        })
        .catch((err) => {
          createErrorToast(`Swap failed.${err}`, true)
          setOpen(false)
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
          // disabled={isWritePending}
          fullWidth
          onClick={() => onClick()}
        >
          {/* {isWritePending ? <Dots>Confirm Swap</Dots> : 'Swap'} */}
          Swap
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
