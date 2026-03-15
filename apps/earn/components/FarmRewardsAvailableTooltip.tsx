import { Tooltip } from '@dozer/ui'
import { FC, MouseEvent } from 'react'

export const FarmRewardsAvailableTooltip: FC = () => {
  const handleClick = (e: MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    window.open(`${process.env.NEXT_PUBLIC_SITE_URL}/pool/oasis`, '_blank', 'noopener,noreferrer')
  }

  return (
    <span
      onClickCapture={handleClick}
      onMouseDown={(e) => e.stopPropagation()}
      className="relative z-10 cursor-pointer"
    >
      <Tooltip
        placement="bottom"
        button={<span className="hidden md:flex">✨</span>}
        panel={<div className="hidden text-xs md:flex rounded-2xl text-stone-300">Oasis rewards</div>}
      >
        <></>
      </Tooltip>
    </span>
  )
}
