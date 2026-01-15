import { Pair } from '@dozer/api'
import { ColumnDef } from '@tanstack/react-table'
import React from 'react'
import { InformationCircleIcon } from '@heroicons/react/24/solid'
import { Tooltip, Typography } from '@dozer/ui'

import { PairAPRCell } from './PairAPRCell'
import { PairChainCell } from './PairChainCell'
import { PairFees24hCell } from './PairFees24hCell'
import { PairNameCell } from './PairNameCell'
import { PairTVLCell } from './PairTVLCell'
import { PairVolume24hCell } from './PairVolume24hCell'

const ICON_SIZE = 26
const PAGE_SIZE = 20

const NETWORK_COLUMN: ColumnDef<Pair, unknown> = {
  id: 'network',
  header: 'Network',
  cell: (props) => <PairChainCell row={props.row.original} />,
  size: 50,
  meta: {
    skeleton: <div className="rounded-full bg-stone-700 w-[26px] h-[26px] animate-pulse" />,
  },
}

export const NAME_COLUMN: ColumnDef<Pair, unknown> = {
  id: 'name',
  header: 'Name',
  cell: (props) => <PairNameCell row={props.row.original} />,
  size: 180,
  meta: {
    skeleton: (
      <div className="flex items-center w-full gap-2">
        <div className="flex items-center">
          <div className="rounded-full bg-stone-700 w-[26px] h-[26px] animate-pulse" />
          <div className="rounded-full bg-stone-700 w-[26px] h-[26px] animate-pulse -ml-[12px]" />
        </div>
        <div className="flex flex-col w-full">
          <div className="rounded-full bg-stone-700 w-full h-[20px] animate-pulse" />
        </div>
      </div>
    ),
  },
}

export const TVL_COLUMN: ColumnDef<Pair, unknown> = {
  header: 'TVL',
  id: 'liquidityUSD',
  accessorFn: (row) => row.liquidityUSD,
  cell: (props) => <PairTVLCell row={props.row.original} />,
  size: 100,
  meta: {
    className: 'justify-end',
    skeleton: <div className="rounded-full bg-stone-700 w-full h-[20px] animate-pulse" />,
  },
}

export const APY_COLUMN: ColumnDef<Pair, unknown> = {
  id: 'apy',
  header: () => (
    <div className="flex items-center justify-end gap-1">
      <span>APY</span>
      <Tooltip
        button={<InformationCircleIcon width={14} height={14} className="text-stone-400 cursor-help" />}
        panel={
          <div className="flex flex-col gap-2 p-2 max-w-xs">
            <Typography variant="xs" weight={600} className="text-stone-200">
              APY Calculation
            </Typography>
            <Typography variant="xs" className="text-stone-400">
              APY (Annual Percentage Yield) is calculated using the compound interest formula based on the last 24
              hours of trading fees:
            </Typography>
            <Typography variant="xs" className="text-stone-300 font-mono bg-stone-900 p-2 rounded">
              APY = (1 + daily_rate)^365 - 1
            </Typography>
            <Typography variant="xs" className="text-stone-400">
              Where daily_rate = (24h Fees) / (Total Liquidity)
            </Typography>
            <Typography variant="xs" className="text-stone-500 italic">
              Note: APY assumes fees are compounded daily and may vary based on trading activity.
            </Typography>
          </div>
        }
        placement="bottom"
      >
        <></>
      </Tooltip>
    </div>
  ),
  accessorFn: (row) => row.apy,
  cell: (props) => <PairAPRCell row={props.row.original} />,
  size: 100,
  meta: {
    className: 'justify-end',
    skeleton: <div className="rounded-full bg-stone-700 w-full h-[20px] animate-pulse" />,
  },
}

// Keep old export for backwards compatibility
export const APR_COLUMN = APY_COLUMN

export const VOLUME_COLUMN: ColumnDef<Pair, unknown> = {
  id: 'volume',
  header: 'Volume (24h)',
  accessorFn: (row) => row.volumeUSD,
  cell: (props) => <PairVolume24hCell row={props.row.original} />,
  size: 100,
  meta: {
    className: 'justify-end',
    skeleton: <div className="rounded-full bg-stone-700 w-full h-[20px] animate-pulse" />,
  },
}

export const FEES_COLUMN: ColumnDef<Pair, unknown> = {
  header: 'Fees (24h)',
  accessorFn: (row) => row.feeUSD,
  id: 'fees',
  // accessorFn: (row) => row.fees24h,
  cell: (props) => <PairFees24hCell row={props.row.original} />,
  size: 100,
  meta: {
    className: 'justify-end',
    skeleton: <div className="rounded-full bg-stone-700 w-full h-[20px] animate-pulse" />,
  },
}
