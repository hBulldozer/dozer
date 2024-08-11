import { Pair } from '@dozer/api'
import { ColumnDef } from '@tanstack/react-table'
import React from 'react'

import { TokenMiniChartCell } from './TokenMiniChartCell'
import { TokenChangeCell } from './TokenChangeCell'
import { TokenPriceCell } from './TokenPriceCell'
import { TokenNameCell } from './TokenNameCell'
import { TokenTVLCell } from './TokenTVLCell'
import { TokenVolume24hCell } from './TokenVolume24hCell'
import { TokenMarketCapCell } from './TokenMarketCapCell'

const ICON_SIZE = 26
const PAGE_SIZE = 20

export const CHART_COLUMN: ColumnDef<Pair, unknown> = {
  id: 'chart',
  header: '',
  cell: (props) => <TokenMiniChartCell row={props.row.original} />,
  size: 100,
  meta: {
    skeleton: <div className="rounded-full bg-stone-700 w-[26px] h-[26px] animate-pulse" />,
  },
}

export const NAME_COLUMN: ColumnDef<Pair, unknown> = {
  id: 'name',
  header: 'Name',
  cell: (props) => <TokenNameCell row={props.row.original} />,
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
  cell: (props) => <TokenTVLCell row={props.row.original} />,
  size: 100,
  meta: {
    className: 'justify-end',
    skeleton: <div className="rounded-full bg-stone-700 w-full h-[20px] animate-pulse" />,
  },
}

export const CHANGE_COLUMN: ColumnDef<Pair, unknown> = {
  id: 'change',
  header: 'Change',
  cell: (props) => <TokenChangeCell row={props.row.original} />,
  size: 100,
  meta: {
    className: 'justify-end',
    skeleton: <div className="rounded-full bg-stone-700 w-full h-[20px] animate-pulse" />,
  },
}

export const VOLUME_COLUMN: ColumnDef<Pair, unknown> = {
  id: 'volume',
  header: 'Volume (24h)',
  cell: (props) => <TokenVolume24hCell row={props.row.original} />,
  accessorFn: (row) => row.volumeUSD,
  size: 100,
  meta: {
    className: 'justify-end',
    skeleton: <div className="rounded-full bg-stone-700 w-full h-[20px] animate-pulse" />,
  },
}

export const MARKETCAP_COLUMN: ColumnDef<Pair, unknown> = {
  id: 'marketcap',
  header: 'Market Cap',
  cell: (props) => <TokenMarketCapCell row={props.row.original} />,
  size: 100,
  meta: {
    className: 'justify-end',
    skeleton: <div className="rounded-full bg-stone-700 w-full h-[20px] animate-pulse" />,
  },
}

export const PRICE_COLUMN: ColumnDef<Pair, unknown> = {
  header: 'Price',
  id: 'price',
  // accessorFn: (row) => row.fees24h,
  cell: (props) => <TokenPriceCell row={props.row.original} />,
  size: 100,
  meta: {
    className: 'justify-end',
    skeleton: <div className="rounded-full bg-stone-700 w-full h-[20px] animate-pulse" />,
  },
}
