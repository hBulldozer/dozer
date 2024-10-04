import { formatUSD } from '@dozer/format'
// import { Pair } from '@dozer/graph-client'
import { Pair } from '@dozer/api'
import { useBreakpoint } from '@dozer/hooks'
import { Button, Currency, Typography } from '@dozer/ui'
import { Checker } from '@dozer/higmi'
import { FC } from 'react'
import { getTokens } from '@dozer/currency'
import { ChainId } from '@dozer/chain'

// import { usePoolPositionRewards } from '../PoolPositionRewardsProvider'

interface PoolMyRewardsProps {
  pair: Pair
}

export const PoolMyRewards: FC<PoolMyRewardsProps> = ({ pair }) => {
  // const { pendingRewards, rewardTokens, harvest, isError, values, isLoading } = usePoolPositionRewards()
  const pendingRewards = getTokens(ChainId.HATHOR)
  const rewardTokens = pendingRewards
  const values = [20, 60, 70]
  const { isLg } = useBreakpoint('lg')

  // if (!isLg || (!pair?.farm?.incentives?.length && !pendingRewards?.length)) return <></>

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col shadow-md bg-stone-800 rounded-2xl shadow-black/30">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200/5">
          <Typography weight={600} className="text-stone-50">
            My Rewards
          </Typography>
          <div className="flex flex-col">
            <Typography variant="sm" weight={600} className="text-right text-stone-50">
              {formatUSD(
                // values.reduce((sum, value) => sum + value, 0
                10
              )}
            </Typography>
          </div>
        </div>
        <div className="flex flex-col gap-3 px-5 py-4">
          {pendingRewards?.map((reward, index) => {
            if (
              !reward
              // && isLoading && !isError
            )
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
                    {/* {reward?.toSignificant(6)} */}
                    100
                    {rewardTokens[index].symbol}
                  </Typography>
                </div>
                <Typography variant="xs" weight={500} className="text-stone-400">
                  {formatUSD(values[index])}
                </Typography>
              </div>
            )
          })}
        </div>
      </div>
      <Checker.Connected fullWidth size="md">
        {/* <Checker.Network fullWidth size="md" chainId={pair.chainId}> */}
        <Button
          size="md"
          fullWidth
          onClick={() => {}}
          // {harvest}
        >
          Claim
        </Button>
        {/* </Checker.Network> */}
      </Checker.Connected>
    </div>
  )
}
