import { Tooltip } from '@dozer/ui'
import { FC } from 'react'

export const FarmRewardsAvailableTooltip: FC = () => {
  return (
    <Tooltip
      placement="bottom"
      button={<span>✨</span>}
      panel={<div className="text-xs rounded-2xl text-stone-300">Farm rewards available</div>}
    />
  )
}
