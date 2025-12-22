import { Tooltip } from '@dozer/ui'
import { FC } from 'react'

export const FarmRewardsAvailableTooltip: FC = () => {
  return (
    <Tooltip
      placement="bottom"
      button={<span className="hidden md:flex">✨</span>}
      panel={<div className="hidden text-xs md:flex rounded-2xl text-stone-300">Double rewards</div>}
    >
      <></>
    </Tooltip>
  )
}
