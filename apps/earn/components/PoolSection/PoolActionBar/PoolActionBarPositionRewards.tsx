import { formatUSD } from '@dozer/format'
// import { Pair } from '@dozer/graph-client'
import { Pair } from '@dozer/api'
import { Button, Currency, Dialog, Typography } from '@dozer/ui'
import { Checker } from '@dozer/higmi'
import { FC, useCallback } from 'react'
import { Amount, getTokens } from '@dozer/currency'
import { ChainId } from '@dozer/chain'

// import { usePoolPositionRewards } from '../../PoolPositionRewardsProvider'

interface PoolActionBarPositionRewardsProps {
  pair: Pair
  open: boolean
  setOpen(open: boolean): void
}

export const PoolActionBarPositionRewards: FC<PoolActionBarPositionRewardsProps> = ({ pair, open, setOpen }) => {
  // const { pendingRewards, values, rewardTokens, isError, isLoading, harvest } = usePoolPositionRewards()
  const pendingRewards = [Amount.fromRawAmount(getTokens(ChainId.HATHOR)[0], 100)]
  const rewardTokens = [getTokens(ChainId.HATHOR)[1]]
  const values = [1, 2, 3]
  const isLoading = false
  const isError = false
  const handleClose = useCallback(() => {
    setOpen(false)
  }, [setOpen])

  return (
    <Dialog onClose={handleClose} open={open}>
      <Dialog.Content className="!pb-6">
        <Dialog.Header title="My Rewards" onClose={handleClose} />
        <div className="flex items-center justify-between p-2 pt-4 pb-3">
          <Typography weight={600} className="text-stone-50">
            My Rewards
          </Typography>
          <div className="flex flex-col">
            <Typography variant="sm" weight={600} className="text-right text-stone-50">
              {/* {formatUSD(values.reduce((sum, value) => sum + value, 0))} */}
              {5000}
            </Typography>
          </div>
        </div>
        <div className="flex flex-col gap-3 px-2 py-4">
          {pendingRewards?.map((reward, index) => {
            if (!reward && isLoading && !isError)
              return (
                <div className="grid justify-between grid-cols-10 gap-2" key={index}>
                  <div className="h-[20px] bg-stone-700 animate-pulse col-span-8 rounded-full" />
                  <div className="h-[20px] bg-stone-700 animate-pulse col-span-2 rounded-full" />
                </div>
              )

            return (
              <div className="flex items-center justify-between" key={index}>
                <div className="flex items-center gap-2">
                  <Currency.Icon currency={rewardTokens[index]} width={20} height={20} />
                  <Typography variant="sm" weight={600} className="text-stone-300">
                    {reward?.toSignificant(6)} {rewardTokens[index].symbol}
                  </Typography>
                </div>
                <Typography variant="xs" weight={500} className="text-stone-400">
                  {formatUSD(values[index])}
                </Typography>
              </div>
            )
          })}
        </div>
        <div className="px-2 mt-3">
          <Checker.Connected fullWidth size="md">
            {/* <Checker.Network fullWidth size="md" chainId={pair.chainId}> */}
            <Button size="md" fullWidth onClick={() => {}}>
              Claim
            </Button>
            {/* </Checker.Network> */}
          </Checker.Connected>
        </div>
      </Dialog.Content>
    </Dialog>
  )
}
