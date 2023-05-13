import { ChevronDownIcon } from '@heroicons/react/solid'
import { Amount, Price, Type, getTokens } from '@dozer/currency'
import { ZERO } from '@dozer/math'
import { Dialog, Typography } from '@dozer/ui'
import { Currency } from '@dozer/ui'
import { FC, ReactNode, useMemo } from 'react'

// import { useTokenAmountDollarValues } from '../../lib/hooks'
import { Rate } from '../Rate'
import { useTrade } from '@dozer/zustand'

interface SwapReviewModalBase {
  chainId: number | undefined
  open: boolean
  setOpen(open: boolean): void
  children: ReactNode
}

export const SwapReviewModalBase: FC<SwapReviewModalBase> = ({ chainId, children, open, setOpen }) => {
  const input0 = useTrade((state) => state.amountSpecified)
  const input1 = useTrade((state) => state.outputAmount)
  const value0 = useTrade((state) => state.mainCurrencyPrice)
  const value1 = useTrade((state) => state.otherCurrencyPrice)
  const token1 = useTrade((state) => state.mainCurrency)
  const token2 = useTrade((state) => state.otherCurrency)

  return (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <Dialog.Content className="max-w-sm !pb-4">
        <Dialog.Header border={false} title="Confirm Swap" onClose={() => setOpen(false)} />
        <div className="!my-0 grid grid-cols-12 items-center">
          <div className="relative flex flex-col col-span-12 gap-1 p-2 border sm:p-4 rounded-2xl bg-stone-700/40 border-stone-200/5">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-between w-full gap-2">
                <Typography variant="h3" weight={500} className="truncate text-stone-50">
                  {input0?.toFixed(2)}{' '}
                </Typography>
                <div className="flex items-center justify-end gap-2 text-right">
                  {input0 && (
                    <div className="w-5 h-5">
                      <Currency.Icon currency={token1 ? token1 : getTokens(chainId)[0]} width={20} height={20} />
                    </div>
                  )}
                  <Typography variant="h3" weight={500} className="text-right text-stone-50">
                    {token1 ? token1.symbol : getTokens(chainId)[0].symbol}
                  </Typography>
                </div>
              </div>
            </div>
            <Typography variant="sm" weight={500} className="text-stone-500">
              {value0 && input0 ? `$${(value0 * input0).toFixed(2)}` : '-'}
            </Typography>
          </div>
          <div className="flex items-center justify-center col-span-12 -mt-2.5 -mb-2.5">
            <div className="p-0.5 bg-stone-700 border-2 border-stone-800 ring-1 ring-stone-200/5 z-10 rounded-full">
              <ChevronDownIcon width={18} height={18} className="text-stone-200" />
            </div>
          </div>
          <div className="flex flex-col col-span-12 gap-1 p-2 border sm:p-4 rounded-2xl bg-stone-700/40 border-stone-200/5">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-between w-full gap-2">
                <Typography variant="h3" weight={500} className="truncate text-stone-50">
                  {input1?.toFixed(2)}{' '}
                </Typography>
                <div className="flex items-center justify-end gap-2 text-right">
                  {input1 && (
                    <div className="w-5 h-5">
                      <Currency.Icon currency={token2 ? token2 : getTokens(chainId)[0]} width={20} height={20} />
                    </div>
                  )}
                  <Typography variant="h3" weight={500} className="text-right text-stone-50">
                    {token2 ? token2?.symbol : getTokens(chainId)[0].symbol}
                  </Typography>
                </div>
              </div>
            </div>
            <Typography variant="sm" weight={500} className="text-stone-500">
              {value1 && input1 ? `$${(value1 * input1).toFixed(2)}` : ''}
            </Typography>
          </div>
        </div>
        <div className="flex justify-center p-4">
          <Rate token1={token1} token2={token2}>
            {({ toggleInvert, content, usdPrice }) => (
              <Typography
                as="button"
                onClick={() => toggleInvert()}
                variant="sm"
                weight={600}
                className="flex items-center gap-1 text-stone-100"
              >
                {content} {usdPrice && <span className="font-normal text-stone-300">(${usdPrice})</span>}
              </Typography>
            )}
          </Rate>
        </div>
        {children}
      </Dialog.Content>
    </Dialog>
  )
}
