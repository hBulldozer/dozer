import { formatNumber, formatPercent } from '@dozer/format'
import { Pair } from '../../../../utils/Pair'
import { Button, Chip, Currency, Link, Typography } from '@dozer/ui'
import { FC } from 'react'

// import { incentiveRewardToToken } from '../../../../lib/functions'
import { useTokensFromPair } from '../../../../utils/useTokensFromPair'
import { ICON_SIZE } from '../contants'

interface PairQuickHoverTooltipProps {
  row: Pair
}

export const PairQuickHoverTooltip: FC<PairQuickHoverTooltipProps> = ({ row }) => {
  const { token0, token1 } = useTokensFromPair(row)

  return (
    <div className="flex flex-col p-2 !pb-0">
      <div className="flex justify-between gap-8">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <Currency.IconList iconWidth={ICON_SIZE} iconHeight={ICON_SIZE}>
              <Currency.Icon currency={token0} />
              <Currency.Icon currency={token1} />
            </Currency.IconList>
            <div className="flex flex-col">
              <Typography variant="sm" weight={500} className="flex gap-1 text-stone-50">
                {token0.symbol} <span className="text-stone-500">/</span> {token1.symbol}
              </Typography>
              {/* <Typography variant="xxs" className="text-stone-400">
                SushiSwap Farm
              </Typography> */}
            </div>
          </div>
          {/* <Typography variant="xs" weight={600} className="flex gap-1.5 items-end text-stone-400">
            <Chip
              color="gray"
              size="sm"
              label={
                row.type === 'CONSTANT_PRODUCT_POOL'
                  ? 'Classic'
                  : row.type === 'STABLE_POOL'
                  ? 'Stable'
                  : // @ts-ignore
                  row.type === 'CONCENTRATED_LIQUIDITY_POOL'
                  ? 'Concentrated'
                  : ''
              }
            />
            Fee {row.swapFee / 100}%
          </Typography> */}
        </div>
        <div className="flex flex-col gap-1">
          <Typography variant="sm" weight={600} className="flex gap-3 text-stone-50">
            <span className="text-stone-400">APR:</span> {formatPercent(row.apr)}
          </Typography>
          {/* <Typography variant="xxs" weight={600} className="flex justify-end gap-1 text-stone-50">
            <span className="text-stone-400">Rewards:</span> {formatPercent(row.incentiveApr)}
          </Typography> */}
          {/* <Typography variant="xxs" weight={600} className="flex justify-end gap-1 text-stone-50">
            <span className="text-stone-400">Fees:</span> {formatPercent(row.feeApr)}
          </Typography> */}
        </div>
      </div>
      {/* {!!row?.farm?.incentives?.length && (
        <>
          <hr className="my-3 border-t border-stone-200/10" />
          <div className="flex flex-col gap-1.5">
            <Typography variant="xs" className="mb-1 text-stone-500">
              Reward Emission
            </Typography>
            {row.farm.incentives.map((incentive, index) => (
              <div key={index} className="flex items-center gap-2">
                <Currency.Icon currency={incentiveRewardToToken(row.chainId, incentive)} width={18} height={18} />
                <Typography variant="sm" weight={600} className="text-stone-50">
                  <span>
                    {formatNumber(incentive.rewardPerDay)} {incentive.rewardToken.symbol}
                  </span>{' '}
                  <span className="font-normal text-stone-300">per day</span>
                </Typography>
              </div>
            ))}
          </div>
        </>
      )} */}
      <div className="flex justify-end gap-2 mt-4 mb-2">
        <Link.Internal href={`/${row.id}/add`} passHref={true}>
          <Button as="a" size="sm" fullWidth>
            Deposit
          </Button>
        </Link.Internal>
      </div>
    </div>
  )
}
