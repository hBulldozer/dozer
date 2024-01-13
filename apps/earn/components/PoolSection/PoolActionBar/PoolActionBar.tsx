// import { Pair } from '@dozer/graph-client'
import { Pair } from '@dozer/api'
import { useBreakpoint } from '@dozer/hooks'
import { AppearOnMount, Typography } from '@dozer/ui'
import { FC, Fragment, useState } from 'react'

import { PoolActionBarPositionDialog } from './PoolActionBarPositionDialog'
import { PoolActionBarPositionRewards } from './PoolActionBarPositionRewards'

interface PoolActionBarProps {
  pair: Pair
}

export const PoolActionBar: FC<PoolActionBarProps> = ({ pair }) => {
  const [openPosition, setOpenPosition] = useState<boolean>(false)
  const { isLg } = useBreakpoint('lg')

  if (isLg) return <></>

  return (
    <AppearOnMount as={Fragment}>
      <div className="fixed left-0 right-0 flex justify-center bottom-6">
        <div>
          <div className="divide-x rounded-full shadow-md shadow-black/50 bg-yellow divide-stone-800">
            <button onClick={() => setOpenPosition(true)} className="inline-flex px-4 py-3 cursor-pointer">
              <Typography variant="sm" weight={600} className="text-stone-800">
                My Position
              </Typography>
            </button>

            {/* CHECK IF MY REWARDS BUTTON SHOULD COME BACK 
            {pair.farm && (
              <button onClick={() => setOpenRewards(true)} className="inline-flex px-4 py-3 cursor-pointer">
                <Typography variant="sm" weight={600} className="text-stone-50">
                  My Rewards
                </Typography>
              </button>
            )} */}
          </div>
        </div>
        <PoolActionBarPositionDialog pair={pair} open={openPosition} setOpen={setOpenPosition} />
        {/* {pair.farm && <PoolActionBarPositionRewards pair={pair} open={openRewards} setOpen={setOpenRewards} />} */}
      </div>
    </AppearOnMount>
  )
}
