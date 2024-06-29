import { formatUSD } from '@dozer/format'
// import { Pair } from '@dozer/graph-client'
import { Pair } from '@dozer/api'
import { FundSource } from '@dozer/hooks'
import { Currency, Dialog, Typography } from '@dozer/ui'
import { FC, useCallback } from 'react'

// import { useTokensFromPair } from '../../../lib/hooks'
import { useTokensFromPair } from '@dozer/api'
// import { usePoolPosition } from '../../PoolPositionProvider'
// import { usePoolPositionStaked } from '../../PoolPositionStakedProvider'
import { PoolButtons } from '../PoolButtons'
import { useAccount } from '@dozer/zustand'
import { usePoolPosition } from '../../PoolPositionProvider'

interface PoolActionBarPositionDialogProps {
  pair: Pair
  open: boolean
  setOpen(open: boolean): void
}

export const PoolActionBarPositionDialog: FC<PoolActionBarPositionDialogProps> = ({ pair, open, setOpen }) => {
  const { token0, token1 } = useTokensFromPair(pair)
  const { isError, isLoading, value0, value1, max_withdraw_a, max_withdraw_b } = usePoolPosition()

  const handleClose = useCallback(() => {
    setOpen(false)
  }, [setOpen])

  return (
    <Dialog onClose={handleClose} open={open}>
      <Dialog.Content className="!pb-6">
        <Dialog.Header title="My Position" onClose={handleClose} />
        {isLoading && !isError ? (
          <div className="flex flex-col gap-2 px-2 py-4 mt-2">
            <div className="grid justify-between grid-cols-10 gap-10 mb-2">
              <div className="h-[20px] bg-stone-600 animate-pulse col-span-8 rounded-full" />
              <div className="h-[20px] bg-stone-600 animate-pulse col-span-2 rounded-full" />
            </div>
            <div className="grid justify-between grid-cols-10 gap-10">
              <div className="h-[20px] bg-stone-700 animate-pulse col-span-8 rounded-full" />
              <div className="h-[20px] bg-stone-700 animate-pulse col-span-2 rounded-full" />
            </div>
            <div className="grid justify-between grid-cols-10 gap-10">
              <div className="h-[20px] bg-stone-700 animate-pulse col-span-8 rounded-full" />
              <div className="h-[20px] bg-stone-700 animate-pulse col-span-2 rounded-full" />
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-2 pt-4">
              <Typography variant="sm" weight={600} className="text-stone-100">
                My Position
              </Typography>
              <div className="flex flex-col">
                <Typography variant="xs" weight={500} className="text-right text-stone-100">
                  {formatUSD(value0 + value1)}
                  {/* {100} */}
                </Typography>
              </div>
            </div>
            <div className="flex justify-between px-2 py-1">
              <div className="flex items-center gap-2">
                <Currency.Icon currency={token0} width={20} height={20} />
                <Typography variant="sm" weight={500} className="text-stone-300">
                  {max_withdraw_a?.toFixed(2) || '0'} {token0.symbol}
                  {/* {1000} */}
                </Typography>
              </div>
              <Typography variant="xs" weight={500} className="text-stone-400">
                {formatUSD(value0)}
                {/* {2000} */}
              </Typography>
            </div>
            <div className="flex justify-between px-2 py-1">
              <div className="flex items-center gap-2">
                <Currency.Icon currency={token1} width={20} height={20} />
                <Typography variant="sm" weight={500} className="text-stone-300">
                  {/* {1000} */}
                  {max_withdraw_b?.toFixed(2) || '0'} {token1.symbol}
                </Typography>
              </div>
              <Typography variant="xs" weight={500} className="text-stone-400">
                {/* {3000} */}
                {formatUSD(value1)}
              </Typography>
            </div>
          </>
        )}

        {/* {isStakedLoading && !isStakedError && !stakedBalance ? (
          <div className="flex flex-col gap-3 px-2 py-4">
            <div className="flex justify-between mb-1 py-0.5">
              <div className="h-[16px] bg-stone-600 animate-pulse w-[100px] rounded-full" />
              <div className="h-[16px] bg-stone-600 animate-pulse w-[60px] rounded-full" />
            </div>
            <div className="flex justify-between py-0.5">
              <div className="h-[16px] bg-stone-700 animate-pulse w-[160px] rounded-full" />
              <div className="h-[16px] bg-stone-700 animate-pulse w-[60px] rounded-full" />
            </div>
            <div className="flex justify-between py-0.5">
              <div className="h-[16px] bg-stone-700 animate-pulse w-[160px] rounded-full" />
              <div className="h-[16px] bg-stone-700 animate-pulse w-[60px] rounded-full" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 px-2 py-4 mt-2">
            <div className="flex items-center justify-between mb-1">
              <Typography variant="sm" weight={600} className="text-stone-100">
                Staked Position
              </Typography>
              <Typography variant="xs" weight={500} className="text-stone-100">
                {formatUSD(stakedValue0 + stakedValue1)}
              </Typography>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Currency.Icon currency={token0} width={20} height={20} />
                <Typography variant="sm" weight={500} className="text-stone-300">
                  {stakedUnderlying0?.toSignificant(6)} {token0.symbol}
                </Typography>
              </div>
              <Typography variant="xs" weight={500} className="text-stone-400">
                {formatUSD(stakedValue0)}
              </Typography>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Currency.Icon currency={token1} width={20} height={20} />
                <Typography variant="sm" weight={500} className="text-stone-300">
                  {stakedUnderlying1?.toSignificant(6)} {token1.symbol}
                </Typography>
              </div>
              <Typography variant="xs" weight={500} className="text-stone-400">
                {formatUSD(stakedValue1)}
              </Typography>
            </div>
          </div>
        )} */}

        <div className="px-2 mt-3">
          <PoolButtons pair={pair} />
        </div>
      </Dialog.Content>
    </Dialog>
  )
}
