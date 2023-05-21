import { formatPercent, formatUSD } from '@dozer/format'
// import { UserWithFarm } from '@dozer/graph-client'
import { Button, Chip, Currency, Link, Typography } from '@dozer/ui'
import { FC } from 'react'
import useSWR from 'swr'

// import { PoolPositionProvider, usePoolPosition } from '../../../PoolPositionProvider'
// import { PoolPositionRewardsProvider, usePoolPositionRewards } from '../../../PoolPositionRewardsProvider'
// import { PoolPositionStakedProvider, usePoolPositionStaked } from '../../../PoolPositionStakedProvider'
import { ICON_SIZE } from '../contants'
import { Pair } from '../../../../utils/Pair'
import { useTokensFromPair } from '../../../../utils/useTokensFromPair'
import { dbTokenWithPools } from '../../../../interfaces'
import { PoolPositionProvider, usePoolPosition } from '../../../PoolPositionProvider'
import { api } from '../../../../utils/trpc'

interface PositionQuickHoverTooltipProps {
  row: Pair
}

export const PositionQuickHoverTooltip: FC<PositionQuickHoverTooltipProps> = ({ row }) => {
  const { data: prices, isLoading } = api.getPrices.all.useQuery()

  if (!prices && isLoading)
    return (
      <>
        <Typography>Loading prices...</Typography>
      </>
    )
  if (!prices)
    return (
      <>
        <Typography>No prices found</Typography>
      </>
    )

  return (
    <PoolPositionProvider watch={false} pair={row} prices={prices}>
      <_PositionQuickHoverTooltip row={row} />
    </PoolPositionProvider>
  )
}

const _PositionQuickHoverTooltip: FC<PositionQuickHoverTooltipProps> = ({ row }) => {
  const { token0, token1 } = useTokensFromPair(row)

  const { underlying0, underlying1, BalanceLPAmount, value1, value0, isLoading, isError } = usePoolPosition()
  // const {
  //   underlying1: stakedUnderlying1,
  //   underlying0: stakedUnderlying0,
  //   value0: stakedValue0,
  //   value1: stakedValue1,
  // } = usePoolPositionStaked()

  // const { pendingRewards, rewardTokens, values } = usePoolPositionRewards()

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
              <Typography variant="sm" weight={500} className="flex gap-1 text-slate-50">
                {token0.symbol} <span className="text-slate-500">/</span> {token1.symbol}
              </Typography>
              <Typography variant="xxs" className="text-slate-400">
                Dozer Farm
              </Typography>
            </div>
          </div>
          <Typography variant="xs" weight={600} className="flex gap-1.5 items-end text-slate-400">
            {/* <Chip
              color="gray"
              size="sm"
              label={
                row.pair.type === 'CONSTANT_PRODUCT_POOL'
                  ? 'Classic'
                  : row.pair.type === 'STABLE_POOL'
                  ? 'Stable'
                  : // @ts-ignore
                  row.pair.type === 'CONCENTRATED_LIQUIDITY_POOL'
                  ? 'Concentrated'
                  : ''
              }
            /> */}
            Fee {row.feeUSD / 100}%
          </Typography>
        </div>
        <div className="flex flex-col gap-1">
          <Typography variant="sm" weight={600} className="flex gap-3 text-slate-50">
            <span className="text-slate-400">APR:</span> {formatPercent(row.apr)}
          </Typography>
          <Typography variant="xxs" weight={600} className="flex justify-end gap-1 text-slate-50">
            <span className="text-slate-400">Rewards:</span> {formatPercent(row.apr)}
          </Typography>
          <Typography variant="xxs" weight={600} className="flex justify-end gap-1 text-slate-50">
            <span className="text-slate-400">Fees:</span> {formatPercent(row.apr)}
          </Typography>
        </div>
      </div>
      <hr className="my-3 border-t border-slate-200/10" />
      {!isLoading && !isError && underlying0 && underlying1 ? (
        <div className="flex flex-col gap-1.5">
          <Typography variant="xs" className="mb-1 text-slate-500">
            Position
          </Typography>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Currency.Icon currency={token0} width={18} height={18} />
              <Typography variant="sm" weight={600} className="text-slate-50">
                {underlying0?.toSignificant(6) || '0.00'} {token0?.symbol}
              </Typography>
            </div>
            <Typography variant="xs" className="text-slate-400">
              {formatUSD(value0)}
            </Typography>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Currency.Icon currency={token1} width={18} height={18} />
              <Typography variant="sm" weight={600} className="text-slate-50">
                {underlying1?.toSignificant(6) || '0.00'} {token1?.symbol}
              </Typography>
            </div>
            <Typography variant="xs" className="text-slate-400">
              {formatUSD(value1)}
            </Typography>
          </div>
        </div>
      ) : (
        <Typography>Loading ...</Typography>
      )}
      {/* {row.pair.farm && (
        <div className="flex flex-col gap-1.5 mt-4">
          <Typography variant="xs" className="mb-1 text-slate-500">
            Staked Position
          </Typography>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Currency.Icon currency={token0} width={18} height={18} />
              <Typography variant="sm" weight={600} className="text-slate-50">
                {stakedUnderlying0?.toSignificant(6) || '0.00'} {token0?.symbol}
              </Typography>
            </div>
            <Typography variant="xs" className="text-slate-400">
              {formatUSD(stakedValue0)}
            </Typography>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Currency.Icon currency={token1} width={18} height={18} />
              <Typography variant="sm" weight={600} className="text-slate-50">
                {stakedUnderlying1?.toSignificant(6) || '0.00'} {token1?.symbol}
              </Typography>
            </div>
            <Typography variant="xs" className="text-slate-400">
              {formatUSD(stakedValue1)}
            </Typography>
          </div>
        </div>
      )}
      {row.pair.farm && pendingRewards.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-4">
          <Typography variant="xs" className="mb-1 text-slate-500">
            Farmed Rewards
          </Typography>
          {pendingRewards.map((reward, index) => (
            <div className="flex items-center justify-between gap-2" key={index}>
              <div className="flex items-center gap-2">
                <Currency.Icon currency={rewardTokens[index]} width={18} height={18} />
                <Typography variant="sm" weight={600} className="text-slate-50">
                  {reward?.toSignificant(6) || '0.00'} {rewardTokens[index]?.symbol}
                </Typography>
              </div>
              <Typography variant="xs" className="text-slate-400">
                {formatUSD(values[index])}
              </Typography>
            </div>
          ))}
        </div>
      )} */}
      <div className="flex justify-end gap-2 mt-8 mb-2">
        <Link.Internal href={`/${row.id}/remove`} passHref={true}>
          <Button as="a" size="sm" variant="outlined" fullWidth>
            Withdraw
          </Button>
        </Link.Internal>
        <Link.Internal href={`/${row.id}/add`} passHref={true}>
          <Button as="a" size="sm" fullWidth>
            Deposit
          </Button>
        </Link.Internal>
      </div>
    </div>
  )
}
