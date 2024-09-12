import { Pair } from '@dozer/api'
import { ColumnDef } from '@tanstack/react-table'
import React from 'react'

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
  size: 160,
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

export const APR_COLUMN: ColumnDef<Pair, unknown> = {
  id: 'apr',
  header: 'APR',
  accessorFn: (row) => row.apr,
  cell: (props) => <PairAPRCell row={props.row.original} />,
  size: 100,
  meta: {
    className: 'justify-end',
    skeleton: <div className="rounded-full bg-stone-700 w-full h-[20px] animate-pulse" />,
  },
}

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
