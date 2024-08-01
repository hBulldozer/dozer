import { formatPercentChange, formatUSD } from '@dozer/format'
import { Pair } from '@dozer/api'
import { useBreakpoint } from '@dozer/hooks'
import { ArrowIcon, Typography } from '@dozer/ui'
import { FC, useMemo } from 'react'

import { PoolPositionDesktop } from './PoolPositionDesktop'
import { usePoolPosition } from '../../PoolPositionProvider'

interface PoolPositionProps {
  pair: Pair
}

export const PoolPosition: FC<PoolPositionProps> = ({ pair }) => {
  const isLg = useBreakpoint('lg')

  const { value0, value1, user_deposited_a, user_deposited_b, max_withdraw_a, max_withdraw_b, changeUSD0, changeUSD1 } =
    usePoolPosition()
  // const data = usePoolPosition()
  // console.log(data)
  const positionChange = useMemo(() => {
    return (changeUSD0 + changeUSD1) / (value0 + value1)
  }, [changeUSD0, changeUSD1, value0, value1])
  if (!isLg) return <></>

  return (
    <div className="flex flex-col shadow-md bg-stone-800 rounded-2xl shadow-black/30">
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200/5">
        <Typography weight={600} className="text-stone-50">
          My Position
        </Typography>
        <div className="flex ">
          <Typography variant="sm" weight={600} className="text-right text-stone-50">
            {formatUSD(value0 + value1)}
          </Typography>
          {positionChange > 0 && (
            <>
              <Typography variant="sm" weight={400} className="ml-2 text-stone-400">
                {formatPercentChange(positionChange * 100)}
              </Typography>
              <ArrowIcon
                type={positionChange < 0 ? 'down' : 'up'}
                className={positionChange < 0 ? 'text-red-500' : 'text-green-500'}
              />
            </>
          )}
        </div>
      </div>
      <PoolPositionDesktop pair={pair} />
    </div>
  )
}
