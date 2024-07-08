import { PlusIcon } from '@heroicons/react/solid'
import { ChainId } from '@dozer/chain'
import { Amount, Type } from '@dozer/currency'
import { Currency, Dialog, Typography } from '@dozer/ui'
import { FC, ReactNode, useMemo } from 'react'

// import { useTokenAmountDollarValues } from '../../lib/hooks'
import { Rate } from '../Rate'
import { useSettings } from '@dozer/zustand'

interface AddSectionReviewModal {
  chainId: ChainId
  input0: Amount<Type> | undefined
  input1: Amount<Type> | undefined
  open: boolean
  setOpen(open: boolean): void
  children: ReactNode
  prices: { [key: string]: number }
}

export const AddSectionReviewModal: FC<AddSectionReviewModal> = ({
  // chainId,
  input0,
  input1,
  open,
  setOpen,
  children,
  prices,
}) => {
  // useTokenAmountDollarValues({
  //   chainId,
  //   amounts: [input0, input1],
  // })
  const slippageTolerance = useSettings((state) => state.slippageTolerance)

  const [price0, price1] = useMemo(() => {
    return input0 && input1 ? [prices[input0?.currency.uuid], prices[input1?.currency.uuid]] : [0, 0]
  }, [input0, input1, prices])

  return (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <Dialog.Content className="max-w-sm !pb-4">
        <Dialog.Header border={false} title="Add Liquidity" onClose={() => setOpen(false)} />
        <div className="!my-0 grid grid-cols-12 items-center">
          <div className="relative flex flex-col col-span-12 gap-1 p-2 border sm:p-4 rounded-2xl bg-stone-700/40 border-stone-200/5">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-between w-full gap-2">
                <Typography variant="h3" weight={500} className="truncate text-stone-50">
                  {input0?.multiply(100).toFixed(2)}{' '}
                </Typography>
                <div className="flex items-center justify-end gap-2 text-right">
                  {input0 && (
                    <div className="w-5 h-5">
                      <Currency.Icon currency={input0.currency} width={20} height={20} />
                    </div>
                  )}
                  <Typography variant="h3" weight={500} className="text-right text-stone-50">
                    {input0?.currency.symbol}
                  </Typography>
                </div>
              </div>
            </div>
            <Typography variant="sm" weight={500} className="text-stone-500">
              {price0 && input0 ? `$${(price0 * Number(input0.multiply(100).toFixed(2))).toFixed(2)}` : '-'}
            </Typography>
          </div>
          <div className="flex items-center justify-center col-span-12 -mt-2.5 -mb-2.5">
            <div className="p-0.5 bg-stone-700 border-2 border-stone-800 ring-1 ring-stone-200/5 z-10 rounded-full">
              <PlusIcon width={18} height={18} className="text-stone-200" />
            </div>
          </div>
          <div className="flex flex-col col-span-12 gap-1 p-2 border sm:p-4 rounded-2xl bg-stone-700/40 border-stone-200/5">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-between w-full gap-2">
                <Typography variant="h3" weight={500} className="truncate text-stone-50">
                  {(Number(input1?.multiply(100).toFixed(2)) * (1 + slippageTolerance)).toFixed(2)}{' '}
                </Typography>
                <div className="flex items-center justify-end gap-2 text-right">
                  {input1 && (
                    <div className="w-5 h-5">
                      <Currency.Icon currency={input1.currency} width={20} height={20} />
                    </div>
                  )}
                  <Typography variant="h3" weight={500} className="text-right text-stone-50">
                    {input1?.currency.symbol}
                  </Typography>
                </div>
              </div>
            </div>
            <Typography variant="sm" weight={500} className="text-stone-500">
              {price1 && input1
                ? `$${(Number(price1 * Number(input1.multiply(100).toFixed(2))) * (1 + slippageTolerance)).toFixed(2)}`
                : '-'}
            </Typography>
          </div>
        </div>
        <div className="flex justify-center p-4">
          <Rate token1={input0?.currency} token2={input1?.currency}>
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
