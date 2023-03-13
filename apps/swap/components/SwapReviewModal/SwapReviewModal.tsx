import { ChainId } from '@dozer/chain'
import { Button, Dialog, Dots } from '@dozer/ui'
import { useSettings, useAccount, useTrade } from '@dozer/zustand'
import React, { FC, ReactNode, useCallback, useMemo, useState } from 'react'
import { Amount, getTokens } from '@dozer/currency'
import { SwapReviewModalBase } from './SwapReviewModalBase'
import Image from 'next/legacy/image'
import { XIcon } from '@heroicons/react/solid'

interface SwapReviewModalLegacy {
  chainId: number | undefined
  children({ setOpen }: { setOpen(open: boolean): void }): ReactNode
  onSuccess(): void
}

export const SwapReviewModalLegacy: FC<SwapReviewModalLegacy> = ({ chainId, children, onSuccess }) => {
  const trade = useTrade()
  const { address: account } = useAccount()
  const [open, setOpen] = useState(false)
  const [card, setCard] = useState(false)
  const [bannerIndex] = useState(Math.floor(Math.random() * 8))

  const [input0, input1] = useMemo(
    () => [trade?.amountSpecified, trade?.outputAmount],
    [trade?.amountSpecified, trade?.outputAmount]
  )

  const onSwapSuccess = useCallback(() => {
    setCard(true)

    setTimeout(() => {
      setOpen(false)
    }, 500)
  }, [onSuccess])

  const onCloseCard = useCallback(() => {
    onSuccess()
  }, [onSuccess])

  return (
    <>
      {children({ setOpen })}
      <SwapReviewModalBase chainId={chainId} open={open} setOpen={setOpen}>
        <Button
          size="md"
          testdata-id="swap-review-confirm-button"
          // disabled={isWritePending}
          fullWidth
          // onClick={() => }
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
            className=" absolute right-[-12px] top-[-12px] z-10 bg-slate-700 p-2 rounded-full flex items-center justify-center hover:bg-slate-600 cursor-pointer"
          >
            <XIcon width={20} height={20} />
          </div>
        </div>
      </Dialog>
    </>
  )
}
